import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanSeq, revcomp, complementSeq, expandIupac, gcPercent, applyCase,
  ambiguityPositions, baseMatchesIupac,
} from '../src/core/seq.js';

test('cleanSeq: 대소문자 무시, U→T, 허용되지 않는 문자 제거', () => {
  assert.equal(cleanSeq('acg t\nU12-xq[N]'), 'ACGTTN');
  assert.equal(cleanSeq(''), '');
  assert.equal(cleanSeq('ryswkmbdhvn'), 'RYSWKMBDHVN');
});

test('revcomp: 표준 염기와 IUPAC, 대소문자 보존', () => {
  assert.equal(revcomp('ACGT'), 'ACGT');
  assert.equal(revcomp('AACG'), 'CGTT');
  assert.equal(revcomp('acgG'), 'Ccgt');
  assert.equal(revcomp('RYSWKMBDHVN'), 'NBDHVKMWSRY');
  assert.equal(complementSeq('ATGC'), 'TACG');
});

test('expandIupac: [R]→A,G / 곱집합 / 빈 allele', () => {
  assert.deepEqual(expandIupac('R'), ['A', 'G']);
  assert.deepEqual(expandIupac('AR'), ['AA', 'AG']);
  assert.deepEqual(expandIupac('RY'), ['AC', 'AT', 'GC', 'GT']);
  assert.deepEqual(expandIupac(''), ['']);
  assert.equal(expandIupac('NNNNNN').length, 1024);
});

test('gcPercent: IUPAC 가중', () => {
  assert.equal(gcPercent('GCGC'), 100);
  assert.equal(gcPercent('ATAT'), 0);
  assert.equal(gcPercent('ACGT'), 50);
  assert.ok(Math.abs(gcPercent('RN') - 50) < 1e-9);
  assert.ok(Math.abs(gcPercent('BV') - 66.6667) < 1e-3);
});

test('applyCase 와 ambiguityPositions', () => {
  assert.equal(applyCase('ACGTAC', 2, 4), 'acGTac');
  assert.deepEqual(ambiguityPositions('ACRTNG'), [2, 4]);
  assert.equal(baseMatchesIupac('G', 'S'), true);
  assert.equal(baseMatchesIupac('A', 'S'), false);
  assert.equal(baseMatchesIupac('A', 'N'), true);
});
