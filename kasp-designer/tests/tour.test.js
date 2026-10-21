import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTourSteps } from '../src/ui/tourSteps.js';
import { renderManualHtml } from '../src/ui/tour.js';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../src/ui/app.html', import.meta.url), 'utf8');

test('튜토리얼 단계: 대상 선택자가 모두 app.html 에 존재하고 제목·설명이 있다', () => {
  const calls = [];
  const ctx = {
    ensureExample: () => calls.push('example'),
    ensureAnalysis: () => calls.push('analysis'),
    ensureDesigned: async () => calls.push('designed'),
    openDetails: (s) => calls.push('open:' + s),
  };
  const steps = buildTourSteps(ctx);
  assert.ok(steps.length >= 20);
  for (const s of steps) {
    assert.ok(s.title && s.text, JSON.stringify(s));
    if (s.target) {
      const id = s.target.replace(/^#/, '');
      assert.ok(html.includes(`id="${id}"`), `missing target ${s.target}`);
    }
    if (s.pane) assert.ok(html.includes(`data-pane="${s.pane}"`), `missing pane ${s.pane}`);
  }
  // before 훅 실행
  for (const s of steps) if (s.before) s.before();
  assert.ok(calls.includes('example') && calls.includes('analysis') && calls.includes('designed'));
});

test('서면 매뉴얼 HTML: 그룹 제목과 단계 번호, 재생 링크', () => {
  const steps = buildTourSteps({ ensureExample() {}, ensureAnalysis() {}, ensureDesigned() {}, openDetails() {} });
  const out = renderManualHtml(steps);
  assert.ok(out.includes('<h3>시작</h3>') && out.includes('<h3>결과</h3>'));
  assert.ok(out.includes(`data-play="${steps.length - 1}"`));
  assert.equal((out.match(/class="manual-step"/g) || []).length, steps.length);
});
