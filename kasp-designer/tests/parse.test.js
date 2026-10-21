import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseInput, parseAlleles, parseMarkup, parseChrPos, basesToIupac } from '../src/core/parse.js';

const cases = JSON.parse(readFileSync(new URL('../reference/test_cases.json', import.meta.url), 'utf8')).cases;

test('parseAlleles: 이중/다중/IUPAC/InDel/MNV', () => {
  assert.deepEqual(parseAlleles('A/G').alleles.map((a) => a.seq), ['A', 'G']);
  assert.deepEqual(parseAlleles('A/C/G/T').alleles.map((a) => a.seq), ['A', 'C', 'G', 'T']);
  assert.deepEqual(parseAlleles('R').alleles.map((a) => a.seq), ['A', 'G']);
  assert.deepEqual(parseAlleles('AG/').alleles.map((a) => a.label), ['AG', 'del']);
  assert.deepEqual(parseAlleles('AG/-').alleles.map((a) => a.seq), ['AG', '']);
  assert.deepEqual(parseAlleles('GATATAC/CAGTCC').alleles.map((a) => a.seq), ['GATATAC', 'CAGTCC']);
  assert.ok(parseAlleles('A/A').error);
  assert.ok(parseAlleles('').error);
  assert.equal(basesToIupac(['A', 'G']), 'R');
  assert.equal(basesToIupac(['c', 'g']), 'S');
});

test('test_cases.json 의 다섯 레코드(여섯 서열) 모두 파싱', () => {
  const all = Object.values(cases).map((c) => c.fasta).join('\n\n');
  const { records, errors } = parseInput(all);
  assert.deepEqual(errors, []);
  assert.equal(records.length, 6);
  const byName = Object.fromEntries(records.map((r) => [r.name, r]));

  const snp = byName.Marker_SNP1;
  assert.deepEqual(snp.alleles.map((a) => a.seq), ['A', 'G']);
  assert.equal(snp.s1.length, 200);
  assert.equal(snp.s3.length, 200);
  assert.equal(snp.length, 401);

  const iu = byName.Marker_IUPAC;
  assert.deepEqual(iu.alleles.map((a) => a.seq), ['C', 'G']);
  assert.equal(iu.iupacS1.length, 1);               // 'r' 하나
  assert.equal(iu.s1[iu.iupacS1[0]], 'R');

  const indel = byName.Marker_InDel;
  assert.deepEqual(indel.alleles.map((a) => a.label), ['AG', 'del']);

  const mnv = byName.Marker_MNV;
  assert.deepEqual(mnv.alleles.map((a) => a.seq), ['GATATAC', 'CAGTCC']);
  const tri = byName.Marker_Tri;
  assert.equal(tri.alleles.length, 3);

  const ex = byName.Marker_Excl;
  assert.equal(ex.excludedS1.length, 1);
  const [a, b] = ex.excludedS1[0];
  assert.equal(ex.s1.slice(a, b), 'TAACCCAGGGTTATCCAGTTGTGGCCAATT');
  assert.equal(b, ex.s1.length - 20);               // 제외구역 뒤 20 nt 후 SNP
});

test('헤더 없는 서열은 Seq1, 이름<공백>서열 형식 허용', () => {
  const { records } = parseInput('acgtacgtacgt[A/G]acgtacgtacgt');
  assert.equal(records[0].name, 'Seq1');
  const r2 = parseInput('SNP_7 acgtac[C/T]gtacgt\nrs99 acgtac[R]gtacgt').records;
  assert.deepEqual(r2.map((r) => r.name), ['SNP_7', 'rs99']);
  assert.deepEqual(r2[1].alleles.map((a) => a.seq), ['A', 'G']);
});

test('두 번째 괄호는 주변 변이로 마스킹, 제외구역이 변이를 가로지르면 분할', () => {
  const p = parseMarkup('acgt[A/G]acg[C/T]tac');
  assert.equal(p.s3, 'ACGYTAC');
  assert.deepEqual(p.iupacS3, [3]);
  assert.ok(p.warnings.length >= 1);
  const q = parseMarkup('ac/gt[A/G]ac/gtt');
  assert.deepEqual(q.excludedS1, [[2, 4]]);
  assert.deepEqual(q.excludedS3, [[0, 2]]);
});

test('오류: 괄호 없음, 닫히지 않은 괄호', () => {
  assert.ok(parseInput('acgtacgt').records[0].error);
  assert.ok(parseInput('acgt[A/Gacgt').records[0].error);
  assert.ok(parseInput('').errors.length);
});

test('헤더에서 Chr:bp 좌표 추출', () => {
  assert.deepEqual(parseChrPos('Marker1 Chr01:12,345,678 IRGSP-1.0'), { chr: 'Chr01', pos: 12345678 });
  assert.deepEqual(parseChrPos('x chr3:100'), { chr: 'chr3', pos: 100 });
  assert.equal(parseChrPos('Marker1'), null);
});
