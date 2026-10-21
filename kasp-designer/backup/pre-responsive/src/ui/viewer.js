/**
 * viewer.js — 서열 뷰어: 정방향 템플릿 위에 프라이머 위치 막대, SNP, 마스킹 표시
 */
import { MASK } from '../core/mask.js';
import { genomicCoord } from '../core/design.js';

function vEsc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/**
 * @param {HTMLElement} container
 * @param {object} result designMarker 결과
 * @param {object} view { asps, common, commons }  (app.js 의 viewOfSet)
 * @param {object} opts { rowWidth, altCount }
 */
export function renderViewer(container, result, view, opts = {}) {
  const width = opts.rowWidth || 60;
  const altCount = opts.altCount ?? 4;
  const fwd = result.forward;
  if (!fwd || !fwd.template) { container.innerHTML = '<p class="muted small">표시할 템플릿이 없습니다.</p>'; return; }
  const T = fwd.template.T0;
  const mask = fwd.mask || [];
  const n1 = result.record.s1.length;
  const snpLen = Math.max(1, result.record.alleles[0].seq.length);

  const items = [];
  view.asps.forEach((a, i) => items.push({ cls: `asp${Math.min(i, 2)}`, start: a.start, end: a.end, label: `${a.id} (${a.dir === 'F' ? '→' : '←'})` }));
  if (view.common) items.push({ cls: 'common', start: view.common.start, end: view.common.end, label: `${view.common.id} (${view.common.dir === 'F' ? '→' : '←'})` });
  let alt = 0;
  for (const c of view.commons) {
    if (c === view.common) continue;
    if (alt++ >= altCount) break;
    items.push({ cls: 'common alt', start: c.start, end: c.end, label: `${c.id} (후보 ${c.rank})` });
  }

  const legend = `<div class="vlegend">
    <span><i class="asp0"></i>ASP 1${view.asps[0] && view.asps[0].tail ? ' (' + vEsc(view.asps[0].tail.name) + ')' : ''}</span>
    <span><i class="asp1"></i>ASP 2${view.asps[1] && view.asps[1].tail ? ' (' + vEsc(view.asps[1].tail.name) + ')' : ''}</span>
    <span><i class="common"></i>Common (선택)</span>
    <span><i class="common" style="opacity:.35"></i>다른 Common 후보</span>
    <span><i class="mask"></i>마스킹(반복·저복잡도·주변 변이)</span>
    <span>밑줄 = 제외구역 · 강조 = 변이 위치 · 좌표는 정방향 1-based${result.chrPos ? ' (유전체 bp)' : ''}</span>
  </div>`;

  let rows = '';
  for (let r0 = 0; r0 < T.length; r0 += width) {
    const r1 = Math.min(T.length, r0 + width);
    let bars = '';
    for (const it of items) {
      const s = Math.max(it.start, r0 + 1);
      const e = Math.min(it.end, r1);
      if (s > e) continue;
      bars += `<div class="bar ${it.cls}" style="left:${s - (r0 + 1)}ch;width:${e - s + 1}ch" title="${vEsc(it.label)}"></div>`;
    }
    let bases = '';
    for (let i = r0; i < r1; i++) {
      const m = mask[i] || 0;
      const cls = [];
      if (m & (MASK.REPEAT | MASK.LOW_COMPLEX | MASK.IUPAC | MASK.VARIANT)) cls.push('mask');
      if (m & MASK.EXCLUDED) cls.push('excl');
      if (i >= n1 && i < n1 + snpLen) cls.push('snp');
      bases += `<span class="b${cls.length ? ' ' + cls.join(' ') : ''}">${T[i]}</span>`;
    }
    let pos = String(r0 + 1);
    if (result.chrPos) {
      const g = genomicCoord(result, r0 + 1, r0 + 1);
      pos = g.split(':')[1].split('-')[0];
    }
    rows += `<div class="vrow"><div class="pos">${pos}</div><div><div class="track">${bars}</div><div class="bases">${bases}</div></div></div>`;
  }
  container.innerHTML = `<div class="viewer">${legend}${rows}</div>`;
}
