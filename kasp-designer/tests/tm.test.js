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

test('Tm: reference/tm.js 6개 서열과 ±0.05 °C 이내 (바이오니어, Ct/4 관례)', () => {
  const cond = makeConditions(TM_PRESETS.bioneer);
  assert.equal(cond.ctDivisor, 4);
  for (const s of SEQS) {
    const mine = meltingTemp(s, cond);
    const theirs = ref.tm(s, ref.PRESET.bioneer);
    assert.ok(Math.abs(mine - theirs) <= 0.05, `${s}: ${mine} vs ${theirs}`);
  }
});

test('Tm: 같은 관례(Ct/4)로 두면 primerdigital 염 조건도 reference/tm.js 와 ±0.05 °C 이내 (수식 동일성)', () => {
  const cond = makeConditions({ ...TM_PRESETS.primerdigital, ctDivisor: 4 });
  for (const s of SEQS) {
    const mine = meltingTemp(s, cond);
    const theirs = ref.tm(s, ref.PRESET.primerdigital);
    assert.ok(Math.abs(mine - theirs) <= 0.05, `${s}: ${mine} vs ${theirs}`);
  }
  // test_cases.json 의 primerdigital 기준값은 reference 스크립트(Ct/4)로 만든 값이므로 같은 관례로 비교
  for (const [s, v] of Object.entries(cases.expect.tm_reference_primerdigital)) {
    assert.equal(Number(meltingTemp(s, cond).toFixed(1)), v, `primerdigital(Ct/4) ${s}`);
  }
});

test('Tm: test_cases.json 바이오니어 기준값(소수 1자리)과 일치', () => {
  const b = makeConditions(TM_PRESETS.bioneer);
  for (const [s, v] of Object.entries(cases.expect.tm_reference_bioneer)) {
    assert.equal(Number(meltingTemp(s, b).toFixed(1)), v, `bioneer ${s}`);
  }
});

test('Tm: primerdigital 프리셋(ln(Ct) 관례)은 사이트 실측 38개 프라이머와 ±0.1 °C 이내', () => {
  const txt = readFileSync(new URL('../reference/primerdigital_bsr1_snp913.txt', import.meta.url), 'utf8');
  const cond = makeConditions(TM_PRESETS.primerdigital);
  assert.equal(cond.ctDivisor, 1);
  let n = 0, sumAbs = 0;
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([FR]_[\d-]+(?:_ASP_[A-Z]+)?)\t([acgtACGT]+)\t(\d+)\t([\d.]+)\t/);
    if (!m) continue;
    const mine = meltingTemp(m[2], cond);
    const site = Number(m[4]);
    assert.ok(Math.abs(mine - site) <= 0.1, `${m[1]} ${m[2]}: ours ${mine.toFixed(2)} vs site ${site}`);
    n++; sumAbs += Math.abs(mine - site);
  }
  assert.equal(n, 38);
  assert.ok(sumAbs / n < 0.05, `mean abs diff ${(sumAbs / n).toFixed(3)}`);
});

test('Wallace rule: 15 nt 미만은 2(A+T)+4(G+C)', () => {
  assert.equal(wallaceTm('ACGTACGTAC'), 30);
  const b = makeConditions(TM_PRESETS.bioneer);
  assert.equal(meltingTemp('ACGTACGTAC', b), 30);
});

test('NN 합: 자기상보 서열은 ΔS 보정 −1.4', () => {
  const sym = nearestNeighborSums('ACGT');
  const expectDS = 4.1 + 4.1 + (-22.4) + (-27.2) + (-22.4) - 1.4;
  assert.ok(Math.abs(sym.dS - expectDS) < 1e-9);
});

test('사용자 정의 조건과 Mg 보정 분기, ctDivisor 검증', () => {
  const custom = makeConditions({ na_mM: 100, mg_mM: 2, oligo_nM: 500, wallaceBelow: 0 });
  const t = meltingTemp('ATGCATGCATGCATGCATGC', custom);
  assert.ok(Number.isFinite(t) && t > 50 && t < 80, String(t));
  assert.ok(Number.isNaN(meltingTemp('A', custom)));
  assert.equal(makeConditions({ ctDivisor: 7 }).ctDivisor, 4);
  // ln(Ct) 관례는 같은 염 조건에서 Tm 을 올린다 (짧을수록 더)
  const d4 = makeConditions({ na_mM: 55, mg_mM: 1, oligo_nM: 200, ctDivisor: 4 });
  const d1 = makeConditions({ na_mM: 55, mg_mM: 1, oligo_nM: 200, ctDivisor: 1 });
  const s18 = 'ATGACGAGCTCCCTTCAG', s28 = 'AGTTTTAATATTGTGGAACAAGAACAGA';
  const up18 = meltingTemp(s18, d1) - meltingTemp(s18, d4);
  const up28 = meltingTemp(s28, d1) - meltingTemp(s28, d4);
  assert.ok(up18 > up28 && up28 > 1 && up18 < 3, `${up18} ${up28}`);
});

test('Amplicon Tm 공식 (정보용)', () => {
  const b = makeConditions(TM_PRESETS.bioneer);
  const seq = 'ATGC'.repeat(25);
  const t = ampliconTm(seq, b);
  const expected = 77.1 + 11.7 * Math.log10(0.05) + 41 * 0.5 - 528 / 100;
  assert.ok(Math.abs(t - expected) < 1e-9);
});
