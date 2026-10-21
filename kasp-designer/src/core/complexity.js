/**
 * complexity.js — Linguistic Complexity(LC%)와 단순반복 검사
 *
 * 문헌: Kalendar R. et al. (2017) Genomics 109:312–319 (FastPCR, LC 지표의 개념)
 * 사양 §4.1: 관찰 어휘 = 서로 다른 1-mer + 2-mer + 3-mer 수,
 *            이론 최대 = 4 + min(N−1, 16) + min(N−2, 64), LC% = floor(100·관찰/최대), N<6 → 100
 */

/** 서열의 LC% (정수) */
export function linguisticComplexity(seq) {
  const s = String(seq ?? '').toUpperCase();
  const n = s.length;
  if (n < 6) return 100;
  const mono = new Set(), di = new Set(), tri = new Set();
  for (let i = 0; i < n; i++) {
    mono.add(s[i]);
    if (i + 2 <= n) di.add(s.slice(i, i + 2));
    if (i + 3 <= n) tri.add(s.slice(i, i + 3));
  }
  const observed = mono.size + di.size + tri.size;
  const maximum = 4 + Math.min(n - 1, 16) + Math.min(n - 2, 64);
  return Math.floor((100 * observed) / maximum);
}

/** 즉시 거부 대상 단순반복 모티프 (사양 §2.3) */
export const SIMPLE_REPEAT_MOTIFS = Object.freeze([
  'GGGG', 'CCCCC', 'AAAAA', 'TTTTT',
  'GCGCGC', 'CGCGCG', 'ATATAT', 'TATATA',
]);

/** 서열에 포함된 첫 단순반복 모티프를 반환, 없으면 null */
export function findSimpleRepeat(seq, motifs = SIMPLE_REPEAT_MOTIFS) {
  const s = String(seq ?? '').toUpperCase();
  for (const m of motifs) if (s.includes(m)) return m;
  return null;
}

export function hasSimpleRepeat(seq, motifs = SIMPLE_REPEAT_MOTIFS) {
  return findSimpleRepeat(seq, motifs) !== null;
}

/**
 * 창 안의 서로 다른 2-mer + 3-mer 수 (저복잡도 마스킹용, 사양 §2.2)
 */
export function windowVocabulary(seq) {
  const s = String(seq ?? '').toUpperCase();
  const di = new Set(), tri = new Set();
  for (let i = 0; i + 2 <= s.length; i++) {
    di.add(s.slice(i, i + 2));
    if (i + 3 <= s.length) tri.add(s.slice(i, i + 3));
  }
  return di.size + tri.size;
}
