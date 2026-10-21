import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseInput } from '../src/core/parse.js';
import { designMarker } from '../src/core/design.js';
import { FILLERS, generateFillers, applyAlleleSizing, BAND_STEPS } from '../src/core/sizing.js';
import { findSimpleRepeat } from '../src/core/complexity.js';
import { makeConditions, TM_PRESETS } from '../src/core/tm.js';

const json = JSON.parse(readFileSync(new URL('../reference/test_cases.json', import.meta.url), 'utf8'));

test('filler 후보 6개, 결정론적, 단순반복 없음', () => {
  assert.equal(FILLERS.length, 6);
  assert.deepEqual(generateFillers(6, 60), [...FILLERS]);
  for (const f of FILLERS) {
    assert.equal(f.length, 60);
    assert.equal(findSimpleRepeat(f), null);
  }
});

test('Allele sizing: 산물 길이가 bandStep 사다리, tail 없음, filler 는 5′', () => {
  const [r] = parseInput(json.cases.snp_simple.fasta).records;
  const res = designMarker(r, { useTails: false });
  const set = res.forward;
  const common = set.commons[0];
  const cond = makeConditions(TM_PRESETS.bioneer);
  const sized = applyAlleleSizing(set, common, { bandStep: BAND_STEPS.agarose.step, maxLen: 45, cond });
  assert.equal(sized.asps.length, 2);
  const sizes = sized.products.map((p) => p.size).sort((a, b) => a - b);
  assert.equal(sizes[1] - sizes[0], 20);
  for (const a of sized.asps) {
    assert.ok(a.full.endsWith(a.bodyDisplay));
    assert.ok(!a.full.startsWith('GAAGGTGACCAAGTTCATGCT'));
    if (a.tail) assert.equal(a.tail.name, 'Filler');
  }
  // 산물 길이 = 원래 amplicon(tail 없음) + filler
  const bare = common.end0 - set.asps[0].start0;
  assert.ok(sized.products.some((p) => p.size === bare));
});

test('second deliberate mismatch: 3′ 2번째 염기 치환', () => {
  const [r] = parseInput(json.cases.snp_simple.fasta).records;
  const res = designMarker(r, { useTails: false });
  const set = res.forward;
  const cond = makeConditions(TM_PRESETS.bioneer);
  const sized = applyAlleleSizing(set, set.commons[0], { bandStep: 5, secondMismatch: true, cond });
  const orig = set.asps[0].body;
  const mod = sized.asps[0].body;
  const k = orig.length - 2;
  assert.notEqual(orig[k], mod[k]);
  assert.equal(orig.slice(0, k) + orig.slice(k + 1), mod.slice(0, k) + mod.slice(k + 1));
  assert.equal(sized.asps[0].mismatchPos, k);
});

test('maxLen 초과 시 경고', () => {
  const [r] = parseInput(json.cases.snp_simple.fasta).records;
  const res = designMarker(r, { useTails: false });
  const set = res.forward;
  const sized = applyAlleleSizing(set, set.commons[0], { bandStep: 40, maxLen: 30, cond: makeConditions(TM_PRESETS.bioneer) });
  assert.ok(sized.warnings.some((w) => w.includes('초과') || w.includes('넘습니다')));
});
