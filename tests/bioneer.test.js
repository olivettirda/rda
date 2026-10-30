import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseInput } from '../src/core/parse.js';
import { designMarker, PRESET_TM_WINDOW } from '../src/core/design.js';
import { buildBioneerOrderRows, toBioneerPasteTsv, bioneerOrderItems, bioneerName, bioneerSequence, BIONEER_HEADER, BIONEER_SCALES, BIONEER_PURIFICATIONS, BIONEER_SHEET_NAME } from '../src/core/export.js';
import { buildXlsx, listZipEntries } from '../src/core/xlsx.js';

const rec = parseInput(readFileSync(new URL('../reference/bsr1_snp913_template.fa', import.meta.url), 'utf8')).records[0];
const res = designMarker(rec, { preset: 'primerdigital', tmMin: PRESET_TM_WINDOW.primerdigital[0], tmMax: PRESET_TM_WINDOW.primerdigital[1] });

test('바이오니어 이름/서열 규칙', () => {
  assert.equal(bioneerName('bsr1#snp913 | F_174-201_ASP_A'), 'bsr1snp913_F_174-201_ASP_A');
  assert.equal(bioneerSequence('gaaggt gacc-aag[A/G]u'), 'GAAGGTGACCAAGAGT');
});

test('주문 행: ASP 2 + Common 1, tail 포함 대문자 서열, 기본 25 nmole / BioRP', () => {
  const items = bioneerOrderItems([res], { which: 'forward' });
  assert.equal(items.length, 3);
  assert.ok(items[0].seq.startsWith('GAAGGTGACCAAGTTCATGCT'));
  assert.ok(items[1].seq.startsWith('GAAGGTCGGAGTCAACGGATT'));
  for (const it of items) {
    assert.ok(BIONEER_SCALES.includes(it.scale) && BIONEER_PURIFICATIONS.includes(it.purification));
    assert.ok(/^[ACGT]+$/.test(it.seq));
    assert.ok(!/[#|\s]/.test(it.name));
  }
  const custom = bioneerOrderItems([res], { which: 'forward', aspScale: '50 nmole', aspPurification: 'HPLC', scale: '25 nmole', purification: 'PAGE', includeCommon: false });
  assert.equal(custom.length, 2);
  assert.equal(custom[0].scale, '50 nmole');
  assert.equal(custom[0].purification, 'HPLC');
  const both = bioneerOrderItems([res], { which: 'both' });
  assert.equal(both.length, 6);
});

test('업로드 양식 시트: 공식 헤더·작성방법 열, 붙여넣기 TSV 열 구성', () => {
  const { rows, items } = buildBioneerOrderRows([res], { which: 'forward' });
  assert.deepEqual(rows[0], Array.from(BIONEER_HEADER));
  assert.equal(rows[1][0], items[0].name);
  assert.equal(rows[1][5], 'A 열 : Oligo Name');
  assert.ok(rows.some((r) => r[5] === '파일 > 저장하기 *.xls'));
  const tsv = toBioneerPasteTsv([res], { which: 'forward' });
  const lines = tsv.split('\n');
  assert.equal(lines[0].split('\t').length, 8);
  assert.equal(lines.length, 4);
  assert.equal(lines[1].split('\t')[0], '1');
});

test('xlsx: 시트명·드롭다운(데이터 유효성)·헤더 평문·필터 없음', () => {
  const { rows } = buildBioneerOrderRows([res], { which: 'forward' });
  const bytes = buildXlsx([{ name: BIONEER_SHEET_NAME, rows, plainHeader: true, noFilter: true, noFreeze: true, validations: [{ sqref: 'B2:B200', list: [...BIONEER_SCALES] }, { sqref: 'C2:C200', list: [...BIONEER_PURIFICATIONS] }] }], { fontName: '맑은 고딕' });
  const entries = listZipEntries(bytes);
  assert.ok(entries.every((e) => e.crcOk));
  const dec = new TextDecoder();
  const wb = dec.decode(entries.find((e) => e.name === 'xl/workbook.xml').data);
  assert.ok(wb.includes(`name="${BIONEER_SHEET_NAME}"`));
  assert.ok(!wb.includes('_FilterDatabase'));
  const sheet = dec.decode(entries.find((e) => e.name === 'xl/worksheets/sheet1.xml').data);
  assert.ok(sheet.includes('<dataValidations count="2">'));
  assert.ok(sheet.includes('25 nmole,50 nmole,200 nmole,1000 nmole,10000 nmole,15000 nmole'));
  assert.ok(sheet.includes('BioRP,PAGE,HPLC'));
  assert.ok(!sheet.includes('<autoFilter'));
  assert.ok(!sheet.includes('state="frozen"'));
  assert.ok(sheet.includes('Oligo NAME'));
  assert.ok(sheet.includes('s="3"') && !/<c r="A1"[^>]*s="1"/.test(sheet));
  mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../dist/sample-bioneer-order.xlsx', import.meta.url), bytes);
});
