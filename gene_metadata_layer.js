/**
 * gene_metadata_layer.js
 *
 * 벼 유전자 연구결과 메타데이터 레이어
 * - Europe PMC / NCBI E-utils / UniProt 다중 소스 fallback
 * - IndexedDB 영속 캐시 (TTL 30일)
 * - 증거 수준 태깅 (QTL / GWAS / KO / OE / CRISPR)
 * - 배치 조회 + 자연어 키워드 검색
 *
 * 사용:
 *   const meta = await GeneMetadata.get('sd1');
 *   // meta.publications, meta.traits, meta.keywords, meta.summary
 *
 * 브라우저 전역: window.GeneMetadata
 */
(function (global) {
    'use strict';

    // ==================== 설정 ====================
    const DB_NAME = 'rda_gene_meta';
    const DB_VERSION = 1;
    const STORE = 'genes';
    const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일
    const EUROPE_PMC_URL = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
    const NCBI_EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    const UNIPROT_URL = 'https://rest.uniprot.org/uniprotkb/search';
    const RICE_ORGANISM_FILTER = '(Oryza sativa OR rice)';
    const FETCH_TIMEOUT_MS = 12000;
    const NCBI_MIN_INTERVAL_MS = 350; // ≈ 3 req/s

    // ==================== IndexedDB 캐시 ====================
    let _dbPromise = null;
    function openDB() {
        if (_dbPromise) return _dbPromise;
        _dbPromise = new Promise((resolve, reject) => {
            if (!global.indexedDB) {
                console.warn('[GeneMetadata] IndexedDB 미지원 - 메모리 캐시만 사용');
                resolve(null);
                return;
            }
            const req = global.indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE, { keyPath: 'symbol' });
                }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => {
                console.warn('[GeneMetadata] IndexedDB 오픈 실패:', e.target.error);
                resolve(null);
            };
        });
        return _dbPromise;
    }

    async function cacheGet(symbol) {
        const db = await openDB();
        if (!db) return _memCache.get(symbol.toLowerCase()) || null;
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE, 'readonly');
                const req = tx.objectStore(STORE).get(symbol.toLowerCase());
                req.onsuccess = () => {
                    const v = req.result;
                    if (!v) return resolve(null);
                    if (Date.now() - (v.fetchedAt || 0) > TTL_MS) return resolve(null);
                    resolve(v);
                };
                req.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    }

    async function cacheSet(symbol, data) {
        const entry = Object.assign({}, data, {
            symbol: symbol.toLowerCase(),
            symbolOriginal: symbol,
            fetchedAt: Date.now()
        });
        _memCache.set(symbol.toLowerCase(), entry);
        const db = await openDB();
        if (!db) return;
        try {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).put(entry);
        } catch (e) {
            console.warn('[GeneMetadata] 캐시 쓰기 실패:', e);
        }
    }

    async function cacheClear() {
        _memCache.clear();
        const db = await openDB();
        if (!db) return;
        try {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).clear();
        } catch (e) {
            console.warn('[GeneMetadata] 캐시 클리어 실패:', e);
        }
    }

    async function cacheList() {
        const db = await openDB();
        if (!db) return Array.from(_memCache.values());
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE, 'readonly');
                const req = tx.objectStore(STORE).getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => resolve([]);
            } catch (e) {
                resolve([]);
            }
        });
    }

    const _memCache = new Map();

    // ==================== NCBI rate limiter ====================
    let _ncbiLast = 0;
    async function ncbiThrottle() {
        const now = Date.now();
        const wait = NCBI_MIN_INTERVAL_MS - (now - _ncbiLast);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        _ncbiLast = Date.now();
    }

    // ==================== fetch helper (timeout) ====================
    async function fetchJSON(url, opts = {}) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), opts.timeout || FETCH_TIMEOUT_MS);
        try {
            const res = await fetch(url, { signal: ctrl.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } finally {
            clearTimeout(t);
        }
    }

    // ==================== 증거 수준 태거 ====================
    const EVIDENCE_PATTERNS = [
        { tag: 'CRISPR',  weight: 5, re: /\b(CRISPR|Cas9|Cas12|base[- ]edit|prime[- ]edit|knockout via)\b/i },
        { tag: 'KO',      weight: 4, re: /\b(knock[- ]?out|knockdown|loss[- ]of[- ]function|T-DNA insertion|RNAi|antisense)\b/i },
        { tag: 'OE',      weight: 4, re: /\b(over[- ]?express|gain[- ]of[- ]function|transgenic line)\b/i },
        { tag: 'GWAS',    weight: 3, re: /\b(GWAS|genome[- ]wide association)\b/i },
        { tag: 'QTL',     weight: 3, re: /\b(QTL|quantitative trait loc(i|us)|fine[- ]mapping)\b/i },
        { tag: 'NIL',     weight: 3, re: /\b(near[- ]isogenic line|NIL|introgression line)\b/i },
        { tag: 'EXPR',    weight: 2, re: /\b(expression profil|RT[- ]?(q)?PCR|RNA[- ]?seq)\b/i },
    ];
    function tagEvidence(text) {
        if (!text) return { level: 'unknown', tags: [], score: 0 };
        const tags = [];
        let score = 0;
        for (const p of EVIDENCE_PATTERNS) {
            if (p.re.test(text)) {
                tags.push(p.tag);
                score += p.weight;
            }
        }
        const level = score >= 4 ? 'strong' : score >= 2 ? 'moderate' : score > 0 ? 'weak' : 'unknown';
        return { level, tags, score };
    }

    // ==================== 형질/키워드 추출 ====================
    const TRAIT_PATTERNS = [
        { trait: 'yield',          re: /\b(yield|grain number|panicle|spikelet|productivity)\b/i },
        { trait: 'plant_height',   re: /\b(plant height|dwarf|semi[- ]?dwarf|stature|culm length)\b/i },
        { trait: 'heading',        re: /\b(heading|flowering time|photoperiod|Hd[0-9]+)\b/i },
        { trait: 'grain_quality',  re: /\b(amylose|chalkiness|grain quality|palatability|fragran|aromat)\b/i },
        { trait: 'grain_size',     re: /\b(grain (length|width|weight|size)|seed size)\b/i },
        { trait: 'blast',          re: /\b(blast|Magnaporthe|Pyricularia|Pi[0-9]+)\b/i },
        { trait: 'bacterial_blight', re: /\b(bacterial blight|Xanthomonas|Xa[0-9]+)\b/i },
        { trait: 'bph',            re: /\b(brown planthopper|Nilaparvata|Bph[0-9]+)\b/i },
        { trait: 'drought',        re: /\b(drought|water deficit|osmotic stress)\b/i },
        { trait: 'cold',           re: /\b(cold|chilling|low temperature)\b/i },
        { trait: 'heat',           re: /\b(heat stress|high temperature|thermotolerance)\b/i },
        { trait: 'salt',           re: /\b(salt|saline|salinity|NaCl)\b/i },
        { trait: 'submergence',    re: /\b(submergence|flooding|anaerobic)\b/i },
        { trait: 'nitrogen',       re: /\b(nitrogen use efficiency|NUE|ammonium|nitrate)\b/i },
        { trait: 'root',           re: /\b(root architecture|root system|crown root|lateral root)\b/i },
        { trait: 'shattering',     re: /\b(shattering|abscission|seed dispersal)\b/i },
    ];
    function extractTraits(text) {
        if (!text) return [];
        const found = new Set();
        for (const p of TRAIT_PATTERNS) if (p.re.test(text)) found.add(p.trait);
        return Array.from(found);
    }

    const KEYWORD_MAP = {
        'transcription factor': '전사인자', 'kinase': '키나제', 'phosphatase': '포스파타제',
        'receptor': '수용체', 'transporter': '수송체', 'hormone': '호르몬',
        'gibberellin': '지베렐린', 'auxin': '옥신', 'abscisic acid': 'ABA',
        'jasmonate': '자스몬산', 'brassinosteroid': 'BR', 'cytokinin': '시토키닌',
        'resistance': '저항성', 'tolerance': '내성', 'defense': '방어',
        'development': '발달', 'biosynthesis': '생합성', 'signaling': '신호전달',
        'photoperiod': '광주기성', 'flowering': '개화', 'grain': '종실',
        'panicle': '이삭', 'tiller': '분얼', 'root': '뿌리', 'leaf': '잎'
    };
    function extractKeywords(text) {
        if (!text) return [];
        const lower = text.toLowerCase();
        const out = [];
        for (const [en, ko] of Object.entries(KEYWORD_MAP)) {
            if (lower.includes(en)) out.push({ en, ko });
            if (out.length >= 8) break;
        }
        return out;
    }

    // ==================== 데이터 소스: Europe PMC ====================
    async function fetchEuropePMC(symbol) {
        const q = `("${symbol}" AND ${RICE_ORGANISM_FILTER})`;
        const url = `${EUROPE_PMC_URL}?query=${encodeURIComponent(q)}&format=json&resultType=core&pageSize=8&sort=CITED%20desc`;
        const data = await fetchJSON(url);
        const list = (data.resultList && data.resultList.result) || [];
        const pubs = list.map((r) => {
            const abs = r.abstractText || '';
            const ev = tagEvidence((r.title || '') + ' ' + abs);
            return {
                pmid: r.pmid || null,
                pmcid: r.pmcid || null,
                doi: r.doi || null,
                title: r.title || '',
                authors: r.authorString || '',
                year: r.pubYear ? parseInt(r.pubYear, 10) : null,
                journal: r.journalTitle || r.journalInfo?.journal?.title || '',
                abstract: abs,
                citedByCount: r.citedByCount || 0,
                evidence: ev,
                source: 'europepmc'
            };
        });
        return pubs;
    }

    // ==================== 데이터 소스: NCBI Gene ESummary ====================
    async function fetchNCBIGene(symbol) {
        await ncbiThrottle();
        const search = `${NCBI_EUTILS}/esearch.fcgi?db=gene&term=${encodeURIComponent(symbol)}[Gene%20Name]%20AND%20Oryza%20sativa[Organism]&retmode=json&retmax=3`;
        const s = await fetchJSON(search);
        const ids = s.esearchresult?.idlist || [];
        if (!ids.length) return null;
        await ncbiThrottle();
        const sum = await fetchJSON(`${NCBI_EUTILS}/esummary.fcgi?db=gene&id=${ids[0]}&retmode=json`);
        const g = sum.result?.[ids[0]];
        if (!g) return null;
        return {
            ncbiId: ids[0],
            description: g.description || '',
            summary: g.summary || '',
            otheraliases: g.otheraliases || '',
            maplocation: g.maplocation || ''
        };
    }

    // ==================== 데이터 소스: UniProt (단백질 기능) ====================
    async function fetchUniProt(symbol) {
        const url = `${UNIPROT_URL}?query=gene:${encodeURIComponent(symbol)}+AND+organism_id:39947&format=json&size=1`;
        const data = await fetchJSON(url);
        const r = data.results?.[0];
        if (!r) return null;
        const proteinName = r.proteinDescription?.recommendedName?.fullName?.value || '';
        const funcs = (r.comments || [])
            .filter((c) => c.commentType === 'FUNCTION')
            .map((c) => (c.texts && c.texts[0]?.value) || '')
            .filter(Boolean);
        return {
            uniprotId: r.primaryAccession || null,
            proteinName,
            function: funcs.join(' ')
        };
    }

    // ==================== 메인: get ====================
    async function get(symbol, opts = {}) {
        if (!symbol || typeof symbol !== 'string') throw new Error('symbol 필요');
        const key = symbol.trim();
        if (!key) throw new Error('symbol 필요');

        if (!opts.bypassCache) {
            const cached = await cacheGet(key);
            if (cached) {
                console.log(`[GeneMetadata] 캐시 히트: ${key}`);
                return cached;
            }
        }

        console.log(`[GeneMetadata] API 조회 시작: ${key}`);
        const sources = [];
        let publications = [];
        let summary = '';
        let proteinName = '';
        let proteinFunction = '';
        let ncbiInfo = null;

        // 1) Europe PMC (메인)
        try {
            publications = await fetchEuropePMC(key);
            if (publications.length) sources.push('europepmc');
        } catch (e) {
            console.warn(`[GeneMetadata] Europe PMC 실패 (${key}):`, e.message);
        }

        // 2) NCBI Gene (요약)
        try {
            ncbiInfo = await fetchNCBIGene(key);
            if (ncbiInfo) {
                sources.push('ncbi-gene');
                summary = ncbiInfo.summary || ncbiInfo.description || '';
            }
        } catch (e) {
            console.warn(`[GeneMetadata] NCBI Gene 실패 (${key}):`, e.message);
        }

        // 3) UniProt (단백질)
        if (!summary || !proteinFunction) {
            try {
                const up = await fetchUniProt(key);
                if (up) {
                    sources.push('uniprot');
                    proteinName = up.proteinName || '';
                    proteinFunction = up.function || '';
                    if (!summary) summary = proteinFunction;
                }
            } catch (e) {
                console.warn(`[GeneMetadata] UniProt 실패 (${key}):`, e.message);
            }
        }

        // 파생 필드
        const allText = [summary, proteinName, proteinFunction]
            .concat(publications.map((p) => (p.title || '') + ' ' + (p.abstract || '')))
            .join(' ');
        const traits = extractTraits(allText);
        const keywords = extractKeywords(allText);

        // 최상위 증거 수준 (논문들 중 최강)
        const topEvidence = publications.reduce(
            (acc, p) => (p.evidence && p.evidence.score > acc.score ? p.evidence : acc),
            { level: 'unknown', tags: [], score: 0 }
        );

        const result = {
            symbol: key,
            summary,
            proteinName,
            proteinFunction,
            ncbiId: ncbiInfo?.ncbiId || null,
            publications,
            traits,
            keywords,
            evidence: topEvidence,
            sources,
            fetchedAt: Date.now()
        };

        await cacheSet(key, result);
        console.log(`[GeneMetadata] 저장: ${key} (논문 ${publications.length}편, 소스 ${sources.join('+')})`);
        return result;
    }

    // ==================== 배치 조회 ====================
    async function batchLookup(symbols, opts = {}) {
        const concurrency = opts.concurrency || 3;
        const out = [];
        const queue = symbols.slice();
        const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
            while (queue.length) {
                const s = queue.shift();
                try {
                    const r = await get(s, opts);
                    out.push(r);
                    if (opts.onProgress) opts.onProgress(out.length, symbols.length, s);
                } catch (e) {
                    console.warn(`[GeneMetadata] 배치 실패 ${s}:`, e.message);
                    out.push({ symbol: s, error: e.message });
                }
            }
        });
        await Promise.all(workers);
        return out;
    }

    // ==================== 키워드 검색 (캐시 내) ====================
    async function search(query) {
        if (!query) return [];
        const q = query.toLowerCase();
        const all = await cacheList();
        const scored = all
            .map((g) => {
                let score = 0;
                if (g.symbol && g.symbol.toLowerCase().includes(q)) score += 10;
                if (g.proteinName && g.proteinName.toLowerCase().includes(q)) score += 5;
                if (g.summary && g.summary.toLowerCase().includes(q)) score += 3;
                if (g.traits && g.traits.some((t) => t.toLowerCase().includes(q))) score += 4;
                if (g.keywords && g.keywords.some((k) => (k.en + k.ko).toLowerCase().includes(q))) score += 2;
                for (const p of g.publications || []) {
                    if (p.title && p.title.toLowerCase().includes(q)) score += 1;
                    if (p.abstract && p.abstract.toLowerCase().includes(q)) score += 0.5;
                }
                return { gene: g, score };
            })
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((x) => x.gene);
        console.log(`[GeneMetadata] 검색 "${query}" → ${scored.length}건`);
        return scored;
    }

    // ==================== 캐시 통계 ====================
    async function stats() {
        const all = await cacheList();
        const byTrait = {};
        for (const g of all) for (const t of g.traits || []) byTrait[t] = (byTrait[t] || 0) + 1;
        return {
            totalGenes: all.length,
            totalPublications: all.reduce((s, g) => s + (g.publications?.length || 0), 0),
            byTrait,
            oldest: all.reduce((m, g) => Math.min(m, g.fetchedAt || Infinity), Infinity),
            newest: all.reduce((m, g) => Math.max(m, g.fetchedAt || 0), 0)
        };
    }

    // ==================== 공개 API ====================
    global.GeneMetadata = {
        get,
        batchLookup,
        search,
        tagEvidence,
        extractTraits,
        extractKeywords,
        clearCache: cacheClear,
        stats,
        _cacheList: cacheList,
        _version: '0.1.0'
    };
})(typeof window !== 'undefined' ? window : this);
