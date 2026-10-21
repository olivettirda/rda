/**
 * mask.js — 서열 전처리 마스킹 (사양 §2)
 *  - 분산 반복(15-mer, 양 가닥 포함 2회 이상) 마스킹
 *  - 저복잡도(17 nt 창, 2-mer+3-mer 어휘 < 14, 연속 ≥ 21 nt) 마스킹
 *  - 주변 변이(IUPAC) 위치, 제외구역(/.../), 추가 괄호 변이 구간
 *
 * mask[i] 는 비트 플래그. 0 = 사용 가능.
 */
import { revcomp } from './seq.js';
import { windowVocabulary } from './complexity.js';

export const MASK = Object.freeze({
  REPEAT: 1,       // 분산 반복 (soft: ASP 는 경고, Common 은 탈락)
  LOW_COMPLEX: 2,  // 저복잡도 (soft)
  IUPAC: 4,        // 주변 SNP (hard)
  EXCLUDED: 8,     // 사용자 제외구역 (hard)
  VARIANT: 16,     // 추가 괄호 변이 (hard)
});
export const HARD_MASK = MASK.IUPAC | MASK.EXCLUDED | MASK.VARIANT;
export const SOFT_MASK = MASK.REPEAT | MASK.LOW_COMPLEX;

/**
 * 15-mer 분산 반복 마스크. 서열과 역상보 가닥의 모든 k-mer 를 합산해
 * 2회 이상 등장하는 k-mer 가 덮는 위치를 1 로 표시.
 */
export function repeatMask(seq, k = 15) {
  const s = String(seq ?? '').toUpperCase();
  const n = s.length;
  const out = new Uint8Array(n);
  if (n < k) return out;
  const counts = new Map();
  const bump = (str) => {
    for (let i = 0; i + k <= str.length; i++) {
      const kmer = str.slice(i, i + k);
      if (/[^ACGT]/.test(kmer)) continue;
      counts.set(kmer, (counts.get(kmer) || 0) + 1);
    }
  };
  bump(s);
  bump(revcomp(s));
  for (let i = 0; i + k <= n; i++) {
    const kmer = s.slice(i, i + k);
    if ((counts.get(kmer) || 0) >= 2) out.fill(1, i, i + k);
  }
  return out;
}

/**
 * 저복잡도 마스크. window 길이 창에서 2-mer+3-mer 어휘가 minVocab 미만이면 저복잡도 창,
 * 연속 저복잡도 창이 덮는 구간이 minBlock nt 이상이면 마스킹.
 */
export function lowComplexityMask(seq, { window = 17, minVocab = 14, minBlock = 21 } = {}) {
  const s = String(seq ?? '').toUpperCase();
  const n = s.length;
  const out = new Uint8Array(n);
  if (n < window) return out;
  const low = new Uint8Array(n - window + 1);
  for (let i = 0; i + window <= n; i++) {
    low[i] = windowVocabulary(s.slice(i, i + window)) < minVocab ? 1 : 0;
  }
  let i = 0;
  while (i < low.length) {
    if (!low[i]) { i++; continue; }
    let j = i;
    while (j < low.length && low[j]) j++;
    const spanEnd = j - 1 + window; // 마지막 저복잡도 창의 끝(exclusive)
    if (spanEnd - i >= minBlock) out.fill(1, i, spanEnd);
    i = j;
  }
  return out;
}

/**
 * 전체 마스크 구성.
 * @param {string} seq 대상 서열
 * @param {object} o
 *   repeat, lowComplexity: boolean(기본 true)
 *   iupacPositions: number[]  (0-based)
 *   excludedRanges: [start,end)[]
 *   variantRanges:  [start,end)[]
 */
export function buildMask(seq, o = {}) {
  const s = String(seq ?? '');
  const n = s.length;
  const mask = new Uint8Array(n);
  if (o.repeat !== false) {
    const r = repeatMask(s, o.repeatK ?? 15);
    for (let i = 0; i < n; i++) if (r[i]) mask[i] |= MASK.REPEAT;
  }
  if (o.lowComplexity !== false) {
    const l = lowComplexityMask(s, o.lowComplexityOptions);
    for (let i = 0; i < n; i++) if (l[i]) mask[i] |= MASK.LOW_COMPLEX;
  }
  for (const p of o.iupacPositions ?? []) if (p >= 0 && p < n) mask[p] |= MASK.IUPAC;
  for (const [a, b] of o.excludedRanges ?? []) for (let i = Math.max(0, a); i < Math.min(n, b); i++) mask[i] |= MASK.EXCLUDED;
  for (const [a, b] of o.variantRanges ?? []) for (let i = Math.max(0, a); i < Math.min(n, b); i++) mask[i] |= MASK.VARIANT;
  return mask;
}

/** [start,end) 구간에 flags 중 하나라도 켜진 위치가 있으면 그 플래그 합, 없으면 0 */
export function maskFlagsIn(mask, start, end, flags = 0xff) {
  let acc = 0;
  const a = Math.max(0, start), b = Math.min(mask.length, end);
  for (let i = a; i < b; i++) acc |= (mask[i] & flags);
  return acc;
}

export function maskOverlaps(mask, start, end, flags = 0xff) {
  return maskFlagsIn(mask, start, end, flags) !== 0;
}

/** 마스크 플래그를 한국어 라벨 목록으로 */
export function describeMask(flags) {
  const out = [];
  if (flags & MASK.REPEAT) out.push('반복서열');
  if (flags & MASK.LOW_COMPLEX) out.push('저복잡도');
  if (flags & MASK.IUPAC) out.push('주변 변이');
  if (flags & MASK.EXCLUDED) out.push('제외구역');
  if (flags & MASK.VARIANT) out.push('추가 변이');
  return out;
}
