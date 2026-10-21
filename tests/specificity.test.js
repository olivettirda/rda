import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bestMatch, classifyPrimerSpecificity, specificityPenalty, describeSpecificity } from '../src/core/specificity.js';
import { parseInput, parseFastaPlain, parseChrPos } from '../src/core/parse.js';
import { designMarker } from '../src/core/design.js';
import { buildWorkbookData } from '../src/core/export.js';
import { CROPS, referencesFor } from '../src/core/crop.js';
import { revcomp } from '../src/core/seq.js';

const json = JSON.parse(readFileSync(new URL('../reference/test_cases.json', import.meta.url), 'utf8'));

function mutate(seq, every, offset, to) {
  let out = '';
  for (let i = 0; i < seq.length; i++) {
    if ((i + offset) % every === 0) { const b = seq[i]; out += to[b] || 'A'; }
    else out += seq[i];
  }
  return out;
}

test('bestMatch: 양 가닥 탐색, 불일치 위치는 프라이머 5′ 기준', () => {
  const t = 'TTTTTTTTTTGCATCGTTAGCCATTTTTTTTTT';
  const primer = 'GCATCGTTAGCCAT';
  const m = bestMatch(primer, t);
  assert.equal(m.mismatches, 0);
  assert.equal(m.strand, '+');
  const rc = bestMatch(revcomp(primer), t);
  assert.equal(rc.mismatches, 0);
  assert.equal(rc.strand, '-');
  const mut = primer.slice(0, 13) + (primer[13] === 'T' ? 'A' : 'T'); // 3′ 말단 변경
  const mm = bestMatch(mut, t);
  assert.equal(mm.mismatches, 1);
  assert.deepEqual(mm.positions, [13]);
  assert.equal(bestMatch('ACGTACGTACGTACGT', 'TTTTTTTTTTTTTTTTTTTTTTTT', 2), null);
});

test('classifyPrimerSpecificity: 특이 / 반특이 / 비특이', () => {
  const primer = 'ACGGTTCAGCTAGGCTTACG';
  const bg = 'GGGGGGGGGG' + primer + 'GGGGGGGGGG';
  const same = { name: 'B', seq: bg };
  const termDiff = { name: 'D', seq: 'GGGGGGGGGG' + primer.slice(0, 19) + 'T' + 'GGGGGGGGGG' }; // 3′ 말단만 다름 (G→T)
  const innerDiff = { name: 'D2', seq: 'GGGGGGGGGG' + primer.slice(0, 5) + 'A' + primer.slice(6) + 'GGGGGGGGGG' }; // 6번째 T→A
  assert.equal(classifyPrimerSpecificity(primer, [same]).class, 'nonspecific');
  assert.equal(classifyPrimerSpecificity(primer, [termDiff]).class, 'specific');
  assert.equal(classifyPrimerSpecificity(primer, [innerDiff]).class, 'semi');
  assert.equal(classifyPrimerSpecificity(primer, [termDiff, innerDiff]).class, 'semi');
  assert.equal(classifyPrimerSpecificity(primer, [termDiff, same]).class, 'nonspecific');
  assert.equal(classifyPrimerSpecificity(primer, []).class, 'unknown');
  assert.equal(specificityPenalty('nonspecific') > specificityPenalty('semi'), true);
  assert.ok(describeSpecificity(classifyPrimerSpecificity(primer, [termDiff])).includes('3′ 말단'));
});

test('parseFastaPlain 과 밀 염색체 좌표 (1A:123, chr1A:123)', () => {
  const recs = parseFastaPlain('>B_genome 1B:100\nacgt acgt\nACGT\n>D\nttttgggg\n');
  assert.deepEqual(recs.map((r) => [r.name, r.seq]), [['B_genome', 'ACGTACGTACGT'], ['D', 'TTTTGGGG']]);
  assert.deepEqual(parseChrPos('Marker 1A:12,345'), { chr: '1A', pos: 12345 });
  assert.deepEqual(parseChrPos('M chr5D:777'), { chr: 'chr5D', pos: 777 });
  assert.deepEqual(parseChrPos('Marker_SNP1 Chr01:12345678'), { chr: 'Chr01', pos: 12345678 });
  assert.deepEqual(parseChrPos('x Un:5'), { chr: 'Un', pos: 5 });
  assert.equal(parseChrPos('GC:40 Tm:57'), null);
});

test('밀 모드 설계: 상동유전체를 주면 특이 Common 이 상위, 비특이는 벌점·경고', () => {
  const [rec] = parseInput(json.cases.snp_simple.fasta).records;
  const T = rec.s1 + rec.alleles[0].seq + rec.s3;
  // 상동유전체: 17 nt 마다 치환 (3′ 말단에 걸리는 후보와 안 걸리는 후보가 섞이도록)
  const B = mutate(T, 17, 3, { A: 'G', G: 'A', C: 'T', T: 'C' });
  const D = mutate(T, 23, 11, { A: 'C', C: 'A', G: 'T', T: 'G' });
  const res = designMarker(rec, { cropMode: 'wheat', homoeologs: [{ name: 'B', seq: B }, { name: 'D', seq: D }] });
  const set = res.forward;
  assert.ok(set.commons.length >= 1);
  for (const c of set.commons) assert.ok(c.specificity && ['specific', 'semi', 'nonspecific'].includes(c.specificity.class));
  // 점수 정렬: 비특이가 특이보다 앞에 올 수 없음(동점 LC 차이는 벌점 30/8 보다 작음)
  const classes = set.commons.map((c) => c.specificity.class);
  const firstNon = classes.indexOf('nonspecific');
  const lastSpec = classes.lastIndexOf('specific');
  if (firstNon >= 0 && lastSpec >= 0) assert.ok(lastSpec < firstNon, classes.join(','));
  for (const a of set.asps) assert.ok(a.specificity);
  // 상동유전체 없이 밀 모드면 안내 경고
  const res2 = designMarker(rec, { cropMode: 'wheat' });
  assert.ok(res2.forward.warnings.some((w) => w.includes('상동유전체')));
  // 엑셀 설계근거에 작물/특이성 열
  const { basis } = buildWorkbookData([res], { which: 'forward' });
  assert.equal(basis[0].length, 14);
  assert.ok(basis[1][2].includes('밀') && basis[1][2].includes('IWGSC'));
  assert.ok(basis.slice(1).some((r) => r[11].length > 0));
});

test('작물 메타데이터와 참고 문헌', () => {
  assert.equal(CROPS.rice.genome, 'IRGSP-1.0');
  assert.equal(CROPS.wheat.ensembl, 'triticum_aestivum');
  const r = referencesFor('wheat');
  assert.ok(r.crop.some((x) => x.cite.includes('Makhoul')) && r.crop.some((x) => x.cite.includes('PolyMarker')));
  assert.ok(r.general.some((x) => x.cite.includes('SantaLucia')));
  assert.equal(referencesFor('nope').cropLabel, '벼');
});
