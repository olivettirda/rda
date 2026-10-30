import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseInput } from '../src/core/parse.js';
import { designMarker, PRESET_TM_WINDOW } from '../src/core/design.js';
import { bioneerScaleFor, bioneerOrderItems, BIONEER_SCALE_RANGES } from '../src/core/export.js';

test('scale 길이 규칙: 25 nmole 은 15–34 mer, 그 밖은 다음 scale 로 상향', () => {
  assert.deepEqual(BIONEER_SCALE_RANGES['25 nmole'], [15, 34]);
  assert.deepEqual(bioneerScaleFor(25, '25 nmole'), { scale: '25 nmole', adjusted: false });
  assert.equal(bioneerScaleFor(49, '25 nmole').scale, '50 nmole');
  assert.equal(bioneerScaleFor(49, '25 nmole').adjusted, true);
  assert.equal(bioneerScaleFor(80, '50 nmole').scale, '200 nmole');
  assert.equal(bioneerScaleFor(120, '25 nmole').scale, '1000 nmole');
  assert.equal(bioneerScaleFor(49, '200 nmole').scale, '200 nmole');
  assert.equal(bioneerScaleFor(12, '25 nmole').scale, '50 nmole');
  assert.equal(bioneerScaleFor(200, '25 nmole').unsupported, true);
});

test('bsr1 주문 행: tail 포함 49-mer ASP 는 50 nmole 로 자동 조정, 25-mer Common 은 25 nmole 유지', () => {
  const rec = parseInput(readFileSync(new URL('../reference/bsr1_snp913_template.fa', import.meta.url), 'utf8')).records[0];
  const res = designMarker(rec, { preset: 'primerdigital', tmMin: PRESET_TM_WINDOW.primerdigital[0], tmMax: PRESET_TM_WINDOW.primerdigital[1] });
  const items = bioneerOrderItems([res], { which: 'forward', scale: '25 nmole', aspScale: '25 nmole' });
  assert.equal(items.length, 3);
  assert.equal(items[0].length, 49);
  assert.equal(items[0].scale, '50 nmole');
  assert.equal(items[0].adjusted, true);
  assert.ok(items[0].note.includes('50 nmole'));
  assert.equal(items[2].length, 25);
  assert.equal(items[2].scale, '25 nmole');
  assert.equal(items[2].adjusted, false);
  const raw = bioneerOrderItems([res], { which: 'forward', autoScale: false });
  assert.equal(raw[0].scale, '25 nmole');
});
