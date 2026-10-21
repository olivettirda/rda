#!/usr/bin/env node
/**
 * demo.js — FASTA 파일(또는 reference/test_cases.json) → 콘솔 TSV 출력
 *
 * 사용:
 *   node scripts/demo.js                      # test_cases.json 의 모든 예제
 *   node scripts/demo.js path/to/markers.fa   # FASTA 파일
 *   node scripts/demo.js --preset primerdigital --reverse
 */
import { readFileSync } from 'node:fs';
import { parseInput } from '../src/core/parse.js';
import { designAll } from '../src/core/design.js';
import { toReportTsv, toSetsText } from '../src/core/export.js';

const args = process.argv.slice(2);
const opts = { preset: 'bioneer', reverse: false, file: null };
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--preset') opts.preset = args[++i];
  else if (args[i] === '--reverse') opts.reverse = true;
  else opts.file = args[i];
}

let text;
if (opts.file) {
  text = readFileSync(opts.file, 'utf8');
} else {
  const json = JSON.parse(readFileSync(new URL('../reference/test_cases.json', import.meta.url), 'utf8'));
  text = Object.values(json.cases).map((c) => c.fasta).join('\n\n');
}

const { records, errors } = parseInput(text);
for (const e of errors) console.error('오류:', e);
const results = designAll(records, { preset: opts.preset });

for (const res of results) {
  if (res.error) { console.log(`# ${res.name}: ${res.error}`); continue; }
  console.log(toSetsText(res, opts.reverse ? 'reverse' : 'forward'));
  console.log('');
}
console.log('# Report (전체 후보)');
console.log(toReportTsv(results, opts.reverse ? 'reverse' : 'forward'));
