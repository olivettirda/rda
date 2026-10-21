import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repeatMask, lowComplexityMask, buildMask, MASK, maskOverlaps, maskFlagsIn, describeMask } from '../src/core/mask.js';
import { revcomp } from '../src/core/seq.js';

// 반복이 없는 무작위성 배경 서열
const BG = 'acgtagctagcttgacgatcgatgcatcgatgctagctagcatcgatcgatgcatcgatcgtagctagctgatcgatcgtacgatcgatcgtagctagctagctgatcgtacgtagctgactgatcgatcgtagcatcgatcgatcgtagcgatcgatgcatcgatgcatgcatcgatgcat'.toUpperCase();

test('15-mer 가 2회 등장하면 두 구간 모두 마스킹', () => {
  const rep = 'GATTACAGATTACAG'; // 15-mer
  const left = 'ACGTTGCAAGCTCGATCGTACCTGAGGTAACTGCAGGTTC'; // 반복 없는 40 nt
  const mid = 'TTGCCAGTAGCCATTGAG'; // 끝 염기가 left 의 끝(C)과 달라야 15-mer 가 우연히 겹치지 않음
  const seq = left + rep + mid + rep + 'GGCATTACGGACTTA';
  const m = repeatMask(seq, 15);
  const p1 = left.length, p2 = left.length + rep.length + mid.length;
  for (let i = p1; i < p1 + 15; i++) assert.equal(m[i], 1, `pos ${i}`);
  for (let i = p2; i < p2 + 15; i++) assert.equal(m[i], 1, `pos ${i}`);
  for (let i = 0; i < p1; i++) assert.equal(m[i], 0, `pos ${i}`);
});

test('역상보로 다시 나타나는 15-mer(역위 반복)도 마스킹', () => {
  const rep = 'GATTACAGCTTACAG';
  const seq = 'ACGTTGCAAGCTCGATCGTA' + rep + 'TTGCCAGTAGCCATTGAC' + revcomp(rep) + 'GGCATTACGGACTTA';
  const m = repeatMask(seq, 15);
  assert.equal(m[20], 1);
  assert.equal(m[0], 0);
});

test('반복 없는 서열은 마스킹 없음', () => {
  const m = repeatMask('ACGTTGCAAGCTCGATCGTAGGCATTACGGACTTA', 15);
  assert.equal(m.reduce((a, b) => a + b, 0), 0);
});

test('저복잡도: (AT)n 30 nt 블록 마스킹, 무작위 서열은 없음', () => {
  const block = 'AT'.repeat(15);
  const seq = 'ACGTTGCAAGCTCGATCGTAGGC' + block + 'GGCATTACGGACTTACCGT';
  const m = lowComplexityMask(seq);
  const start = 23;
  let covered = 0;
  for (let i = start; i < start + 30; i++) covered += m[i];
  assert.ok(covered >= 28, `covered ${covered}`);
  assert.equal(m[0], 0);
  const none = lowComplexityMask('ACGTTGCAAGCTCGATCGTAGGCATTACGGACTTACCGTAGGCTAGCAT');
  assert.equal(none.reduce((a, b) => a + b, 0), 0);
});

test('buildMask: IUPAC/제외구역/추가변이 플래그와 질의', () => {
  const seq = 'ACGTTGCAAGCTCGATCGTAGGCATTACGGACTTACCGT';
  const m = buildMask(seq, { repeat: false, lowComplexity: false, iupacPositions: [3], excludedRanges: [[10, 14]], variantRanges: [[20, 22]] });
  assert.equal(m[3], MASK.IUPAC);
  assert.equal(m[10], MASK.EXCLUDED);
  assert.equal(m[13], MASK.EXCLUDED);
  assert.equal(m[14], 0);
  assert.equal(m[21], MASK.VARIANT);
  assert.equal(maskOverlaps(m, 0, 3), false);
  assert.equal(maskOverlaps(m, 0, 4), true);
  assert.equal(maskFlagsIn(m, 9, 21), MASK.EXCLUDED | MASK.VARIANT);
  assert.deepEqual(describeMask(MASK.EXCLUDED | MASK.REPEAT), ['반복서열', '제외구역']);
});
