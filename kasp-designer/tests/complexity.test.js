import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linguisticComplexity, findSimpleRepeat, hasSimpleRepeat, windowVocabulary } from '../src/core/complexity.js';

test('LC%: 단일 염기 반복은 30 미만, 다양한 20-mer 는 80 이상', () => {
  assert.ok(linguisticComplexity('AAAAAAAAAAAAAAAAAAAA') < 30);
  assert.ok(linguisticComplexity('ACGTTGCAAGCTCGATCGTA') >= 80);
  assert.equal(linguisticComplexity('ACGTA'), 100); // N<6
});

test('LC%: 공식 검증 (수작업 계산)', () => {
  // ACGTACGTAC (10 nt): 1-mer 4, 2-mer {AC,CG,GT,TA}=4, 3-mer {ACG,CGT,GTA,TAC}=4 → 12 / (4+9+8=21)
  assert.equal(linguisticComplexity('ACGTACGTAC'), Math.floor((100 * 12) / 21));
});

test('단순반복 모티프 탐지', () => {
  assert.equal(findSimpleRepeat('acgGGGGtac'), 'GGGG');
  assert.equal(findSimpleRepeat('acgCCCCtac'), null);   // CCCC 는 4개 → 허용, CCCCC 만 거부
  assert.equal(findSimpleRepeat('ttATATATcc'), 'ATATAT');
  assert.equal(hasSimpleRepeat('ACGTTGCAAGCTCGATCGTA'), false);
});

test('창 어휘 수: (AT)n 은 낮고 무작위 서열은 높다', () => {
  assert.ok(windowVocabulary('ATATATATATATATATA') < 14);
  assert.ok(windowVocabulary('ACGTTGCAAGCTCGATC') >= 14);
});
