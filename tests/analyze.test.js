import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseInput } from '../src/core/parse.js';
import { designMarker, DEFAULT_TAILS } from '../src/core/design.js';
import { parsePrimerList, detectTail, locateOnTemplate, analyzePrimers, analysisToTsv } from '../src/core/analyze.js';

const json = JSON.parse(readFileSync(new URL('../reference/test_cases.json', import.meta.url), 'utf8'));
const [snp] = parseInput(json.cases.snp_simple.fasta).records;

test('parsePrimerList: 탭/공백+숫자열/FASTA/서열만 형식', () => {
  const text = [
    'ID\tSequence\tLength',                               // 머리글 → 무시
    'ASP_A\tGAAGGTGACCAAGTTCATGCTccggcatggctgacattgA\t40\t57.8',
    'ASP_G GAAGGTCGGAGTCAACGGATTccggcatggctgacattgG 40 59.4 63.2 78',
    '>common',
    'tctcgtgtgaacgcagcc',
    'ACGTACGTACGTACGTAC',
  ].join('\n');
  const p = parsePrimerList(text);
  assert.deepEqual(p.map((x) => x.name), ['ASP_A', 'ASP_G', 'common', 'P1']);
  assert.equal(p[0].seq, 'GAAGGTGACCAAGTTCATGCTCCGGCATGGCTGACATTGA');
  assert.equal(p[2].seq, 'TCTCGTGTGAACGCAGCC');
});

test('detectTail: FAM/HEX/사용자 tail/없음', () => {
  const fam = detectTail('GAAGGTGACCAAGTTCATGCTccggcatggctgacattgA');
  assert.equal(fam.tail.name, 'FAM');
  assert.equal(fam.body, 'CCGGCATGGCTGACATTGA');
  assert.equal(detectTail('GAAGGTCGGAGTCAACGGATTacgtacgtacgtacg').tail.name, 'HEX');
  const custom = detectTail('TTTTTTTTTTacgtacgtacgtacg', [{ name: 'T10', seq: 'TTTTTTTTTT' }]);
  assert.equal(custom.tail.name, 'T10');
  assert.equal(detectTail('acgtacgtacgtacgtac').tail, null);
  assert.equal(detectTail('GAAGGTGACCAAGTTCATGCTacg').tail, null); // 본체 8 nt 미만
});

test('locateOnTemplate: 설계된 ASP/Common 의 위치·가닥·3′ 말단, 미스매치 허용', () => {
  const res = designMarker(snp, {});
  const asp = res.forward.asps[1]; // G
  const loc = locateOnTemplate(asp.body, snp);
  assert.equal(loc.strand, '+');
  assert.equal(loc.alleleLabel, 'G');
  assert.equal(loc.start, asp.start);
  assert.equal(loc.end, asp.end);
  assert.equal(loc.mismatches, 0);
  assert.equal(loc.threeEndAtVariant, true);
  const common = res.forward.commons[0];
  const lc = locateOnTemplate(common.seqUpper, snp);
  assert.equal(lc.strand, '-');
  assert.equal(lc.start, common.start);
  assert.equal(lc.end, common.end);
  assert.equal(lc.coversVariant, false);
  // 3′ 2번째 의도적 미스매치
  const body = asp.body;
  const k = body.length - 2;
  const mut = body.slice(0, k) + (body[k] === 'A' ? 'T' : 'A') + body.slice(k + 1);
  const lm = locateOnTemplate(mut, snp);
  assert.equal(lm.mismatches, 1);
  assert.deepEqual(lm.mismatchPositions, [k]);
  assert.equal(locateOnTemplate('TTTTTTTTTTTTTTTTTTTT', snp), null);
});

test('analyzePrimers: 설계 세트를 되먹이면 역할·amplicon·Tm 이 복원되고 추정 조건이 관찰값을 포함', () => {
  const res = designMarker(snp, {});
  const set = res.forward;
  const common = set.commons[0];
  const text = [
    `${set.asps[0].id}\t${set.asps[0].full}`,
    `${set.asps[1].id}\t${set.asps[1].full}`,
    `${common.id}\t${common.seq}`,
  ].join('\n');
  const out = analyzePrimers(parsePrimerList(text), { record: snp, params: {} });
  assert.deepEqual(out.items.map((i) => i.role), ['ASP', 'ASP', 'Common']);
  assert.equal(out.items[0].tail.name, 'FAM');
  assert.ok(Math.abs(out.items[0].tm - set.asps[0].tm) < 1e-9);
  assert.ok(Math.abs(out.items[2].tm - common.tm) < 1e-9);
  assert.equal(out.items[0].amplicons[0].size, common.amplicons[0].size);
  assert.ok(out.items[0].tmAlt > out.items[0].tm); // primerdigital 비교값은 바이오니어보다 높다
  const s = out.summary.suggested;
  for (const i of out.items) assert.ok(i.tm >= s.tmMin && i.tm <= s.tmMax, `${i.name} ${i.tm} in ${s.tmMin}-${s.tmMax}`);
  assert.ok(s.aspMinLen <= set.asps[0].length && s.aspMaxLen >= set.asps[1].length);
  assert.equal(s.useTails, true);
  assert.ok(s.ampliconMin <= common.amplicons[0].size && s.ampliconMax >= common.amplicons[0].size);
  assert.ok(out.summary.notes.some((n) => n.kind === 'tail' && n.text.includes('FAM')));
  assert.ok(out.summary.notes.some((n) => n.text.includes('3′ 말단이 변이 위치')));
  // 추정 조건으로 다시 설계하면 ASP 2개 + Common 이 나온다
  const again = designMarker(snp, { ...s, tails: s.tails || DEFAULT_TAILS });
  assert.equal(again.forward.asps.length, 2);
  assert.ok(again.forward.commons.length >= 1);
  const tsv = analysisToTsv(out);
  assert.ok(tsv.split('\n').length === 4 && tsv.includes('FAM'));
});

test('analyzePrimers: 템플릿 없이도 Tm/GC/LC 와 tail 은 분석, 위치는 미확인', () => {
  const out = analyzePrimers(parsePrimerList('A GAAGGTGACCAAGTTCATGCTccggcatggctgacattgA\nB tctcgtgtgaacgcagcc'), { params: { preset: 'primerdigital' } });
  assert.equal(out.items[0].role, 'ASP');
  assert.equal(out.items[1].role, '미확인');
  assert.equal(out.altKey, 'bioneer');
  assert.ok(out.summary.notes.some((n) => n.kind === 'info'));
  assert.equal(out.summary.suggested.preset !== undefined, true);
});
