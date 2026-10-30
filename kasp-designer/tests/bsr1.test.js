/**
 * 회귀 테스트: primerdigital.com 실제 결과(bsr1_snp913, 2026-10) 재현
 *  - 사이트 설정 추정: Tm 60–62 °C, 길이 18–28, tail 없음, 겹침 허용
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseInput } from '../src/core/parse.js';
import { designMarker, PRESET_TM_WINDOW } from '../src/core/design.js';

const siteTxt = readFileSync(new URL('../reference/primerdigital_bsr1_snp913.txt', import.meta.url), 'utf8');
const rec = parseInput(readFileSync(new URL('../reference/bsr1_snp913_template.fa', import.meta.url), 'utf8')).records[0];

function parseSite(block) {
  const asps = [], commons = [];
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([FR]_[\d-]+(?:_ASP_[A-Z]+)?)\t([acgtACGT]+)\t(\d+)\t([\d.]+)\t([\d.]+)\t(\d+)(?:\t(\d+)\/([\d.]+))?/);
    if (!m) continue;
    const o = { id: m[1], seq: m[2].toUpperCase(), len: +m[3], tm: +m[4], gc: +m[5], lc: +m[6], frag: m[7] ? +m[7] : null };
    (o.id.includes('ASP') ? asps : commons).push(o);
  }
  return { asps, commons };
}
const [fwdBlock, revBlock] = siteTxt.split('[KASP Reverse sets]');
const siteF = parseSite(fwdBlock);
const siteR = parseSite(revBlock);
const SITE_PARAMS = { preset: 'primerdigital', tmMin: 60, tmMax: 62, aspMinLen: 18, aspMaxLen: 28, commonMinLen: 18, commonMaxLen: 28, useTails: false, allowOverlap: true, maxCommon: 500, maxReport: 500 };

test('bsr1: 템플릿 파싱 (200 + [A/G] + 200)', () => {
  assert.equal(rec.s1.length, 200);
  assert.equal(rec.s3.length, 200);
  assert.deepEqual(rec.alleles.map((a) => a.seq), ['A', 'G']);
  assert.equal(siteF.asps.length, 2);
  assert.equal(siteF.commons.length, 18);
  assert.equal(siteR.commons.length, 16);
});

test('bsr1: Forward ASP 서열·길이·Tm·GC·LC 가 사이트와 일치', () => {
  const res = designMarker(rec, SITE_PARAMS);
  const ours = res.forward.asps;
  assert.equal(ours.length, 2);
  for (let i = 0; i < 2; i++) {
    assert.equal(ours[i].body.toUpperCase(), siteF.asps[i].seq);
    assert.equal(ours[i].length, siteF.asps[i].len);
    assert.ok(Math.abs(ours[i].tm - siteF.asps[i].tm) <= 0.1, `${ours[i].id} Tm ${ours[i].tm} vs ${siteF.asps[i].tm}`);
    assert.equal(Number(ours[i].gc.toFixed(1)), siteF.asps[i].gc);
    assert.equal(ours[i].lc, siteF.asps[i].lc);
    assert.equal(ours[i].id, siteF.asps[i].id); // F_174-201_ASP_A / _G
  }
});

test('bsr1: Reverse 세트 ASP 서열이 사이트와 일치 (상한 초과 경고 포함)', () => {
  const res = designMarker(rec, SITE_PARAMS);
  const ours = res.reverse.asps;
  // 사이트는 역상보 서열의 대립유전자(C/T)로 표기, 서열 자체는 동일
  const siteSeqs = siteR.asps.map((a) => a.seq).sort();
  const ourSeqs = ours.map((a) => a.body.toUpperCase()).sort();
  assert.deepEqual(ourSeqs, siteSeqs);
  for (const a of ours) {
    const s = siteR.asps.find((x) => x.seq === a.body.toUpperCase());
    assert.ok(Math.abs(a.tm - s.tm) <= 0.1, `${a.id} Tm ${a.tm} vs ${s.tm}`);
    assert.ok(a.warnings.some((w) => w.includes('상한')), a.warnings.join('; '));
  }
});

test('bsr1: 사이트의 Forward Common 18개가 모두 우리 후보에 포함되고 길이·Tm·Fragment 가 일치', () => {
  const res = designMarker(rec, SITE_PARAMS);
  const set = res.forward;
  const bySeq = new Map(set.commons.map((c) => [c.seqUpper, c]));
  const missing = [];
  for (const s of siteF.commons) {
    const c = bySeq.get(s.seq);
    if (!c) { missing.push(s.id); continue; }
    assert.equal(c.length, s.len);
    assert.equal(c.id, s.id, `ID 표기 ${c.id} vs ${s.id}`);
    assert.ok(Math.abs(c.tm - s.tm) <= 0.1, `${s.id} Tm ${c.tm} vs ${s.tm}`);
    assert.equal(c.lc, s.lc);
    assert.equal(c.amplicons[0].sizeNoTail, s.frag, `${s.id} fragment ${c.amplicons[0].sizeNoTail} vs ${s.frag}`);
    assert.equal(c.amplicons[0].size, s.frag); // tail 없음 → 같음
  }
  assert.deepEqual(missing, []);
});

test('bsr1: 사이트의 Reverse Common 16개도 모두 우리 Reverse 세트 후보에 포함', () => {
  const res = designMarker(rec, SITE_PARAMS);
  const bySeq = new Map(res.reverse.commons.map((c) => [c.seqUpper, c]));
  const missing = siteR.commons.filter((s) => !bySeq.has(s.seq)).map((s) => s.id);
  assert.deepEqual(missing, []);
  for (const s of siteR.commons) {
    const c = bySeq.get(s.seq);
    assert.ok(Math.abs(c.tm - s.tm) <= 0.1, `${s.id} Tm ${c.tm} vs ${s.tm}`);
    assert.equal(c.amplicons[0].sizeNoTail, s.frag, `${s.id} fragment ${c.amplicons[0].sizeNoTail} vs ${s.frag}`);
  }
});

test('bsr1: 프리셋 기본 Tm 창과 tail 포함 amplicon 표시', () => {
  assert.deepEqual([...PRESET_TM_WINDOW.primerdigital], [60, 62]);
  assert.deepEqual([...PRESET_TM_WINDOW.bioneer], [57, 62]);
  const withTail = designMarker(rec, { ...SITE_PARAMS, useTails: true });
  const c = withTail.forward.commons.find((x) => x.id === 'R_243-217');
  assert.ok(c, 'R_243-217 with tails');
  assert.equal(c.amplicons[0].size, 70 + 21);
  assert.equal(c.amplicons[0].sizeNoTail, 70);
  assert.equal(c.tailLen, 21);
});
