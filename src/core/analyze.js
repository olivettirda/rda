/**
 * analyze.js — 기존 프라이머 분석 → 설계 조건 추정 (역설계 가이드)
 *
 *  1. 프라이머 목록 파싱 (이름<TAB>서열 / 이름 서열 / FASTA / 서열만)
 *  2. tail 감지(FAM/HEX 또는 사용자 tail) → 본체 분리
 *  3. 본체 Tm(현재 프리셋 + 비교 프리셋), GC, LC, 단순반복, 자기/교차 다이머
 *  4. 템플릿(서열 입력의 마커)이 있으면 양 가닥에서 위치 탐색(≤ 2 미스매치), 역할(ASP/Common) 판정,
 *     3′ 말단이 변이 위치에 있는지, 의도적 미스매치, amplicon 크기
 *  5. 관찰값에서 "비슷하게 설계하려면" 쓸 파라미터와 안내문을 만든다
 */
import { revcomp, gcPercent } from './seq.js';
import { meltingTemp, makeConditions, TM_PRESETS } from './tm.js';
import { linguisticComplexity, findSimpleRepeat } from './complexity.js';
import { findSelfDimer, findDimer } from './dimer.js';
import { DEFAULT_TAILS, mergeParams, resolveConditions } from './design.js';

const SEQ_TOKEN = /^[ACGTUacgtu]{8,}$/;

/** 자유 형식 텍스트 → [{name, seq}] */
export function parsePrimerList(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let pendingName = null;
  let auto = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('>')) { pendingName = line.slice(1).trim().split(/\s+/)[0] || null; continue; }
    const tokens = line.split(/[\s,;]+/).filter(Boolean);
    const seqTokens = tokens.filter((t) => SEQ_TOKEN.test(t));
    if (!seqTokens.length) continue; // 표 머리글 등
    const seq = seqTokens.reduce((a, b) => (b.length > a.length ? b : a));
    let name = pendingName || (tokens[0] !== seq && !SEQ_TOKEN.test(tokens[0]) ? tokens[0] : '');
    pendingName = null;
    if (!name) name = `P${++auto}`;
    out.push({ name, seq: seq.toUpperCase().replace(/U/g, 'T'), raw: line });
  }
  return out;
}

/** 알려진 tail 로 시작하면 분리 (긴 tail 우선). 본체가 8 nt 미만이면 tail 로 보지 않는다 */
export function detectTail(seq, tails = []) {
  const s = String(seq ?? '').toUpperCase();
  const list = [...(tails || []), ...DEFAULT_TAILS]
    .filter((t) => t && t.seq)
    .map((t) => ({ name: t.name, seq: String(t.seq).toUpperCase() }))
    .sort((a, b) => b.seq.length - a.seq.length);
  for (const t of list) {
    if (s.startsWith(t.seq) && s.length - t.seq.length >= 8) return { tail: t, body: s.slice(t.seq.length) };
  }
  return { tail: null, body: s };
}

/**
 * 본체 서열을 레코드 템플릿(대립유전자별, 양 가닥)에서 찾는다. 좌표는 정방향 1-based.
 * @returns {object|null} { strand:'+'|'-', alleleIndex, alleleLabel, start0, end0, start, end,
 *   mismatches, mismatchPositions(본체 5′기준 0-based), coversVariant, threeEndAtVariant, distanceToVariant }
 */
export function locateOnTemplate(body, record, maxMismatch = 2) {
  if (!record || record.error || !body) return null;
  const b = String(body).toUpperCase();
  const n1 = record.s1.length;
  let best = null;
  record.alleles.forEach((al, ai) => {
    const T = (record.s1 + al.seq + record.s3).toUpperCase();
    const vStart = n1, vEnd = n1 + Math.max(1, al.seq.length);
    for (const strand of ['+', '-']) {
      const probe = strand === '+' ? b : revcomp(b);
      for (let p = 0; p + probe.length <= T.length; p++) {
        let mm = 0;
        const pos = [];
        for (let k = 0; k < probe.length; k++) {
          if (T[p + k] !== probe[k]) { mm++; if (mm > maxMismatch) break; pos.push(k); }
        }
        if (mm > maxMismatch) continue;
        const start0 = p, end0 = p + probe.length;
        const three0 = strand === '+' ? end0 - 1 : start0;
        const cand = {
          strand, alleleIndex: ai, alleleLabel: al.label,
          start0, end0, start: start0 + 1, end: end0,
          mismatches: mm,
          mismatchPositions: (strand === '+' ? pos : pos.map((k) => probe.length - 1 - k)).sort((x, y) => x - y),
          coversVariant: start0 < vEnd && end0 > vStart,
          threeEndAtVariant: three0 >= vStart && three0 < vEnd,
          distanceToVariant: Math.min(Math.abs(three0 - vStart), Math.abs(three0 - (vEnd - 1))),
        };
        if (!best || mm < best.mismatches || (mm === best.mismatches && cand.threeEndAtVariant && !best.threeEndAtVariant)) best = cand;
      }
    }
  });
  return best;
}

function rangeOf(arr) {
  return arr.length ? [Math.min(...arr), Math.max(...arr)] : null;
}

/** "18–25" 또는 값이 같으면 "18" */
function spanText(lo, hi, digits = 0) {
  const f = (v) => (digits ? v.toFixed(digits) : String(v));
  return lo === hi ? f(lo) : `${f(lo)}–${f(hi)}`;
}

/**
 * 관찰값 → 추정 조건 + 안내문
 */
export function inferConditions(items, params, x = {}) {
  const notes = [];
  const sug = {};
  const asps = items.filter((i) => i.role === 'ASP');
  const commons = items.filter((i) => i.role === 'Common');
  const unknown = items.filter((i) => i.role === '미확인');
  const known = items.filter((i) => i.role !== '미확인');
  const f1 = (v) => v.toFixed(1);

  // Tm
  const tms = items.map((i) => i.tm).filter(Number.isFinite);
  const tmsAlt = items.map((i) => i.tmAlt).filter(Number.isFinite);
  if (tms.length) {
    const [lo, hi] = rangeOf(tms);
    const [loA, hiA] = rangeOf(tmsAlt);
    const mid = (params.tmMin + params.tmMax) / 2;
    const mainFits = Math.abs((lo + hi) / 2 - mid) <= Math.abs((loA + hiA) / 2 - mid);
    let line = `본체 Tm(tail 제외): ${x.mainLabel} ${spanText(lo, hi, 1)} °C · ${x.altLabel} ${spanText(loA, hiA, 1)} °C.`;
    line += mainFits
      ? ` 현재 프리셋(${x.mainLabel}) 기준 ${Math.floor(lo)}–${Math.ceil(hi)} °C 로 맞춘 설계로 보입니다.`
      : ` ${x.altLabel} 조건에서 ${Math.floor(loA)}–${Math.ceil(hiA)} °C 로 맞춘 설계로 보입니다 → 프리셋을 ${x.altLabel} 로 바꾸길 권합니다.`;
    notes.push({ kind: 'tm', text: line });
    const useLo = mainFits ? lo : loA, useHi = mainFits ? hi : hiA;
    sug.preset = mainFits ? params.preset : x.altKey;
    sug.tmMin = Math.floor(useLo);
    sug.tmMax = Math.ceil(useHi);
    if (sug.tmMax - sug.tmMin < 3) {
      sug.tmMin = Math.floor((useLo + useHi) / 2 - 1.5);
      sug.tmMax = sug.tmMin + 3;
    }
    sug.tmMin = Math.max(37, sug.tmMin);
    sug.tmMax = Math.min(80, sug.tmMax);
  }

  // 길이
  const aspLens = asps.map((a) => a.length);
  if (aspLens.length) {
    const [lo, hi] = rangeOf(aspLens);
    sug.aspMinLen = Math.max(12, lo - 1);
    sug.aspMaxLen = Math.min(60, hi + 1);
    notes.push({ kind: 'len', text: `ASP 본체 길이 ${spanText(lo, hi)} nt (tail 제외) → ASP 길이 ${sug.aspMinLen}–${sug.aspMaxLen} nt.` });
  }
  const cLens = commons.map((c) => c.length);
  if (cLens.length) {
    const [lo, hi] = rangeOf(cLens);
    sug.commonMinLen = Math.max(12, lo - 1);
    sug.commonMaxLen = Math.min(100, hi + 1);
    notes.push({ kind: 'len', text: `Common 길이 ${spanText(lo, hi)} nt → Common 길이 ${sug.commonMinLen}–${sug.commonMaxLen} nt.` });
  }

  // GC
  const gcs = known.map((i) => i.gc).filter(Number.isFinite);
  if (gcs.length) {
    const [lo, hi] = rangeOf(gcs);
    sug.gcMin = Math.max(0, Math.floor(lo) - 5);
    sug.gcMax = Math.min(100, Math.ceil(hi) + 5);
    notes.push({ kind: 'gc', text: `GC ${spanText(Number(lo.toFixed(0)), Number(hi.toFixed(0)))} % → GC 범위 ${sug.gcMin}–${sug.gcMax} %.` });
  }

  // tail
  const tailSeen = [];
  for (const a of asps) if (a.tail && !tailSeen.some((t) => t.seq === a.tail.seq)) tailSeen.push({ name: a.tail.name, seq: a.tail.seq });
  if (tailSeen.length) {
    sug.useTails = true;
    const isLgc = tailSeen.every((t) => DEFAULT_TAILS.some((d) => d.seq === t.seq));
    notes.push({ kind: 'tail', text: `tail 감지: ${tailSeen.map((t) => t.name).join(', ')}${isLgc ? ' (LGC KASP 표준 FAM/HEX)' : ' (사용자 tail — Tail 탭에 반영됩니다)'} → 형광(KASP) 판독.` });
    const sameAsParams = tailSeen.every((t, i) => params.tails[i] && params.tails[i].seq === t.seq);
    if (!sameAsParams) sug.tails = tailSeen;
  } else if (asps.length) {
    sug.useTails = false;
    notes.push({ kind: 'tail', text: 'ASP 에 tail 이 없습니다 → 형광 판독이 아니면 Tail 탭에서 "tail 부착"을 끄거나 겔(Allele sizing) 모드를 쓰세요.' });
  }

  // amplicon
  const sizes = asps.flatMap((a) => (a.amplicons || []).map((m) => m.size));
  if (sizes.length) {
    const [lo, hi] = rangeOf(sizes);
    sug.ampliconMin = Math.max(30, Math.floor((lo * 0.8) / 10) * 10);
    sug.ampliconMax = Math.min(1000, Math.ceil((hi * 1.2) / 10) * 10);
    notes.push({ kind: 'amp', text: `amplicon ${lo}${hi !== lo ? '–' + hi : ''} bp (tail 포함) → 권장 범위 ${sug.ampliconMin}–${sug.ampliconMax} bp.` });
  }

  // 3′ 말단 · 미스매치
  for (const a of asps) {
    if (!a.loc) continue;
    if (a.loc.threeEndAtVariant) notes.push({ kind: 'ok', text: `${a.name}: 3′ 말단이 변이 위치(대립유전자 ${a.loc.alleleLabel})에 있습니다 → snpOffset 1.` });
    else notes.push({ kind: 'warn', text: `${a.name}: 3′ 말단이 변이에서 ${a.loc.distanceToVariant} nt 떨어져 있습니다. 대립유전자 특이 프라이머가 맞는지 확인하세요.` });
    if (a.loc.mismatches) {
      const pos = a.loc.mismatchPositions;
      const second = pos.includes(a.length - 2);
      notes.push({ kind: second ? 'ok' : 'warn', text: `${a.name}: 템플릿과 ${a.loc.mismatches}개 불일치 (5′에서 ${pos.map((p) => p + 1).join(', ')}번째)${second ? ' → 3′ 2번째 의도적 미스매치로 보입니다. 겔 모드의 "second deliberate mismatch" 옵션에 해당합니다.' : '.'}` });
    }
  }
  for (const c of commons) {
    if (c.loc && c.loc.mismatches) notes.push({ kind: 'warn', text: `${c.name}: 템플릿과 ${c.loc.mismatches}개 불일치.` });
  }

  // Tm 차
  if (asps.length && commons.length) {
    let d = 0;
    for (const a of asps) for (const c of commons) d = Math.max(d, Math.abs(a.tm - c.tm));
    sug.tmDiffMax = Math.max(params.tmDiffMax, Math.ceil(d * 2) / 2);
    notes.push({ kind: d > params.tmDiffMax ? 'warn' : 'ok', text: `ASP–Common Tm 차 최대 ${f1(d)} °C${d > params.tmDiffMax ? ` → 허용치를 ${sug.tmDiffMax} °C 로.` : '.'}` });
  }

  // LC
  const lcs = known.map((i) => i.lc);
  if (lcs.length) {
    const lo = Math.min(...lcs);
    if (lo < params.minLC) {
      sug.minLC = Math.max(10, Math.floor(lo / 5) * 5);
      notes.push({ kind: 'warn', text: `LC 최저 ${lo} % 가 현재 하한 ${params.minLC} % 보다 낮습니다 → LC 하한을 ${sug.minLC} % 로.` });
    }
  }

  // 다이머
  for (const i of items) if (i.selfDimer) notes.push({ kind: 'warn', text: `${i.name}: 자기 다이머 ${i.selfDimer.matches} bp${i.selfDimer.threePrimeA || i.selfDimer.threePrimeB ? ' (3′ 말단 관여)' : ''}.` });
  for (const p of x.pairs || []) notes.push({ kind: 'warn', text: `${items[p.a].name} ↔ ${items[p.b].name}: 교차 다이머 ${p.matches} bp (임계 ${params.dimerThreshold}).` });
  for (const i of items) if (i.repeat) notes.push({ kind: 'warn', text: `${i.name}: 단순반복 ${i.repeat} 포함 (현재 규칙으로는 Common 후보에서 탈락).` });

  // 미확인
  for (const u of unknown) notes.push({ kind: 'info', text: `${u.name}: 템플릿에서 위치를 찾지 못했습니다${x.record ? ' (2개 초과 불일치)' : ' — 서열 입력 탭에 해당 마커 템플릿을 넣으면 위치·amplicon 을 계산합니다'}.` });

  return { notes, suggested: sug, counts: { asp: asps.length, common: commons.length, unknown: unknown.length } };
}

/**
 * 프라이머 목록 분석
 * @param {{name:string, seq:string}[]} primers
 * @param {object} o { record, params, maxMismatch }
 */
export function analyzePrimers(primers, o = {}) {
  const params = mergeParams(o.params || {});
  const condMain = resolveConditions(params);
  const mainLabel = params.preset === 'custom' ? '사용자 정의' : (TM_PRESETS[params.preset] || TM_PRESETS.bioneer).label;
  const altKey = params.preset === 'primerdigital' ? 'bioneer' : 'primerdigital';
  const condAlt = makeConditions(TM_PRESETS[altKey]);
  const altLabel = TM_PRESETS[altKey].label;
  const record = o.record && !o.record.error ? o.record : null;

  const items = primers.map((pr) => {
    const { tail, body } = detectTail(pr.seq, params.tails);
    const loc = record ? locateOnTemplate(body, record, o.maxMismatch ?? 2) : null;
    const role = tail ? 'ASP' : (loc ? (loc.coversVariant ? 'ASP' : 'Common') : '미확인');
    const self = findSelfDimer(pr.seq, { threshold: params.dimerThreshold, mismatch: params.dimerAllowMismatch });
    return {
      name: pr.name, full: pr.seq, tail, body,
      length: body.length, fullLength: pr.seq.length,
      tm: meltingTemp(body, condMain), tmAlt: meltingTemp(body, condAlt),
      gc: gcPercent(body), lc: linguisticComplexity(body),
      repeat: findSimpleRepeat(body),
      selfDimer: self && self.isDimer ? self : null,
      loc, role, amplicons: [],
    };
  });

  const pairs = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const r = findDimer(items[i].full, items[j].full, { threshold: params.dimerThreshold, mismatch: params.dimerAllowMismatch });
      if (r && r.isDimer) pairs.push({ a: i, b: j, matches: r.matches });
    }
  }

  const asps = items.filter((i) => i.role === 'ASP' && i.loc);
  const commons = items.filter((i) => i.role === 'Common' && i.loc);
  for (const a of asps) {
    for (const c of commons) {
      if (a.loc.strand === c.loc.strand) continue;
      const tailLen = a.tail ? a.tail.seq.length : 0;
      const size = a.loc.strand === '+' ? c.loc.end0 - a.loc.start0 + tailLen : a.loc.end0 - c.loc.start0 + tailLen;
      if (size > 0) a.amplicons.push({ common: c.name, size });
    }
  }

  const summary = inferConditions(items, params, { altKey, altLabel, mainLabel, record, pairs });
  return { items, pairs, summary, mainLabel, altLabel, altKey, params };
}

/** 분석 표 TSV */
export function analysisToTsv(result) {
  const head = ['Name', 'Role', 'Tail', 'Body(5′→3′)', 'Length', `Tm_${result.mainLabel}`, `Tm_${result.altLabel}`, 'GC(%)', 'LC(%)', 'Strand', 'Position', 'Mismatch', 'Amplicon(bp)'];
  const rows = [head.join('\t')];
  for (const i of result.items) {
    rows.push([
      i.name, i.role, i.tail ? i.tail.name : '', i.body, i.length,
      Number.isFinite(i.tm) ? i.tm.toFixed(1) : '', Number.isFinite(i.tmAlt) ? i.tmAlt.toFixed(1) : '',
      i.gc.toFixed(1), i.lc,
      i.loc ? i.loc.strand : '', i.loc ? `${i.loc.start}-${i.loc.end}` : '', i.loc ? i.loc.mismatches : '',
      (i.amplicons || []).map((m) => `${m.common}:${m.size}`).join(' '),
    ].join('\t'));
  }
  return rows.join('\n');
}
