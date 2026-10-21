import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bundle, buildHtml, stripModuleSyntax, topLevelNames } from '../scripts/build.js';

test('stripModuleSyntax: import 제거, export 접두사 제거', () => {
  const src = `import { a, b } from './x.js';\nimport {\n  c,\n} from './y.js';\nexport function f() {}\nexport const K = 1;\nexport async function g() {}\nconst inner = 2;`;
  const out = stripModuleSyntax(src);
  assert.ok(!/^\s*import\b/m.test(out));
  assert.ok(!/^\s*export\b/m.test(out));
  assert.deepEqual(topLevelNames(out), ['f', 'K', 'g', 'inner']);
});

test('번들: 문법 오류 없음, import/export 잔존 없음, 식별자 충돌 없음', () => {
  const js = bundle();
  assert.ok(!/^\s*import\s/m.test(js));
  assert.ok(!/^\s*export\s/m.test(js));
  // 컴파일만 (실행하지 않음)
  assert.doesNotThrow(() => new Function(js));
  assert.ok(js.includes('function meltingTemp') && js.includes('function designMarker') && js.includes('function init'));
});

test('HTML: 스타일·예제·스크립트가 인라인되고 외부 스크립트가 없다', () => {
  const html = buildHtml();
  assert.ok(html.includes('<title>KASP 디자이너</title>'));
  assert.ok(!html.includes('/* @STYLE */') && !html.includes('/* @SCRIPT */') && !html.includes('/* @EXAMPLES */'));
  assert.ok(html.includes('window.KASP_EXAMPLES'));
  assert.ok(html.includes('--accent: #017f97'));
  assert.ok(!/<script[^>]+src=/i.test(html), '외부 스크립트 없음 (오프라인 동작)');
  assert.ok(html.includes('GAAGGTGACCAAGTTCATGCT'));
});
