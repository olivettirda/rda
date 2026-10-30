import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseInput } from '../src/core/parse.js';
import { designMarker, findAspEndColumn, parseEndPatterns, orientRecord, DEFAULT_PARAMS, genomicCoord } from '../src/core/design.js';
import { meltingTemp, makeConditions, TM_PRESETS } from '../src/core/tm.js';
import { revcomp } from '../src/core/seq.js';

const json = JSON.parse(readFileSync(new URL('../reference/test_cases.json', import.meta.url), 'utf8'));
const cases = json.cases;
const rules = json.expect.design_rules;
const tails = json.expect.tails;

function rec(key) {
  const { records, errors } = parseInput(cases[key].fasta);
  assert.deepEqual(errors, []);
  return records;
}

test('findAspEndColumn: SNP/InDel/MNV', () => {
  assert.deepEqual(findAspEndColumn(['A', 'G'], 'caag', 1), { endCol: 0, diffCount: 1 });
  // [AG/] + s3 'acat...' : 열0 A=a 동일, 열1 G≠c → endCol 1
  assert.deepEqual(findAspEndColumn(['AG', ''], 'ACATAATCG', 1), { endCol: 1, diffCount: 1 });
  assert.deepEqual(findAspEndColumn(['GATATAC', 'CAGTCC'], 'TTGA', 1), { endCol: 0, diffCount: 1 });
  assert.deepEqual(findAspEndColumn(['A', 'C', 'G'], 'TTT', 1), { endCol: 0, diffCount: 1 });
  assert.equal(findAspEndColumn(['A', 'A'], 'TTT', 1).diffCount, 0);
});

test('parseEndPatterns', () => {
  assert.deepEqual(parseEndPatterns('n'), []);
  assert.deepEqual(parseEndPatterns(''), []);
  assert.deepEqual(parseEndPatterns('sws ssw sww'), ['SWS', 'SSW', 'SWW']);
});

test('orientRecord: Reverse 는 s1↔s3 역상보, 좌표 뒤집힘', () => {
  const [r] = rec('excluded_region');
  const o = orientRecord(r, 'R');
  assert.equal(o.s1, revcomp(r.s3));
  assert.equal(o.s3, revcomp(r.s1));
  assert.deepEqual(o.alleles.map((a) => a.seq), ['G', 'A']);
  const [[a, b]] = r.excludedS1;
  const [[c, d]] = o.excludedS3;
  assert.equal(c, r.s1.length - b);
  assert.equal(d, r.s1.length - a);
});

test('단순 SNP: ASP 2개 + Common ≥1, 3′ 말단 = 변이, Tm 범위, amplicon 계산 일치', () => {
  const [r] = rec('snp_simple');
  const res = designMarker(r, {});
  for (const set of [res.forward, res.reverse]) {
    assert.equal(set.asps.length, 2);
    assert.ok(rules.asp_count_equals_alleles && set.asps.every(Boolean));
    assert.ok(set.commons.length >= 1, `${set.dir}: ${set.warnings.join(' ')}`);
    // ASP 3' 말단이 변이 염기 (방향별 allele 서열)
    for (const asp of set.asps) {
      const expected3 = set.template.alleles[asp.alleleIndex].seq;
      assert.equal(asp.body.slice(-expected3.length), expected3);
      assert.ok(asp.bodyDisplay.slice(-1) === asp.bodyDisplay.slice(-1).toUpperCase());
      assert.ok(asp.length >= DEFAULT_PARAMS.aspMinLen && asp.length <= DEFAULT_PARAMS.aspMaxLen);
      // Tm 은 tail 제외 본체로 계산되어야 함
      const cond = makeConditions(TM_PRESETS.bioneer);
      assert.ok(Math.abs(asp.tm - meltingTemp(asp.body, cond)) < 1e-9);
      assert.ok(asp.tm >= 57 - 1e-9, `ASP Tm ${asp.tm}`);
    }
    // tail
    assert.equal(set.asps[0].tail.name, 'FAM');
    assert.equal(set.asps[0].full.startsWith(tails.FAM), true);
    assert.equal(set.asps[1].full.startsWith(tails.HEX), true);
    assert.equal(set.asps[0].fullLength, set.asps[0].length + 21);
    // Common
    for (const c of set.commons) {
      assert.ok(c.tm >= rules.common_tm_range[0] && c.tm <= rules.common_tm_range[1], `Tm ${c.tm}`);
      assert.ok(c.lc >= rules.lc_min);
      assert.ok(c.length >= DEFAULT_PARAMS.commonMinLen && c.length <= DEFAULT_PARAMS.commonMaxLen);
      // Common 서열은 s3 역상보의 부분 서열
      assert.ok(revcomp(set.template.s3).includes(c.seqUpper));
    }
    const best = set.commons[0];
    assert.ok(best.amplicons.every((a) => a.size >= rules.amplicon_bp[0] && a.size <= rules.amplicon_bp[1]), best.ampliconLabel);
    // amplicon 수동 계산: common 끝(템플릿) − ASP 시작 + tail
    const asp = set.asps[0];
    const manual = best.end0 - asp.start0 + 21;
    assert.equal(best.amplicons[0].size, manual);
  }
});

test('IUPAC 1문자 변이 + 주변 r 마스킹', () => {
  const [r] = rec('snp_iupac');
  const res = designMarker(r, {});
  assert.deepEqual(res.forward.asps.map((a) => a.alleleLabel), ['C', 'G']);
  assert.ok(res.forward.commons.length >= 1);
  // Reverse 세트에서 주변 변이(r) 가 s3 에 들어가므로 Common 이 그 위치를 덮지 않아야 함
  const rv = res.reverse;
  const iupacPos = rv.template.s3Offset + orientRecord(r, 'R').iupacS3[0];
  for (const c of rv.commons) assert.ok(c.end0 <= iupacPos || c.start0 > iupacPos, `${c.id} covers IUPAC`);
});

test('InDel: 대립유전자별 amplicon 크기가 결실 길이만큼 다름', () => {
  const [r] = rec('indel');
  const res = designMarker(r, {});
  for (const set of [res.forward, res.reverse]) {
    assert.equal(set.asps.length, 2);
    assert.ok(set.commons.length >= 1, set.warnings.join(' '));
    const best = set.commons[0];
    const sizes = Object.fromEntries(best.amplicons.map((a) => [a.label, a.size]));
    assert.ok(Math.abs(sizes.AG - sizes.del) <= 2, JSON.stringify(sizes));
    // 두 ASP 의 3' 말단 염기가 서로 다름
    const ends = set.asps.map((a) => a.body.slice(-1));
    assert.notEqual(ends[0], ends[1]);
  }
});

test('MNV + 3대립: 3대립은 tail 없이 경고', () => {
  const recs = rec('mnv_multi');
  const mnv = designMarker(recs[0], {});
  assert.equal(mnv.forward.asps.length, 2);
  assert.ok(mnv.forward.commons.length >= 1);
  const tri = designMarker(recs[1], {});
  assert.equal(tri.forward.asps.length, 3);
  assert.ok(tri.forward.asps.every((a) => a.tail === null));
  assert.ok(tri.forward.warnings.some((w) => w.includes('tail')));
  assert.ok(tri.forward.commons.length >= 1);
});

test('제외구역: Reverse 세트의 Common 이 제외구역을 덮지 않고, Forward ASP 는 가능하면 피함', () => {
  const [r] = rec('excluded_region');
  const res = designMarker(r, {});
  const rv = res.reverse;
  const o = orientRecord(r, 'R');
  const [[ea, eb]] = o.excludedS3.map(([a, b]) => [rv.template.s3Offset + a, rv.template.s3Offset + b]);
  for (const c of rv.commons) assert.ok(c.end0 <= ea || c.start0 >= eb, `${c.id} overlaps excluded`);
  const fw = res.forward;
  for (const asp of fw.asps) {
    const [[xa, xb]] = r.excludedS1;
    const overlaps = !(asp.end0 <= xa || asp.start0 >= xb);
    if (overlaps) assert.ok(asp.warnings.some((w) => w.includes('제외구역')));
  }
});

test('파라미터: tail 미사용, Common 개수 제한, 3′ 패턴, 겹침 허용', () => {
  const [r] = rec('snp_simple');
  const noTail = designMarker(r, { useTails: false });
  assert.ok(noTail.forward.asps.every((a) => a.tail === null && a.full === a.bodyDisplay));
  const pat = designMarker(r, { endPattern: 'sws ssw' });
  for (const c of pat.forward.commons) assert.ok(/[GC][AT][GC]$|[GC][GC][AT]$/.test(c.seqUpper), c.seqUpper);
  const overlap = designMarker(r, { allowOverlap: true });
  const collapsed = designMarker(r, { allowOverlap: false });
  assert.ok(overlap.forward.commons.length >= collapsed.forward.commons.length);
});

test('primerdigital 프리셋은 같은 서열에서 Tm 이 더 높게 계산', () => {
  const [r] = rec('snp_simple');
  const b = designMarker(r, {});
  const pd = designMarker(r, { preset: 'primerdigital' });
  const body = b.forward.asps[0].body;
  const tmB = meltingTemp(body, makeConditions(TM_PRESETS.bioneer));
  const tmP = meltingTemp(body, makeConditions(TM_PRESETS.primerdigital));
  assert.ok(tmP > tmB, `${tmP} vs ${tmB}`);
  assert.ok(pd.forward.asps[0].length <= b.forward.asps[0].length);
});

test('유전체 좌표 변환', () => {
  const { records } = parseInput('>M1 Chr01:1000\nacgtacgtacgtacgtacgtacgtacgt[A/G]acgtacgtacgtacgtacgtacgtacgt');
  const res = designMarker(records[0], {});
  // 템플릿 1-based 29 = SNP = 1000
  assert.equal(genomicCoord(res, 29, 29), 'Chr01:1000-1000');
  assert.equal(genomicCoord(res, 1, 10), 'Chr01:972-981');
});
