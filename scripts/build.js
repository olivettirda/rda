#!/usr/bin/env node
/**
 * build.js — src/ 의 ES 모듈을 하나의 클래식 스크립트로 묶어 dist/kasp-designer.html 을 만든다.
 * 의존성 없음(Node 내장만). 규칙:
 *  - import 는 상대 경로의 로컬 모듈만, named export 만 사용 (default/re-export 금지)
 *  - 모든 모듈의 최상위 식별자는 전역에서 유일해야 한다(충돌 시 빌드 실패)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = path.join(ROOT, 'src', 'ui', 'app.js');
const TEMPLATE = path.join(ROOT, 'src', 'ui', 'app.html');
const STYLE = path.join(ROOT, 'src', 'ui', 'style.css');
const OUT = path.join(ROOT, 'dist', 'kasp-designer.html');

const IMPORT_RE = /^[ \t]*import\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]\s*;?[ \t]*$/gm;

export function collectModules(entry = ENTRY) {
  const order = [];
  const seen = new Set();
  const visit = (file) => {
    const abs = path.resolve(file);
    if (seen.has(abs)) return;
    seen.add(abs);
    const src = readFileSync(abs, 'utf8');
    const deps = [];
    for (const m of src.matchAll(IMPORT_RE)) {
      if (!m[1].startsWith('.')) throw new Error(`${path.relative(ROOT, abs)}: 로컬 모듈만 import 할 수 있습니다 (${m[1]})`);
      deps.push(path.resolve(path.dirname(abs), m[1]));
    }
    for (const d of deps) visit(d);
    order.push({ file: abs, src });
  };
  visit(entry);
  return order;
}

export function stripModuleSyntax(src) {
  let out = src.replace(IMPORT_RE, '');
  if (/^\s*export\s+default\b/m.test(out)) throw new Error('export default 는 지원하지 않습니다');
  if (/^\s*export\s*\{/m.test(out)) throw new Error('export { … } 재수출은 지원하지 않습니다');
  out = out.replace(/^(\s*)export\s+(?=(?:async\s+)?function\b|const\b|let\b|var\b|class\b)/gm, '$1');
  return out;
}

export function topLevelNames(src) {
  const names = [];
  const re = /^(?:async\s+)?(?:function\s*\*?\s*|const\s+|let\s+|var\s+|class\s+)([A-Za-z_$][\w$]*)/gm;
  for (const m of src.matchAll(re)) names.push(m[1]);
  return names;
}

export function bundle(entry = ENTRY) {
  const mods = collectModules(entry);
  const seen = new Map();
  const parts = [];
  for (const { file, src } of mods) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const code = stripModuleSyntax(src);
    for (const n of topLevelNames(code)) {
      if (seen.has(n)) throw new Error(`최상위 식별자 충돌: ${n} (${seen.get(n)} 과 ${rel})`);
      seen.set(n, rel);
    }
    parts.push(`/* ===== ${rel} ===== */\n${code}`);
  }
  const body = parts.join('\n\n');
  return `(function () {\n'use strict';\n${body}\n})();\n`.replace(/<\/script/gi, '<\\/script');
}

export function loadExamples() {
  const file = path.join(ROOT, 'reference', 'test_cases.json');
  if (!existsSync(file)) return {};
  const json = JSON.parse(readFileSync(file, 'utf8'));
  const out = {};
  for (const [key, c] of Object.entries(json.cases || {})) out[key] = { desc: c.desc, fasta: c.fasta };
  return out;
}

export function buildHtml() {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const html = readFileSync(TEMPLATE, 'utf8');
  const css = readFileSync(STYLE, 'utf8');
  const js = bundle();
  const examples = JSON.stringify(loadExamples()).replace(/<\/script/gi, '<\\/script');
  const stamp = new Date().toISOString().slice(0, 10);
  return html
    .replace('/* @STYLE */', () => css)
    .replace('/* @EXAMPLES */', () => `window.KASP_EXAMPLES = ${examples};\nwindow.KASP_BUILD = ${JSON.stringify({ version: pkg.version, date: stamp })};`)
    .replace('/* @SCRIPT */', () => js);
}

export function main() {
  mkdirSync(path.dirname(OUT), { recursive: true });
  const html = buildHtml();
  writeFileSync(OUT, html, 'utf8');
  const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`빌드 완료: ${path.relative(ROOT, OUT)} (${kb} KB)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
