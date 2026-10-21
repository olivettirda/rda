/**
 * design.js — ASP + Common 프라이머 설계 파이프라인 (사양 §5, §6)
 *
 * 흐름
 *  1. 레코드를 Forward/Reverse 두 방향으로 정렬(orient)
 *  2. 각 방향에서: ASP 3′ 말단 열 결정 → 대립유전자별 ASP(Tm 으로 길이 결정) → tail 부착
 *  3. 반대 가닥(s3 역상보)에서 Common 후보 열거 → 마스크·3′패턴·Tm·반복·LC·다이머·겹침 필터
 *  4. amplicon 크기/Tm, ASP–Common Tm 차, 점수화 후 정렬
 *
 * Tm 은 항상 tail 을 뗀 본체로 계산한다(사양 §3.4).
 */
import { revcomp, gcPercent, applyCase, baseMatchesIupac, bisulfiteConvert, normalizeBase } from './seq.js';
import { meltingTemp, ampliconTm, makeConditions, TM_PRESETS } from './tm.js';
import { linguisticComplexity, findSimpleRepeat } from './complexity.js';
import { findDimer, findSelfDimer } from './dimer.js';
import { buildMask, HARD_MASK, SOFT_MASK, maskFlagsIn, describeMask } from './mask.js';

export const DEFAULT_TAILS = Object.freeze([
  Object.freeze({ name: 'FAM', seq: 'GAAGGTGACCAAGTTCATGCT' }),
  Object.freeze({ name: 'HEX', seq: 'GAAGGTCGGAGTCAACGGATT' }),
]);

/** 기본 파라미터 (사양 §9 + 사용자 표준) */
export const DEFAULT_PARAMS = Object.freeze({
  preset: 'bioneer',                       // 'bioneer' | 'primerdigital' | 'custom'
  custom: Object.freeze({ na_mM: 50, mg_mM: 0, oligo_nM: 250, wallaceBelow: 15 }),
  aspMinLen: 18, aspMaxLen: 25,
  commonMinLen: 18, commonMaxLen: 25,
  tmMin: 57, tmMax: 62,
  tmDiffMax: 3,
  gcMin: 40, gcMax: 60,
  ampliconMin: 50, ampliconMax: 150, ampliconHardMax: 300,
  snpOffset: 1,
  endPattern: 'n',
  minLC: 70,
  dimerThreshold: 6,
  dimerIncludeTail: true,
  maskRepeats: true,
  maskLowComplexity: true,
  allowOverlap: false,
  overlapTol: 10,
  useTails: true,
  tails: DEFAULT_TAILS,
  bisulfite: false,
  maxCommon: 12,
  maxReport: 60,
});

export function mergeParams(params = {}) {
  const p = { ...DEFAULT_PARAMS, ...params };
  p.custom = { ...DEFAULT_PARAMS.custom, ...(params.custom || {}) };
  p.tails = (params.tails || DEFAULT_TAILS).map((t) => ({ name: t.name, seq: String(t.seq || '').toUpperCase().replace(/[^ACGT]/g, '') }));
  return p;
}

/** 프리셋 → Tm 계산 조건 */
export function resolveConditions(p) {
  if (p.preset === 'custom') return makeConditions(p.custom);
  return makeConditions(TM_PRESETS[p.preset] || TM_PRESETS.bioneer);
}

/** 3′-end 패턴 문자열 → 패턴 배열 ('n' 또는 빈 값이면 제약 없음) */
export function parseEndPatterns(text) {
  return String(text ?? '')
    .split(/[\s,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s && !/^N+$/.test(s));
}

/**
 * 레코드를 설계 방향에 맞게 정렬한다. 'R' 이면 전체를 역상보해 s1↔s3 를 바꾼다.
 */
export function orientRecord(rec, dir, bisulfite = false) {
  const n1 = rec.s1.length, n3 = rec.s3.length;
  const flipPos = (list, n) => list.map((p) => n - 1 - p);
  const flipRange = (list, n) => list.map(([a, b]) => [n - b, n - a]);
  let o;
  if (dir === 'F') {
    o = {
      dir, s1: rec.s1, s3: rec.s3,
      alleles: rec.alleles.map((a) => ({ seq: a.seq, label: a.label })),
      iupacS1: [...rec.iupacS1], iupacS3: [...rec.iupacS3],
      excludedS1: rec.excludedS1.map((r) => [...r]), excludedS3: rec.excludedS3.map((r) => [...r]),
      variantS1: rec.variantS1.map((r) => [...r]), variantS3: rec.variantS3.map((r) => [...r]),
    };
  } else {
    o = {
      dir, s1: revcomp(rec.s3), s3: revcomp(rec.s1),
      alleles: rec.alleles.map((a) => ({ seq: revcomp(a.seq), label: a.label })),
      iupacS1: flipPos(rec.iupacS3, n3), iupacS3: flipPos(rec.iupacS1, n1),
      excludedS1: flipRange(rec.excludedS3, n3), excludedS3: flipRange(rec.excludedS1, n1),
      variantS1: flipRange(rec.variantS3, n3), variantS3: flipRange(rec.variantS1, n1),
    };
  }
  if (bisulfite) {
    const firstAfterS1 = o.alleles[0].seq[0] || o.s3[0] || '';
    o.s1 = bisulfiteConvert(o.s1, firstAfterS1);
    o.alleles = o.alleles.map((a) => ({ seq: bisulfiteConvert(a.seq, o.s3[0] || ''), label: a.label }));
    o.s3 = bisulfiteConvert(o.s3, '');
  }
  return o;
}

/**
 * ASP 3′ 말단 열 찾기 (사양 §5-1).
 * allele_i + s3 를 나란히 놓고 길이 snpOffset 창을 밀며 대립유전자 간 서로 다른 열 수가 최대인 첫 창을 고른다.
 * @returns {{ endCol:number, diffCount:number }} endCol = 창의 마지막 열 (allele+s3 좌표, 0-based)
 */
export function findAspEndColumn(alleleSeqs, s3, snpOffset = 1) {
  const offset = Math.max(1, Math.floor(snpOffset));
  const strs = alleleSeqs.map((a) => a + s3);
  const minLen = Math.min(...strs.map((s) => s.length));
  let bestStart = 0, bestScore = -1;
  for (let start = 0; start + offset <= minLen; start++) {
    let score = 0;
    for (let c = start; c < start + offset; c++) {
      const first = strs[0][c];
      if (strs.some((s) => s[c] !== first)) score++;
    }
    if (score > bestScore) { bestScore = score; bestStart = start; }
    if (bestScore === offset) break;
  }
  return { endCol: bestStart + offset - 1, diffCount: Math.max(0, bestScore) };
}

function fmtRange(lo, hi, unit = '') {
  return `${lo}–${hi}${unit}`;
}

/** 한 방향(F 또는 R)의 설계 */
export function designStrand(oriented, p, cond) {
  const { dir, s1, s3, alleles } = oriented;
  const n1 = s1.length;
  const warnings = [];
  const otherDir = dir === 'F' ? 'R' : 'F';

  // 좌표 변환: 이 방향의 allele-i 템플릿 0-based → 정방향(원본) 1-based
  const totalLen = (i) => n1 + alleles[i].seq.length + s3.length;
  const toForward = (i, start0, end0) => {
    const L = totalLen(i);
    return dir === 'F' ? { start: start0 + 1, end: end0 } : { start: L - end0 + 1, end: L - start0 };
  };

  const { endCol, diffCount } = findAspEndColumn(alleles.map((a) => a.seq), s3, p.snpOffset);
  if (diffCount === 0) {
    return { dir, asps: [], commons: [], warnings: ['대립유전자 간 차이가 없어 ASP 를 설계할 수 없습니다.'], template: null };
  }

  // 대립유전자별 템플릿과 마스크
  const templates = alleles.map((al) => {
    const T = s1 + al.seq + s3;
    const off = n1 + al.seq.length;
    const mask = buildMask(T, {
      repeat: p.maskRepeats, lowComplexity: p.maskLowComplexity,
      iupacPositions: [...oriented.iupacS1, ...oriented.iupacS3.map((x) => off + x)],
      excludedRanges: [...oriented.excludedS1, ...oriented.excludedS3.map(([a, b]) => [off + a, off + b])],
      variantRanges: [...oriented.variantS1, ...oriented.variantS3.map(([a, b]) => [off + a, off + b])],
    });
    return { T, mask, off };
  });

  // tail 배정 (사양 §5-4): 대립유전자 수가 tail 수를 넘으면 tail 없이 + 경고
  let tailsFor = alleles.map((_, i) => (p.useTails ? p.tails[i] || null : null));
  if (p.useTails && alleles.length > p.tails.length) {
    tailsFor = alleles.map(() => null);
    warnings.push(`대립유전자가 ${alleles.length}개라 tail(${p.tails.length}개)을 붙이지 않았습니다.`);
  }

  // ---- ASP ----
  const asps = alleles.map((al, i) => {
    const { T, mask } = templates[i];
    const e = n1 + endCol + 1; // exclusive
    const aspWarnings = [];
    const cands = [];
    for (let L = p.aspMinLen; L <= p.aspMaxLen; L++) {
      const a = e - L;
      if (a < 0) break;
      const body = T.slice(a, e);
      cands.push({ L, a, body, tm: meltingTemp(body, cond), hard: maskFlagsIn(mask, a, e, HARD_MASK) });
    }
    if (!cands.length) {
      warnings.push(`${al.label}: 5′ flank 가 짧아 ASP(최소 ${p.aspMinLen} nt)를 만들 수 없습니다.`);
      return null;
    }
    let pool = cands.filter((c) => !c.hard);
    let avoided = pool.length !== cands.length && pool.length > 0;
    if (!pool.length) {
      pool = cands;
      avoided = false;
      aspWarnings.push('제외구역/주변 변이를 피할 수 없어 겹친 채 설계했습니다.');
    }
    let pick = pool.find((c) => c.tm >= p.tmMin);
    if (!pick) {
      pick = pool[pool.length - 1];
      const why = avoided ? `제외구역/주변 변이를 피한 최대 길이 ${pick.L} nt` : `최대 길이 ${pick.L} nt`;
      aspWarnings.push(`${why} 에서도 Tm ${pick.tm.toFixed(1)} °C 로 하한(${p.tmMin} °C) 미달입니다.`);
    } else if (pick.tm > p.tmMax) {
      aspWarnings.push(`최소 길이에서도 Tm ${pick.tm.toFixed(1)} °C 로 상한(${p.tmMax} °C)을 넘습니다.`);
    }
    const { a, L, body, tm } = pick;
    const soft = maskFlagsIn(mask, a, e, SOFT_MASK);
    if (soft) aspWarnings.push(`${describeMask(soft).join('/')} 구간과 겹칩니다.`);
    const hardNow = maskFlagsIn(mask, a, e, HARD_MASK);
    if (hardNow && !aspWarnings.some((w) => w.startsWith('제외구역'))) aspWarnings.push(`${describeMask(hardNow).join('/')} 구간과 겹칩니다.`);
    const motif = findSimpleRepeat(body);
    if (motif) aspWarnings.push(`단순반복 ${motif} 포함`);
    const lc = linguisticComplexity(body);
    if (lc < p.minLC) aspWarnings.push(`LC ${lc}% < ${p.minLC}%`);
    const gc = gcPercent(body);
    if (gc < p.gcMin || gc > p.gcMax) aspWarnings.push(`GC ${gc.toFixed(1)}% 가 ${fmtRange(p.gcMin, p.gcMax, '%')} 범위 밖`);

    const upperStart = Math.max(0, n1 - a);
    const upperEnd = Math.min(L, n1 - a + al.seq.length);
    const bodyDisplay = applyCase(body, upperStart, upperEnd);
    const tail = tailsFor[i];
    const full = (tail ? tail.seq : '') + bodyDisplay;
    const oligoForDimer = p.dimerIncludeTail ? full : body;
    const self = findSelfDimer(oligoForDimer, { threshold: p.dimerThreshold });
    if (self && self.isDimer) aspWarnings.push(`자기 다이머 (${self.matches} bp 상보${self.threePrimeA || self.threePrimeB ? ', 3′ 말단 관여' : ''})`);

    const fwd = toForward(i, a, e);
    return {
      kind: 'ASP', dir,
      id: `${dir}_${fwd.start}-${fwd.end}_ASP_${al.label}`,
      alleleIndex: i, allele: al.seq, alleleLabel: al.label,
      tail: tail ? { ...tail } : null,
      body, bodyDisplay, full, fullUpper: full.toUpperCase(),
      length: L, fullLength: full.length,
      tm, gc, lc,
      start0: a, end0: e,               // 이 방향 allele-i 템플릿 0-based [start0, end0)
      start: fwd.start, end: fwd.end,   // 정방향 1-based inclusive
      oligoForDimer,
      selfDimer: self && self.isDimer ? self : null,
      crossDimer: [],
      warnings: aspWarnings,
    };
  });

  // ASP 간 cross-dimer (사양 §5-5: 경고 표시, 탈락 아님)
  const live = asps.filter(Boolean);
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const r = findDimer(live[i].oligoForDimer, live[j].oligoForDimer, { threshold: p.dimerThreshold });
      if (r && r.isDimer) {
        live[i].crossDimer.push({ with: live[j].id, matches: r.matches });
        live[j].crossDimer.push({ with: live[i].id, matches: r.matches });
        live[i].warnings.push(`ASP 간 다이머 (${live[j].alleleLabel}, ${r.matches} bp)`);
        live[j].warnings.push(`ASP 간 다이머 (${live[i].alleleLabel}, ${r.matches} bp)`);
      }
    }
  }

  // ---- Common ----
  const T0 = templates[0].T, mask0 = templates[0].mask, S0 = templates[0].off;
  const patterns = parseEndPatterns(p.endPattern);
  const accepted = [];
  const stats = { scanned: 0, rejected: { pattern: 0, mask: 0, tm: 0, repeat: 0, lc: 0, selfDimer: 0, crossDimer: 0, overlap: 0 } };

  for (let pos = s3.length - p.commonMinLen; pos >= 0; pos--) {
    stats.scanned++;
    if (patterns.length) {
      const ok = patterns.some((pat) => {
        if (pos + pat.length > s3.length) return false;
        const end3 = revcomp(s3.slice(pos, pos + pat.length)); // 프라이머의 마지막 pat.length 염기 (5'→3')
        for (let k = 0; k < pat.length; k++) if (!baseMatchesIupac(end3[k], pat[k])) return false;
        return true;
      });
      if (!ok) { stats.rejected.pattern++; continue; }
    }
    let chosen = null;
    let masked = false, tmHigh = false;
    for (let L = p.commonMinLen; L <= p.commonMaxLen; L++) {
      if (pos + L > s3.length) break;
      if (maskFlagsIn(mask0, S0 + pos, S0 + pos + L)) { masked = true; break; }
      const primer = revcomp(s3.slice(pos, pos + L));
      const tm = meltingTemp(primer, cond);
      if (tm < p.tmMin) continue;
      if (tm > p.tmMax) { tmHigh = true; break; }
      chosen = { L, primer, tm };
      break;
    }
    if (!chosen) {
      if (masked) stats.rejected.mask++; else stats.rejected.tm++;
      continue;
    }
    const { L, primer, tm } = chosen;
    if (findSimpleRepeat(primer)) { stats.rejected.repeat++; continue; }
    const lc = linguisticComplexity(primer);
    if (lc < p.minLC) { stats.rejected.lc++; continue; }
    const self = findSelfDimer(primer, { threshold: p.dimerThreshold });
    if (self && self.isDimer) { stats.rejected.selfDimer++; continue; }
    let cross = false;
    for (const asp of live) {
      const r = findDimer(primer, asp.oligoForDimer, { threshold: p.dimerThreshold });
      if (r && r.isDimer) { cross = true; break; }
    }
    if (cross) { stats.rejected.crossDimer++; continue; }

    const gc = gcPercent(primer);
    const cWarnings = [];
    if (gc < p.gcMin || gc > p.gcMax) cWarnings.push(`GC ${gc.toFixed(1)}% 가 ${fmtRange(p.gcMin, p.gcMax, '%')} 범위 밖`);

    // amplicon (대립유전자별)
    const amplicons = alleles.map((al, i) => {
      const asp = asps[i];
      if (!asp) return null;
      const Si = templates[i].off;
      const right = Si + pos + L;                 // 템플릿상 amplicon 끝(exclusive)
      const tailLen = asp.tail ? asp.tail.seq.length : 0;
      const size = right - asp.start0 + tailLen;
      const seq = (asp.tail ? asp.tail.seq : '') + templates[i].T.slice(asp.start0, right);
      return { label: al.label, size, tm: ampliconTm(seq, cond) };
    }).filter(Boolean);
    const sizes = amplicons.map((a) => a.size);
    const minSize = Math.min(...sizes), maxSize = Math.max(...sizes);
    let ampState = 'ok';
    if (maxSize > p.ampliconHardMax) { ampState = 'err'; cWarnings.push(`amplicon ${maxSize} bp 가 최대 ${p.ampliconHardMax} bp 초과`); }
    else if (minSize < p.ampliconMin || maxSize > p.ampliconMax) { ampState = 'warn'; cWarnings.push(`amplicon ${sizes.join('/')} bp 가 권장 ${fmtRange(p.ampliconMin, p.ampliconMax, ' bp')} 밖`); }

    const tmDiff = live.length ? Math.max(...live.map((a) => Math.abs(a.tm - tm))) : 0;
    if (tmDiff > p.tmDiffMax) cWarnings.push(`ASP 와 Tm 차 ${tmDiff.toFixed(1)} °C > ${p.tmDiffMax} °C`);

    let score = 0;
    if (ampState === 'err') score += 100;
    else if (ampState === 'warn') score += 10;
    if (tmDiff > p.tmDiffMax) score += 20;
    if (gc < p.gcMin || gc > p.gcMax) score += 5;
    score -= lc / 100;
    score += maxSize / 10000;

    const fwd = toForward(0, S0 + pos, S0 + pos + L);
    const cand = {
      kind: 'Common', dir: otherDir,
      id: `${otherDir}_${fwd.start}-${fwd.end}`,
      seq: primer.toLowerCase(), seqUpper: primer, length: L,
      tm, gc, lc, pos,
      start0: S0 + pos, end0: S0 + pos + L,
      start: fwd.start, end: fwd.end,
      amplicons, ampliconLabel: amplicons.map((a) => `${a.label}:${a.size}`).join(' '),
      ampliconTm: amplicons.length ? amplicons[0].tm : NaN,
      ampState, tmDiff, score, warnings: cWarnings,
    };

    if (!p.allowOverlap && accepted.length) {
      const last = accepted[accepted.length - 1];
      if (last.pos - pos < p.overlapTol) {
        if (cand.lc > last.lc) accepted[accepted.length - 1] = cand;
        stats.rejected.overlap++;
        continue;
      }
    }
    accepted.push(cand);
  }

  const commons = accepted.slice().sort((a, b) => a.score - b.score || a.pos - b.pos);
  commons.forEach((c, i) => { c.rank = i + 1; });
  if (!commons.length) {
    warnings.push(`조건을 만족하는 Common 프라이머가 없습니다 (스캔 ${stats.scanned}, Tm 탈락 ${stats.rejected.tm}, 마스크 ${stats.rejected.mask}, LC ${stats.rejected.lc}, 다이머 ${stats.rejected.selfDimer + stats.rejected.crossDimer}). Tm 범위나 LC·다이머 조건을 완화해 보세요.`);
  }
  if (live.length && commons.length && commons[0].tmDiff > p.tmDiffMax) {
    warnings.push(`최상위 Common 과 ASP 의 Tm 차가 ${commons[0].tmDiff.toFixed(1)} °C 입니다.`);
  }

  return {
    dir, otherDir,
    template: { s1, s3, alleles: alleles.map((a) => ({ ...a })), T0, length0: T0.length, s3Offset: S0 },
    endCol, asps, commons, stats, warnings,
    mask: Array.from(mask0),
  };
}

/**
 * 마커 하나 설계: Forward/Reverse 두 세트
 */
export function designMarker(record, params = {}) {
  const p = mergeParams(params);
  const cond = resolveConditions(p);
  if (record.error) return { name: record.name, error: record.error, params: p };
  const forward = designStrand(orientRecord(record, 'F', p.bisulfite), p, cond);
  const reverse = designStrand(orientRecord(record, 'R', p.bisulfite), p, cond);
  const warnings = [...(record.warnings || [])];
  return { name: record.name, header: record.header, chrPos: record.chrPos || null, record, params: p, conditions: cond, forward, reverse, warnings };
}

/** 여러 레코드 일괄 설계 */
export function designAll(records, params = {}) {
  return records.map((r) => designMarker(r, params));
}

/** 템플릿 1-based 좌표 → 유전체 좌표 문자열 (SNP 첫 염기 = chrPos.pos) */
export function genomicCoord(result, start, end) {
  if (!result || !result.chrPos || !result.record) return '';
  const n1 = result.record.s1.length;
  const base = result.chrPos.pos - (n1 + 1);
  return `${result.chrPos.chr}:${base + start}-${base + end}`;
}

/** 간단 자기검사용: 염기 문자열 유효성 */
export function isValidTailSeq(seq) {
  const s = String(seq ?? '');
  return s.length === 0 || Array.from(s).every((ch) => ['A', 'C', 'G', 'T'].includes(normalizeBase(ch)));
}
