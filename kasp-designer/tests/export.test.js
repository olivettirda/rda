import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseInput } from '../src/core/parse.js';
import { designAll } from '../src/core/design.js';
import { toReportTsv, toSetsText, toSetTsv, buildWorkbookData, EXCEL_STYLE } from '../src/core/export.js';
import { buildXlsx, listZipEntries, crc32, colLetter } from '../src/core/xlsx.js';

const json = JSON.parse(readFileSync(new URL('../reference/test_cases.json', import.meta.url), 'utf8'));
const text = Object.values(json.cases).map((c) => c.fasta).join('\n\n');
const results = designAll(parseInput(text).records, {});

test('TSV: 헤더 + ASP 행은 tail 포함 서열, Tm 은 tail 제외 값', () => {
  const tsv = toReportTsv(results, 'forward');
  const lines = tsv.split('\n');
  assert.ok(lines[0].startsWith('Marker\tID\tSequence'));
  const aspLine = lines.find((l) => l.includes('_ASP_'));
  const cols = aspLine.split('\t');
  assert.ok(cols[2].startsWith('GAAGGTGACCAAGTTCATGCT') || cols[2].startsWith('GAAGGTCGGAGTCAACGGATT'));
  assert.equal(Number(cols[3]), cols[2].length);
  const tm = Number(cols[4]);
  assert.ok(tm >= 50 && tm < 70);
  const sets = toSetsText(results[0], 'forward');
  assert.ok(sets.startsWith('[KASP Forward sets] Marker_SNP1:'));
  assert.ok(/\d+\/\d+\.\d$/m.test(sets)); // Fragment_Size/Amplicon_Tm
  assert.ok(toSetTsv(results[0], 'reverse', 0).split('\n').length >= 3);
});

test('워크북 데이터: 주문용/설계근거 2시트, 주문용 서열은 대문자', () => {
  const { order, basis } = buildWorkbookData(results, { which: 'forward' });
  assert.deepEqual(order[0], ['Primer Name', 'Sequence 5′→3′', 'Direction', 'Length', 'Purpose', 'Scale']);
  assert.ok(order.length > 1 && basis.length > 1);
  for (const row of order.slice(1)) {
    assert.equal(row[1], row[1].toUpperCase());
    assert.equal(row[3], row[1].length);
  }
  assert.equal(basis[0].length, 12);
  assert.equal(EXCEL_STYLE.headerFill, '0C3026');
});

test('xlsx: 유효한 ZIP(CRC 일치), 필수 파트, 스타일/틀고정/자동필터 포함', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  assert.equal(colLetter(0), 'A');
  assert.equal(colLetter(25), 'Z');
  assert.equal(colLetter(26), 'AA');
  const { order, basis } = buildWorkbookData(results, { which: 'forward' });
  const bytes = buildXlsx([
    { name: '주문용', rows: order, monoCols: [1] },
    { name: '설계근거', rows: basis },
  ], { fontName: 'KoPub Dotum', headerFill: '0C3026', headerFont: 'FFFFFF' });
  const entries = listZipEntries(bytes);
  const names = entries.map((e) => e.name);
  for (const need of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml']) {
    assert.ok(names.includes(need), need);
  }
  assert.ok(entries.every((e) => e.crcOk));
  const dec = new TextDecoder();
  const styles = dec.decode(entries.find((e) => e.name === 'xl/styles.xml').data);
  assert.ok(styles.includes('KoPub Dotum') && styles.includes('FF0C3026') && styles.includes('FFFFFFFF'));
  const sheet1 = dec.decode(entries.find((e) => e.name === 'xl/worksheets/sheet1.xml').data);
  assert.ok(sheet1.includes('state="frozen"') && sheet1.includes('topLeftCell="A2"'));
  assert.ok(sheet1.includes('<autoFilter ref="A1:F'));
  assert.ok(sheet1.includes('Primer Name'));
  const wb = dec.decode(entries.find((e) => e.name === 'xl/workbook.xml').data);
  assert.ok(wb.includes('name="주문용"') && wb.includes('name="설계근거"'));
  // 산출물 보관 (외부 도구로 열어 볼 수 있게)
  mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../dist/sample-export.xlsx', import.meta.url), bytes);
});
