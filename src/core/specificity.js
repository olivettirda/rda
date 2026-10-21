/**
 * specificity.js — 상동유전체(homoeolog) 특이성 검사 (다배체 작물용, 예: 밀 A/B/D)
 *
 * 원리 (Ramirez-Gonzalez et al. 2015 PolyMarker; Makhoul et al. 2020):
 *  - 프라이머를 각 상동유전체 서열(양 가닥)에서 가장 잘 맞는 자리에 정렬해 불일치 위치를 센다
 *  - 모든 상동유전체에 대해 3′ 말단 염기가 불일치 → 염색체 특이(specific)
 *  - 모든 상동유전체에 대해 어디든 불일치가 있음 → 반특이(semi)
 *  - 어느 상동유전체와 완전히 같음 → 비특이(nonspecific)
 *  - 상동 서열에서 비슷한 구간을 찾지 못함(불일치가 maxMismatch 초과) → 사실상 특이로 본다
 */
import { revcomp } from './seq.js';

export const SPECIFICITY_LABEL = Object.freeze({
  specific: '염색체 특이',
  semi: '반특이',
  nonspecific: '비특이',
  unknown: '검사 안 함',
});

/**
 * 프라이머(5′→3′)를 대상 서열에서 양 가닥으로 찾아 불일치가 가장 적은 자리를 돌려준다.
 * @returns {{strand:string, start0:number, mismatches:number, positions:number[]}|null} positions 는 프라이머 5′ 기준 0-based
 */
export function bestMatch(primer, target, maxMismatch = 8) {
  const b = String(primer || '').toUpperCase();
  const T = String(target || '').toUpperCase();
  if (!b.length || T.length < b.length) return null;
  let best = null;
  for (const strand of ['+', '-']) {
    const probe = strand === '+' ? b : revcomp(b);
    for (let p = 0; p + probe.length <= T.length; p++) {
      let mm = 0;
      const pos = [];
      for (let k = 0; k < probe.length; k++) {
        if (T[p + k] !== probe[k]) { mm++; if (mm > maxMismatch) break; pos.push(k); }
      }
      if (mm > maxMismatch) continue;
      if (!best || mm < best.mismatches) {
        best = { strand, start0: p, mismatches: mm, positions: strand === '+' ? pos : pos.map((k) => probe.length - 1 - k).sort((x, y) => x - y) };
        if (mm === 0) return best;
      }
    }
  }
  return best;
}

/**
 * @param {string} primer 본체 서열(tail 제외)
 * @param {{name:string, seq:string}[]} homoeologs
 * @returns {{ class:string, label:string, per:object[], minMismatch:number|null }}
 */
export function classifyPrimerSpecificity(primer, homoeologs, { maxMismatch = 8, threeEndWindow = 5 } = {}) {
  const L = String(primer || '').length;
  const list = (homoeologs || []).filter((h) => h && h.seq && h.seq.length >= L);
  if (!L || !list.length) return { class: 'unknown', label: SPECIFICITY_LABEL.unknown, per: [], minMismatch: null };
  const per = list.map((h) => {
    const m = bestMatch(primer, h.seq, maxMismatch);
    return {
      name: h.name,
      found: !!m,
      mismatches: m ? m.mismatches : null,
      positions: m ? m.positions : [],
      terminal: m ? m.positions.includes(L - 1) : true,
      threeEnd: m ? m.positions.filter((p) => p >= L - threeEndWindow).length : threeEndWindow,
    };
  });
  const found = per.filter((p) => p.found);
  let cls;
  if (!found.length) cls = 'specific';
  else if (found.every((p) => p.terminal)) cls = 'specific';
  else if (found.every((p) => p.mismatches >= 1)) cls = 'semi';
  else cls = 'nonspecific';
  return {
    class: cls,
    label: SPECIFICITY_LABEL[cls],
    per,
    minMismatch: found.length ? Math.min(...found.map((p) => p.mismatches)) : null,
  };
}

/** Common 후보 점수에 더할 벌점 */
export function specificityPenalty(cls) {
  if (cls === 'nonspecific') return 30;
  if (cls === 'semi') return 8;
  return 0;
}

/** 사람이 읽는 요약: "B: 3′ 말단 불일치 · D: 불일치 2(5′에서 7, 19번째)" */
export function describeSpecificity(spec) {
  if (!spec || spec.class === 'unknown') return '';
  return spec.per.map((p) => {
    if (!p.found) return `${p.name}: 유사 구간 없음`;
    if (p.mismatches === 0) return `${p.name}: 완전 일치`;
    const where = p.terminal ? '3′ 말단 포함 ' : '';
    return `${p.name}: 불일치 ${p.mismatches} (${where}5′에서 ${p.positions.map((x) => x + 1).join(', ')}번째)`;
  }).join(' · ');
}
