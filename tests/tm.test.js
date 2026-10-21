import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { meltingTemp, makeConditions, TM_PRESETS, wallaceTm, ampliconTm, nearestNeighborSums } from '../src/core/tm.js';

const require = createRequire(import.meta.url);
const ref = require('../reference/tm.js');
const cases = JSON.parse(readFileSync(new URL('../reference/test_cases.json', import.meta.url), 'utf8'));

const SEQS = [
  'GAAGGTGACCAAGTTCATGCT',
  'GAAGGTCGGAGTCAACGGATT',
  'ATGCATGCATGCATGCATGC',
  'GCGCGCGCGCGCGCGCGCGC',
  'AATTAATTAATTAATTAATT',
  'ACGTACGTAC',
];

test('Tm: reference/tm.js 6개 서열과 ±0.05 °C 이내 (바이오니어)', () => {
  const cond = makeConditions(TM_PRESETS.bioneer);
  for (const s of SEQS) {
    const mine = meltingTemp(s, cond);
    const theirs = ref.tm(s, ref.PRESET.bioneer);
    assert.ok(Math.abs(mine - theirs) <= 0.05, `${s}: ${mine} vs ${theirs}`);
  }
});

test('Tm: reference/tm.js 6개 서열과 ±0.05 °C 이내 (primerdigital)', () => {
  const cond = makeConditions(TM_PRESETS.primerdigital);
  for (const s of SEQS) {
    const mine = meltingTemp(s, cond);
    const theirs = ref.tm(s, ref.PRESET.primerdigital);
    assert.ok(Math.abs(mine - theirs) <= 0.05, `${s}: ${mine} vs ${theirs}`);
  }
});

test('Tm: test_cases.json 의 기준값(소수 1자리)과 일치', () => {
  const b = makeConditions(TM_PRESETS.bioneer);
  const p = makeConditions(TM_PRESETS.primerdigital);
  for (const [s, v] of Object.entries(cases.expect.tm_reference_bioneer)) {
    assert.equal(Number(meltingTemp(s, b).toFixed(1)), v, `bioneer ${s}`);
  }
  for (const [s, v] of Object.entries(cases.expect.tm_reference_primerdigital)) {
    assert.equal(Number(meltingTemp(s, p).toFixed(1)), v, `primerdigital ${s}`);
  }
});

test('Wallace rule: 15 nt 미만은 2(A+T)+4(G+C)', () => {
  assert.equal(wallaceTm('ACGTACGTAC'), 30);
  const b = makeConditions(TM_PRESETS.bioneer);
  assert.equal(meltingTemp('ACGTACGTAC', b), 30);
  // primerdigital 프리셋은 Wallace 를 쓰지 않지만 10-mer 기준값도 30.0
  const p = makeConditions(TM_PRESETS.primerdigital);
  assert.equal(Number(meltingTemp('ACGTACGTAC', p).toFixed(1)), 30);
});

test('NN 합: 자기상보 서열은 ΔS 보정 −1.4', () => {
  const sym = nearestNeighborSums('ACGT');     // 역상보 = ACGT
  const asym = nearestNeighborSums('ACGA');
  assert.ok(Number.isFinite(sym.dS) && Number.isFinite(asym.dS));
  // ACGT: init(AT)+init(AT)+AC+CG+GT+sym
  const expectDS = 4.1 + 4.1 + (-22.4) + (-27.2) + (-22.4) - 1.4;
  assert.ok(Math.abs(sym.dS - expectDS) < 1e-9);
});

test('사용자 정의 조건과 Mg 보정 분기가 동작', () => {
  const custom = makeConditions({ na_mM: 100, mg_mM: 2, oligo_nM: 500, wallaceBelow: 0 });
  const t = meltingTemp('ATGCATGCATGCATGCATGC', custom);
  assert.ok(Number.isFinite(t) && t > 50 && t < 80, String(t));
  assert.ok(Number.isNaN(meltingTemp('A', custom)));
});

test('Amplicon Tm 공식 (정보용)', () => {
  const b = makeConditions(TM_PRESETS.bioneer);
  const seq = 'ATGC'.repeat(25); // 100 bp, GC 50 %
  const t = ampliconTm(seq, b);
  const expected = 77.1 + 11.7 * Math.log10(0.05) + 41 * 0.5 - 528 / 100;
  assert.ok(Math.abs(t - expected) < 1e-9);
});
