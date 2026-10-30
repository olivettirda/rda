/**
 * app.js — KASP 디자이너 UI (단일 HTML 번들의 진입점)
 */
import { parseInput, summarizeRecords } from '../core/parse.js';
import { designAll, DEFAULT_TAILS, mergeParams, genomicCoord, PRESET_TM_WINDOW } from '../core/design.js';
import { TM_PRESETS } from '../core/tm.js';
import { toReportTsv, toSetsText, toSetTsv, buildWorkbookData, EXCEL_STYLE, fmt1, buildBioneerOrderRows, toBioneerPasteTsv, bioneerOrderItems, BIONEER_SCALES, BIONEER_PURIFICATIONS, BIONEER_SHEET_NAME } from '../core/export.js';
import { buildXlsx } from '../core/xlsx.js';
import { applyAlleleSizing } from '../core/sizing.js';
import { parsePrimerList, analyzePrimers, analysisToTsv } from '../core/analyze.js';
import { parseFastaPlain } from '../core/parse.js';
import { CROPS, cropOf, referencesFor } from '../core/crop.js';
import { SPECIFICITY_LABEL, describeSpecificity } from '../core/specificity.js';
import { gcPercent } from '../core/seq.js';
import { ICONS } from './icons.js';
import { renderViewer } from './viewer.js';
import { fetchVariantFasta } from './rsid.js';
import { createTour, renderManualHtml } from './tour.js';
import { buildTourSteps } from './tourSteps.js';

const EXAMPLES = (typeof window !== 'undefined' && window.KASP_EXAMPLES) || {};
const BUILD = (typeof window !== 'undefined' && window.KASP_BUILD) || { version: 'dev', date: '' };
const STORE_INPUT = 'kasp-input';
const STORE_SETTINGS = 'kasp-settings';

const ui = {
  params: mergeParams({}),
  mode: 'kasp',
  sizing: { bandStep: 20, secondMismatch: false, maxLen: 45 },
  records: [], parseErrors: [], results: [],
  marker: 0, dir: 'forward', commonPick: {},
  exportScope: 'current', exportDir: 'selected',
  stale: false,
  analysis: null,
  tour: null,
  crop: 'rice',
  commonSort: 'score',
};
const STORE_WELCOME = 'kasp-welcome-seen';
const STORE_HOMOEOLOG = 'kasp-homoeologs';

const EXAMPLE_PRIMERS = [
  'Marker_SNP1_ASP_A\tGAAGGTGACCAAGTTCATGCTccggcatggctgacattgA',
  'Marker_SNP1_ASP_G\tGAAGGTCGGAGTCAACGGATTccggcatggctgacattgG',
  'Marker_SNP1_Common\ttctcgtgtgaacgcagcc',
].join('\n');

const PARAM_LABELS = {
  preset: 'Tm 프리셋', tmMin: 'Tm 하한 (°C)', tmMax: 'Tm 상한 (°C)',
  aspMinLen: 'ASP 최소 길이 (nt)', aspMaxLen: 'ASP 최대 길이 (nt)',
  commonMinLen: 'Common 최소 길이 (nt)', commonMaxLen: 'Common 최대 길이 (nt)',
  gcMin: 'GC 하한 (%)', gcMax: 'GC 상한 (%)',
  ampliconMin: 'Amplicon 권장 최소 (bp)', ampliconMax: 'Amplicon 권장 최대 (bp)',
  useTails: 'tail 부착', tails: 'Tail 서열', tmDiffMax: 'ASP–Common Tm 차 허용 (°C)', minLC: 'LC 하한 (%)',
};

/* ---------- 작은 도우미 ---------- */
function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function clampNum(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function presetLabel() { return ui.params.preset === 'custom' ? '사용자 정의' : (TM_PRESETS[ui.params.preset] || TM_PRESETS.bioneer).label; }

let toastTimer = null;
function toast(msg) {
  const el = qs('#toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2500);
}
function progress(on) {
  const el = qs('#progress');
  if (on) { el.classList.remove('done'); el.classList.add('on'); }
  else { el.classList.add('done'); setTimeout(() => el.classList.remove('on', 'done'), 400); }
}
async function copyText(text, msg = '복사했습니다') {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = false; }
  if (!ok) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
  }
  toast(ok ? msg : '복사하지 못했습니다. 표를 드래그해 복사하세요.');
}
function downloadBytes(bytes, filename, type) {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function saveSettings() {
  try {
    localStorage.setItem(STORE_SETTINGS, JSON.stringify({ params: ui.params, mode: ui.mode, sizing: ui.sizing, exportScope: ui.exportScope, exportDir: ui.exportDir, crop: ui.crop }));
  } catch { /* 저장 불가 환경 */ }
}
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORE_SETTINGS);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.params) ui.params = mergeParams(s.params);
    if (s.mode === 'kasp' || s.mode === 'sizing') ui.mode = s.mode;
    if (s.sizing) ui.sizing = { ...ui.sizing, ...s.sizing };
    if (s.exportScope) ui.exportScope = s.exportScope;
    if (s.exportDir) ui.exportDir = s.exportDir;
    if (s.crop && CROPS[s.crop]) ui.crop = s.crop;
  } catch { /* 무시 */ }
}

/* ---------- 작물 모드 · 상동유전체 · 참고 문헌 ---------- */
function homoeologsFromInput() {
  const el = qs('#homoeologInput');
  if (!el || !cropOf(ui.crop).homoeologs) return [];
  return parseFastaPlain(el.value);
}
function renderHomoeologSummary() {
  const el = qs('#homoeologSummary');
  const list = homoeologsFromInput();
  if (!qs('#homoeologInput').value.trim()) {
    el.textContent = '목표 유전체가 아닌 상동 서열(예: A 유전체 마커라면 B·D)을 FASTA 로 넣으면, 설계된 ASP·Common 이 그 서열과 3′ 말단에서 다른지(특이 / 반특이 / 비특이) 검사해 Common 후보 순위와 경고에 반영합니다.';
    return;
  }
  el.textContent = list.length
    ? `${list.length}개 상동 서열 · ${list.map((h) => `${h.name} ${h.seq.length.toLocaleString()} nt`).join(' · ')}`
    : '서열을 읽지 못했습니다. >이름 줄 다음에 염기 서열을 넣어 주세요.';
}
function renderCropInfo() {
  const crop = cropOf(ui.crop);
  setSegment(qs('#cropSeg'), crop.key);
  qs('#cropPloidy').textContent = crop.ploidy ? `${crop.latin} · ${crop.ploidy}` : '';
  qs('#cropNote').textContent = crop.note;
  qs('#homoeologBox').hidden = !crop.homoeologs;
  qs('#coordExample').textContent = crop.chrExample.split(' ')[0];
  qs('#genomeLabel').textContent = crop.genome || '헤더 표기 그대로';
  renderHomoeologSummary();
}
function renderRefs() {
  const { general, crop, cropLabel } = referencesFor(ui.crop);
  const item = (r) => `<li>${escapeHtml(r.cite)}${r.doi ? ` <a href="https://doi.org/${escapeHtml(r.doi)}" target="_blank" rel="noopener">doi:${escapeHtml(r.doi)}</a>` : ''}<br><span class="ref-why">— ${escapeHtml(r.why)}</span></li>`;
  qs('#refsBody').innerHTML = `
    ${crop.length ? `<div class="ref-group">${escapeHtml(cropLabel)} 관련</div><ol class="ref-list">${crop.map(item).join('')}</ol>` : ''}
    <div class="ref-group">공통 (Tm · KASP 원리 · 지표)</div><ol class="ref-list">${general.map(item).join('')}</ol>`;
  qs('#refsSub').textContent = crop.length ? `공통 ${general.length}편 + ${cropLabel} ${crop.length}편` : `공통 ${general.length}편`;
}
function setCrop(key) {
  const prev = cropOf(ui.crop);
  ui.crop = cropOf(key).key;
  const crop = cropOf(ui.crop);
  const sp = qs('#rsidSpecies');
  if (sp && (!sp.value.trim() || sp.value.trim() === prev.ensembl) && crop.ensembl) sp.value = crop.ensembl;
  renderCropInfo();
  renderRefs();
  renderActionSummary();
  onParamsChanged();
}
function mutateSeq(seq, every, offset, map) {
  let out = '';
  for (let i = 0; i < seq.length; i++) out += ((i + offset) % every === 0) ? (map[seq[i]] || 'A') : seq[i];
  return out;
}
function loadWheatExample() {
  if (!EXAMPLES.snp_simple) return;
  const { records } = parseInput(EXAMPLES.snp_simple.fasta);
  const rec = records[0];
  if (!rec || rec.error) return;
  const T = (rec.s1 + rec.alleles[0].seq + rec.s3).toUpperCase();
  const B = mutateSeq(T, 17, 3, { A: 'G', G: 'A', C: 'T', T: 'C' });
  const D = mutateSeq(T, 23, 11, { A: 'C', C: 'A', G: 'T', T: 'G' });
  const fasta = `>Wheat_demo 1A:12345678 합성예제(벼 서열 기반 가상 데이터)\n${rec.s1.toLowerCase()}[${rec.alleles.map((a) => a.seq).join('/')}]${rec.s3.toLowerCase()}`;
  setInputText(fasta);
  qs('#homoeologInput').value = `>B_genome 합성(17 nt 마다 치환)\n${B.toLowerCase()}\n>D_genome 합성(23 nt 마다 치환)\n${D.toLowerCase()}`;
  try { localStorage.setItem(STORE_HOMOEOLOG, qs('#homoeologInput').value); } catch { /* 무시 */ }
  renderHomoeologSummary();
  onParamsChanged();
  toast('밀 합성 예제를 불러왔습니다 (실제 밀 서열이 아닙니다)');
}
function bindCrop() {
  bindSegment(qs('#cropSeg'), setCrop);
  const ta = qs('#homoeologInput');
  ta.addEventListener('input', debounce(() => {
    renderHomoeologSummary();
    try { localStorage.setItem(STORE_HOMOEOLOG, ta.value); } catch { /* 무시 */ }
    onParamsChanged();
  }, 150));
  qs('#homoeologClearBtn').addEventListener('click', () => { ta.value = ''; renderHomoeologSummary(); try { localStorage.removeItem(STORE_HOMOEOLOG); } catch { /* 무시 */ } onParamsChanged(); });
  qs('#homoeologExampleBtn').addEventListener('click', () => { if (ui.crop !== 'wheat') setCrop('wheat'); loadWheatExample(); });
  try { ta.value = localStorage.getItem(STORE_HOMOEOLOG) || ''; } catch { /* 무시 */ }
  renderCropInfo();
  renderRefs();
}
function specBadge(pr) {
  const s = pr && pr.specificity;
  if (!s || s.class === 'unknown') return '';
  const cls = s.class === 'specific' ? '' : s.class === 'semi' ? 'warn' : 'err';
  return `<span class="badge spec ${cls}" title="${escapeHtml(describeSpecificity(s))}">${escapeHtml(SPECIFICITY_LABEL[s.class])}</span>`;
}

/* ---------- 테마 ---------- */
function effectiveTheme() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'light' || t === 'dark') return t;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyThemeIcon() { qs('#themeBtn').innerHTML = effectiveTheme() === 'dark' ? ICONS.sun : ICONS.moon; }
function toggleTheme() {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('kasp-theme', next); } catch { /* 무시 */ }
  applyThemeIcon();
}

/* ---------- 세그먼트 ---------- */
function setSegment(el, value) {
  qsa('button', el).forEach((b) => b.classList.toggle('on', b.dataset.value === String(value)));
}
function bindSegment(el, onChange) {
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-value]');
    if (!b || !el.contains(b)) return;
    setSegment(el, b.dataset.value);
    onChange(b.dataset.value);
  });
}

/* ---------- 화면 전환 ---------- */
function showPane(name) {
  qsa('.pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === name));
  qsa('.nav-item').forEach((b) => b.classList.toggle('on', b.dataset.pane === name));
  window.scrollTo({ top: 0 });
}

/* ---------- 파라미터 폼 ---------- */
function onParamsChanged() {
  if (ui.results.length) ui.stale = true;
  renderActionSummary();
  saveSettings();
}
function bindParamInputs() {
  qsa('.num[data-param]').forEach((wrap) => {
    const key = wrap.dataset.param;
    const [range, num] = qsa('input', wrap);
    const commit = (raw) => {
      let v = Number(raw);
      if (!Number.isFinite(v)) return;
      v = clampNum(v, Number(num.min), Number(num.max));
      ui.params[key] = v; range.value = v; num.value = v;
      onParamsChanged();
    };
    range.addEventListener('input', () => commit(range.value));
    num.addEventListener('change', () => commit(num.value));
  });
  qsa('[data-param-text]').forEach((inp) => inp.addEventListener('change', () => { ui.params[inp.dataset.paramText] = inp.value.trim() || 'n'; inp.value = ui.params[inp.dataset.paramText]; onParamsChanged(); }));
  qsa('[data-param-bool]').forEach((inp) => inp.addEventListener('change', () => { ui.params[inp.dataset.paramBool] = inp.checked; onParamsChanged(); }));
  qsa('[data-custom]').forEach((inp) => inp.addEventListener('change', () => { ui.params.custom[inp.dataset.custom] = Number(inp.value) || 0; onParamsChanged(); renderPresetDesc(); }));
  qsa('[data-custom-select]').forEach((sel) => sel.addEventListener('change', () => { const k = sel.dataset.customSelect; ui.params.custom[k] = k === 'ctDivisor' ? Number(sel.value) : sel.value; onParamsChanged(); renderPresetDesc(); }));
  qs('#resetParamsBtn').addEventListener('click', () => {
    const keepTails = ui.params.tails;
    ui.params = mergeParams({ tails: keepTails });
    syncParamsForm();
    onParamsChanged();
    toast('기본값으로 되돌렸습니다');
  });
}
function renderPresetDesc() {
  const p = ui.params;
  const el = qs('#presetDesc');
  if (p.preset === 'custom') {
    el.textContent = `Na⁺ ${p.custom.na_mM} mM · Mg²⁺ ${p.custom.mg_mM} mM · dNTP ${p.custom.dntp_mM ?? 0} mM · 올리고 ${p.custom.oligo_nM} nM${p.custom.wallaceBelow ? ` · ${p.custom.wallaceBelow} nt 미만 Wallace rule` : ''} · ${p.custom.saltMethod === 'owczarzy' ? 'Owczarzy 보정' : 'SantaLucia 염 보정'} · ${Number(p.custom.ctDivisor) === 1 ? 'ln(Ct)' : 'ln(Ct/4)'}`;
  } else {
    const t = TM_PRESETS[p.preset] || TM_PRESETS.bioneer;
    el.textContent = t.saltMethod === 'santalucia'
      ? `${t.label}: Na⁺ ${t.na_mM} mM · Mg²⁺ ${t.mg_mM} mM · dNTP ${t.dntp_mM} mM · 올리고 ${t.oligo_nM} nM · ${t.wallaceBelow} nt 미만 Wallace rule · SantaLucia 1998 염 보정(Mg→Na 환산) — 바이오니어 Tm 계산기·주문 페이지 ※Tm 과 동일(실측 16개 일치) · 기본 Tm 창 57–62`
      : `${t.label}: Na⁺ ${t.na_mM} mM · Mg²⁺ ${t.mg_mM} mM · 올리고 ${t.oligo_nM} nM${t.ctDivisor === 1 ? ' · ln(Ct) 관례(사이트 실측 38개와 ±0.05 °C 일치) · 기본 Tm 창 60–62' : ' · ln(Ct/4) 관례'} — SantaLucia 1998 + Owczarzy 염 보정`;
  }
  qs('#customCond').hidden = p.preset !== 'custom';
}
function setPreset(value) {
  const prevWin = PRESET_TM_WINDOW[ui.params.preset];
  const nextWin = PRESET_TM_WINDOW[value];
  ui.params.preset = value;
  // 이전 프리셋의 기본 Tm 창을 그대로 쓰고 있었다면 새 프리셋의 기본 창으로 바꾼다 (사용자 지정값은 유지)
  if (prevWin && nextWin && ui.params.tmMin === prevWin[0] && ui.params.tmMax === prevWin[1] && (prevWin[0] !== nextWin[0] || prevWin[1] !== nextWin[1])) {
    ui.params.tmMin = nextWin[0];
    ui.params.tmMax = nextWin[1];
    qsa('.num[data-param="tmMin"] input').forEach((i) => { i.value = nextWin[0]; });
    qsa('.num[data-param="tmMax"] input').forEach((i) => { i.value = nextWin[1]; });
    toast(`${presetLabelFor(ui.params)} 기본 Tm 창 ${nextWin[0]}–${nextWin[1]} °C 를 적용했습니다`);
  }
  setSegment(qs('#presetSeg'), value === 'custom' ? '' : value);
  setSegment(qs('#presetSeg2'), value);
  renderPresetDesc();
  onParamsChanged();
}
function syncParamsForm() {
  const p = ui.params;
  qsa('.num[data-param]').forEach((wrap) => {
    const v = p[wrap.dataset.param];
    qsa('input', wrap).forEach((i) => { i.value = v; });
  });
  qsa('[data-param-text]').forEach((inp) => { inp.value = p[inp.dataset.paramText] ?? ''; });
  qsa('[data-param-bool]').forEach((inp) => { inp.checked = !!p[inp.dataset.paramBool]; });
  qsa('[data-custom]').forEach((inp) => { inp.value = p.custom[inp.dataset.custom] ?? 0; });
  qsa('[data-custom-select]').forEach((sel) => { sel.value = String(p.custom[sel.dataset.customSelect] ?? (sel.dataset.customSelect === 'ctDivisor' ? 4 : 'santalucia')); });
  setSegment(qs('#presetSeg'), p.preset === 'custom' ? '' : p.preset);
  setSegment(qs('#presetSeg2'), p.preset);
  renderPresetDesc();
  renderTailRows();
  setSegment(qs('#modeSeg'), ui.mode);
  renderModeCards();
  qs('#bandStep').value = String(ui.sizing.bandStep);
  qs('#sizingMaxLen').value = ui.sizing.maxLen;
  qs('#secondMismatch').checked = ui.sizing.secondMismatch;
  setSegment(qs('#exportScopeSeg'), ui.exportScope);
  setSegment(qs('#exportDirSeg'), ui.exportDir);
}

/* ---------- Tail / 모드 ---------- */
function renderTailRows() {
  const box = qs('#tailRows');
  box.innerHTML = ui.params.tails.map((t, i) => `
    <div class="tail-row">
      <input type="text" value="${escapeHtml(t.name)}" aria-label="tail 이름" data-tail-name="${i}">
      <input type="text" class="mono" value="${escapeHtml(t.seq)}" aria-label="tail 서열" data-tail-seq="${i}" spellcheck="false" autocapitalize="off">
      <span class="len">${t.seq.length} nt</span>
    </div>`).join('');
}
function bindTails() {
  qs('#tailRows').addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.tailName !== undefined) {
      ui.params.tails[Number(t.dataset.tailName)].name = t.value.trim() || `Tail${Number(t.dataset.tailName) + 1}`;
      t.value = ui.params.tails[Number(t.dataset.tailName)].name;
    } else if (t.dataset.tailSeq !== undefined) {
      const i = Number(t.dataset.tailSeq);
      const clean = t.value.toUpperCase().replace(/U/g, 'T').replace(/[^ACGT]/g, '');
      ui.params.tails[i].seq = clean;
      t.value = clean;
      t.closest('.tail-row').querySelector('.len').textContent = `${clean.length} nt`;
    }
    onParamsChanged();
  });
  qs('#tailDefaultBtn').addEventListener('click', () => {
    ui.params.tails = DEFAULT_TAILS.map((t) => ({ ...t }));
    renderTailRows();
    onParamsChanged();
    toast('LGC 기본 tail 로 되돌렸습니다');
  });
  bindSegment(qs('#modeSeg'), (v) => { ui.mode = v; renderModeCards(); onParamsChanged(); });
  qs('#bandStep').addEventListener('change', (e) => { ui.sizing.bandStep = Number(e.target.value) || 20; onSizingChanged(); });
  qs('#sizingMaxLen').addEventListener('change', (e) => { ui.sizing.maxLen = clampNum(Number(e.target.value) || 45, 20, 80); e.target.value = ui.sizing.maxLen; onSizingChanged(); });
  qs('#secondMismatch').addEventListener('change', (e) => { ui.sizing.secondMismatch = e.target.checked; onSizingChanged(); });
}
function onSizingChanged() {
  saveSettings();
  if (ui.results.length && ui.mode === 'sizing') renderResults();
}
function renderModeCards() {
  const sizing = ui.mode === 'sizing';
  qs('#tailCard').hidden = sizing;
  qs('#sizingCard').hidden = !sizing;
  qs('#modeDesc').textContent = sizing
    ? '겔 판독: tail 대신 5′ filler 로 대립유전자별 산물 길이를 사다리로 만듭니다. Tm 은 filler 를 제외한 본체로 계산합니다.'
    : '형광 판독: ASP 5′ 에 FAM/HEX 보편 tail 을 붙입니다 (LGC KASP 표준). Tm 은 tail 을 제외한 본체로 계산합니다.';
}

/* ---------- 서열 입력 ---------- */
function highlightHtml(text) {
  const lines = text.split('\n');
  const out = [];
  const IUPAC_EXTRA = /[RYSWKMBDHVN]/i;
  for (const line of lines) {
    if (line.startsWith('>')) { out.push(`<span class="hl-head">${escapeHtml(line)}</span>`); continue; }
    let html = '';
    let i = 0;
    let excl = false;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '[') {
        const close = line.indexOf(']', i + 1);
        const end = close < 0 ? line.length : close + 1;
        html += `<span class="hl-var">${escapeHtml(line.slice(i, end))}</span>`;
        i = end;
        continue;
      }
      if (ch === '/') {
        excl = !excl;
        html += `<span class="hl-excl">/</span>`;
        i++;
        continue;
      }
      const cls = [];
      if (excl) cls.push('hl-excl');
      if (IUPAC_EXTRA.test(ch)) cls.push('hl-iupac');
      html += cls.length ? `<span class="${cls.join(' ')}">${escapeHtml(ch)}</span>` : escapeHtml(ch);
      i++;
    }
    out.push(html);
  }
  return out.join('\n') + (text.endsWith('\n') ? ' ' : '');
}
function renderBackdrop() {
  const ta = qs('#seqInput');
  const bd = qs('#seqBackdrop');
  bd.innerHTML = highlightHtml(ta.value);
  bd.scrollTop = ta.scrollTop;
}
function parseNow() {
  const text = qs('#seqInput').value;
  if (!text.trim()) { ui.records = []; ui.parseErrors = []; return; }
  const { records, errors } = parseInput(text);
  ui.records = records;
  ui.parseErrors = errors;
}
function renderInputSummary() {
  const el = qs('#seqSummary');
  const errBox = qs('#seqErrors');
  const text = qs('#seqInput').value;
  if (!text.trim()) {
    el.textContent = '서열을 붙여넣으면 시작됩니다';
    errBox.hidden = true;
    return;
  }
  const s = summarizeRecords(ui.records);
  const ok = ui.records.filter((r) => !r.error);
  let gcTxt = '';
  if (ok.length) {
    const all = ok.map((r) => r.s1 + r.alleles[0].seq + r.s3).join('');
    gcTxt = ` · GC ${gcPercent(all).toFixed(1)}%`;
  }
  const alleleTxt = ok.map((r) => `${r.name} [${r.alleles.map((a) => a.label).join('/')}]`).join(', ');
  el.textContent = `${s.ok}개 서열 · ${s.nt.toLocaleString()} nt${gcTxt}${alleleTxt ? ' · ' + alleleTxt : ''}`;
  const warnings = ok.flatMap((r) => (r.warnings || []).map((w) => `${r.name}: ${w}`));
  const items = [...ui.parseErrors, ...warnings];
  errBox.hidden = !items.length;
  errBox.innerHTML = items.map((e) => `<li>${escapeHtml(e)}</li>`).join('');
  refreshAnalyzeRecordOptions();
}
function refreshAnalyzeRecordOptions() {
  const sel = qs('#analyzeRecord');
  if (!sel) return;
  const prev = sel.value;
  const ok = ui.records.filter((r) => !r.error);
  sel.innerHTML = '<option value="">템플릿 없이 분석</option>' + ok.map((r) => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)} [${escapeHtml(r.alleles.map((a) => a.label).join('/'))}]</option>`).join('');
  if (ok.some((r) => r.name === prev)) sel.value = prev;
  else if (ok.length) sel.value = ok[0].name;
}
function renderActionSummary() {
  const el = qs('#actionSummary');
  const ok = ui.records.filter((r) => !r.error).length;
  if (!qs('#seqInput').value.trim()) { el.textContent = '서열을 붙여넣으면 시작됩니다'; return; }
  const mode = ui.mode === 'sizing' ? 'Allele sizing' : 'KASP';
  const hom = homoeologsFromInput().length;
  el.textContent = `${ok}개 서열 준비됨 · ${cropOf(ui.crop).label}${hom ? ` (상동 ${hom})` : ''} · ${presetLabel()} · ${mode}${ui.stale ? ' · 조건이 바뀌었습니다, 다시 설계하세요' : ''}`;
}
const onInputChanged = debounce(() => {
  parseNow();
  renderInputSummary();
  renderActionSummary();
  try { localStorage.setItem(STORE_INPUT, qs('#seqInput').value); } catch { /* 무시 */ }
}, 150);
function setInputText(text) {
  const ta = qs('#seqInput');
  ta.value = text;
  renderBackdrop();
  parseNow();
  renderInputSummary();
  renderActionSummary();
  try { localStorage.setItem(STORE_INPUT, text); } catch { /* 무시 */ }
}
function bindInput() {
  const ta = qs('#seqInput');
  ta.addEventListener('input', () => { renderBackdrop(); onInputChanged(); });
  ta.addEventListener('scroll', () => { qs('#seqBackdrop').scrollTop = ta.scrollTop; });
  ta.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runDesign(); } });
  qs('#clearBtn').addEventListener('click', () => { setInputText(''); ta.focus(); });

  const menu = qs('#exampleList');
  const keys = Object.keys(EXAMPLES);
  menu.innerHTML = keys.map((k) => `<button type="button" data-example="${escapeHtml(k)}">${escapeHtml(k)}<small>${escapeHtml(EXAMPLES[k].desc || '')}</small></button>`).join('')
    + (keys.length > 1 ? `<button type="button" data-example="*">모든 예제 (일괄 설계)<small>${keys.length}개 레코드</small></button>` : '');
  qs('#exampleBtn').addEventListener('click', (e) => { e.stopPropagation(); const wasHidden = menu.hidden; closeMenus(); menu.hidden = !wasHidden; });
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-example]');
    if (!b) return;
    const k = b.dataset.example;
    const fasta = k === '*' ? keys.map((x) => EXAMPLES[x].fasta).join('\n\n') : EXAMPLES[k].fasta;
    const cur = ta.value.trim();
    setInputText(cur ? `${cur}\n\n${fasta}` : fasta);
    menu.hidden = true;
    toast('예제를 불러왔습니다');
  });
  qs('#rsidBtn').addEventListener('click', lookupRsid);
  qs('#rsidInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); lookupRsid(); } });
}
async function lookupRsid() {
  const id = qs('#rsidInput').value.trim();
  const status = qs('#rsidStatus');
  if (!id) { status.textContent = '변이 ID 를 입력하세요.'; return; }
  const btn = qs('#rsidBtn');
  btn.disabled = true;
  status.textContent = `${id} 조회 중…`;
  try {
    const { fasta, note } = await fetchVariantFasta(id, qs('#rsidSpecies').value, Number(qs('#rsidFlank').value));
    const cur = qs('#seqInput').value.trim();
    setInputText(cur ? `${cur}\n\n${fasta}` : fasta);
    status.textContent = note;
    toast('서열을 추가했습니다');
  } catch (e) {
    status.textContent = `조회하지 못했습니다 (${e && e.name === 'AbortError' ? '시간 초과' : (e && e.message) || '오류'}). 오프라인이거나 ID·종 이름이 맞지 않을 수 있습니다.`;
  } finally {
    btn.disabled = false;
  }
}

/* ---------- 기존 프라이머 분석 ---------- */
function bindAnalyze() {
  qs('#analyzeBtn').addEventListener('click', runAnalyze);
  qs('#primerInput').addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runAnalyze(); } });
  qs('#analyzeClearBtn').addEventListener('click', () => { qs('#primerInput').value = ''; ui.analysis = null; qs('#analyzeOut').hidden = true; });
  qs('#analyzeExampleBtn').addEventListener('click', () => {
    qs('#primerInput').value = EXAMPLE_PRIMERS;
    if (!qs('#seqInput').value.trim() && EXAMPLES.snp_simple) setInputText(EXAMPLES.snp_simple.fasta);
    refreshAnalyzeRecordOptions();
    const sel = qs('#analyzeRecord');
    if (Array.from(sel.options).some((o) => o.value === 'Marker_SNP1')) sel.value = 'Marker_SNP1';
    runAnalyze();
  });
}
function runAnalyze() {
  const primers = parsePrimerList(qs('#primerInput').value);
  if (!primers.length) { toast('분석할 프라이머 서열이 없습니다'); return; }
  parseNow();
  const name = qs('#analyzeRecord').value;
  const record = ui.records.find((r) => r.name === name && !r.error) || null;
  try {
    ui.analysis = analyzePrimers(primers, { record, params: ui.params });
    ui.analysis.recordName = record ? record.name : '';
    renderAnalysis();
    toast(`${primers.length}개 프라이머를 분석했습니다`);
  } catch (e) {
    console.error(e);
    toast(`분석 중 오류: ${e.message}`);
  }
}
function analysisSeqHtml(it) {
  const tail = it.tail ? `<span class="tail" title="${escapeHtml(it.tail.name)}">${escapeHtml(it.tail.seq.toLowerCase())}</span>` : '';
  const mm = new Set(it.loc ? it.loc.mismatchPositions : []);
  let body = '';
  for (let i = 0; i < it.body.length; i++) {
    const ch = it.body[i].toLowerCase();
    const last = i === it.body.length - 1 && it.loc && it.loc.threeEndAtVariant;
    if (mm.has(i)) body += `<span class="mm" title="템플릿과 불일치">${ch}</span>`;
    else if (last) body += `<span class="var">${ch.toUpperCase()}</span>`;
    else body += ch;
  }
  return `<span class="seq">${tail}${body}</span>`;
}
function formatParamValue(key, v) {
  if (key === 'preset') return v === 'custom' ? '사용자 정의' : (TM_PRESETS[v] || TM_PRESETS.bioneer).label;
  if (key === 'useTails') return v ? '켬' : '끔';
  if (key === 'tails') return (v || []).map((t) => `${t.name} ${t.seq.length} nt`).join(', ');
  return String(v);
}
function renderAnalysis() {
  const a = ui.analysis;
  const out = qs('#analyzeOut');
  if (!a) { out.hidden = true; return; }
  out.hidden = false;
  const p = ui.params;
  const rows = a.items.map((it) => {
    const pos = it.loc ? `${it.loc.strand === '+' ? '+' : '−'} ${it.loc.start}–${it.loc.end}${it.loc.alleleLabel && it.role === 'ASP' ? ` (${escapeHtml(it.loc.alleleLabel)})` : ''}${it.loc.mismatches ? ` · 불일치 ${it.loc.mismatches}` : ''}` : '—';
    const amp = (it.amplicons || []).map((m) => `${m.size}`).join(' / ') || (it.role === 'Common' ? '' : '—');
    return `<tr>
      <td class="id">${escapeHtml(it.name)}</td>
      <td data-label="역할">${escapeHtml(it.role)}</td>
      <td class="muted" data-label="Tail">${it.tail ? escapeHtml(it.tail.name) : '—'}</td>
      <td class="seq-cell">${analysisSeqHtml(it)}</td>
      <td class="num" data-label="길이">${it.length}${it.tail ? ` <span class="muted small">(+${it.tail.seq.length})</span>` : ''}</td>
      <td class="num" data-label="Tm ${escapeHtml(a.mainLabel)}"><span class="badge ${tmClass(it.tm, p)}">${fmt1(it.tm)}</span></td>
      <td class="num muted" data-label="Tm ${escapeHtml(a.altLabel)}">${fmt1(it.tmAlt)}</td>
      <td class="num" data-label="GC%">${fmt1(it.gc)}</td>
      <td class="num" data-label="LC%">${it.lc}</td>
      <td class="muted small" data-label="위치">${pos}</td>
      <td class="num" data-label="Amplicon">${amp}</td>
    </tr>`;
  }).join('');
  qs('#analyzeTable').innerHTML = `
    <div class="card-head">
      <div class="set-title"><h2>분석 결과</h2><span class="sub">${a.recordName ? `템플릿 ${escapeHtml(a.recordName)} · ` : '템플릿 없음 · '}ASP ${a.summary.counts.asp} · Common ${a.summary.counts.common}${a.summary.counts.unknown ? ` · 미확인 ${a.summary.counts.unknown}` : ''}</span></div>
      <div class="card-actions"><button type="button" class="btn small" id="analyzeCopyBtn">${ICONS.copy}복사</button></div>
    </div>
    <div class="table-wrap"><table class="grid stackable">
      <thead><tr><th>이름</th><th>역할</th><th>Tail</th><th>본체 (5′→3′)</th><th class="num">길이</th><th class="num">Tm ${escapeHtml(a.mainLabel)}</th><th class="num">Tm ${escapeHtml(a.altLabel)}</th><th class="num">GC (%)</th><th class="num">LC (%)</th><th>위치</th><th class="num">Amplicon (bp)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p class="hint">Tm 은 tail 을 뗀 본체 기준. 위치는 정방향 1-based, + 는 정방향 가닥, − 는 역상보 가닥. <span class="seq"><span class="var">A</span></span> = 3′ 말단이 변이 위치, <span class="seq"><span class="mm">a</span></span> = 템플릿과 불일치.</p>`;
  qs('#analyzeCopyBtn').addEventListener('click', () => copyText(analysisToTsv(a)));

  const sug = a.summary.suggested;
  const keys = Object.keys(sug);
  const cmpRows = keys.map((k) => {
    const cur = k === 'tails' ? p.tails : p[k];
    const same = k === 'tails' ? formatParamValue(k, cur) === formatParamValue(k, sug[k]) : cur === sug[k];
    return `<tr><td>${escapeHtml(PARAM_LABELS[k] || k)}</td><td class="num ${same ? 'same' : ''}">${escapeHtml(formatParamValue(k, cur))}</td><td class="num ${same ? 'same' : 'new'}">${escapeHtml(formatParamValue(k, sug[k]))}</td></tr>`;
  }).join('');
  const iconFor = (kind) => (kind === 'ok' ? ICONS.check : kind === 'warn' ? ICONS.alert : kind === 'info' ? ICONS.info : ICONS.sliders);
  const canRun = !!a.recordName;
  qs('#analyzeSummary').innerHTML = `
    <div class="card-head"><h2>추정 설계 조건과 안내</h2></div>
    <ul class="note-list">${a.summary.notes.map((n) => `<li class="${escapeHtml(n.kind)}">${iconFor(n.kind)}<span>${escapeHtml(n.text)}</span></li>`).join('')}</ul>
    ${keys.length ? `<div class="table-wrap" style="margin-top:18px"><table class="grid cmp stackable"><thead><tr><th>항목</th><th class="num">현재 조건</th><th class="num">비슷하게 설계하려면</th></tr></thead><tbody>${cmpRows}</tbody></table></div>` : '<p class="hint">바꿀 조건이 없습니다. 현재 조건이 기존 프라이머와 잘 맞습니다.</p>'}
    <div class="analyze-actions">
      <button type="button" class="btn" id="applySugBtn" ${keys.length ? '' : 'disabled'}>${ICONS.check}이 조건을 설계 조건에 적용</button>
      <button type="button" class="btn" id="applyRunBtn" ${canRun ? '' : 'disabled'} title="${canRun ? '' : '서열 입력 탭에 템플릿이 있어야 합니다'}">${ICONS.play}적용하고 바로 설계</button>
    </div>
    <p class="hint">적용하면 설계 조건·Tail 탭 값이 바뀝니다. 되돌리려면 설계 조건 탭의 "기본값 복원"을 누르세요.</p>`;
  qs('#applySugBtn').addEventListener('click', () => applySuggested(sug, false));
  qs('#applyRunBtn').addEventListener('click', () => applySuggested(sug, true));
}
function applySuggested(sug, runAfter) {
  for (const [k, v] of Object.entries(sug)) {
    if (k === 'preset') continue;
    if (k === 'tails') { ui.params.tails = v.map((t) => ({ name: t.name, seq: t.seq })); continue; }
    ui.params[k] = v;
  }
  if (sug.preset) setPreset(sug.preset);
  if (sug.useTails && ui.mode === 'sizing') { ui.mode = 'kasp'; setSegment(qs('#modeSeg'), 'kasp'); renderModeCards(); }
  syncParamsForm();
  onParamsChanged();
  if (runAfter) { toast('조건을 적용하고 설계합니다'); runDesign(); }
  else { toast('설계 조건을 적용했습니다'); showPane('params'); }
}

/* ---------- 설계 ---------- */
function effectiveParams() {
  const p = mergeParams(ui.params);
  const swap = (a, b) => { if (p[a] > p[b]) { const t = p[a]; p[a] = p[b]; p[b] = t; } };
  swap('tmMin', 'tmMax'); swap('aspMinLen', 'aspMaxLen'); swap('commonMinLen', 'commonMaxLen'); swap('gcMin', 'gcMax'); swap('ampliconMin', 'ampliconMax');
  if (p.ampliconHardMax < p.ampliconMax) p.ampliconHardMax = p.ampliconMax;
  p.tails = p.tails.filter((t) => t.seq.length);
  if (ui.mode === 'sizing') { p.useTails = false; if (ui.sizing.secondMismatch) p.snpOffset = 1; }
  p.cropMode = ui.crop;
  p.homoeologs = homoeologsFromInput();
  return p;
}
function runDesign() {
  return new Promise((resolve) => {
    parseNow();
    renderInputSummary();
    const valid = ui.records.filter((r) => !r.error);
    if (!valid.length) {
      toast(ui.parseErrors[0] || '설계할 서열이 없습니다');
      showPane('input');
      qs('#seqInput').focus();
      resolve(false);
      return;
    }
    const btn = qs('#designBtn');
    btn.disabled = true;
    progress(true);
    setTimeout(() => {
      try {
        ui.results = designAll(ui.records, effectiveParams());
        ui.marker = Math.max(0, ui.results.findIndex((r) => !r.error));
        ui.dir = 'forward';
        ui.commonPick = {};
        ui.stale = false;
        renderResults();
        showPane('results');
        const badge = qs('#navResultBadge');
        badge.textContent = String(valid.length);
        badge.hidden = false;
        toast(`${valid.length}개 마커 설계 완료`);
      } catch (e) {
        console.error(e);
        toast(`설계 중 오류: ${e.message}`);
      } finally {
        progress(false);
        btn.disabled = false;
        renderActionSummary();
        resolve(true);
      }
    }, 30);
  });
}

/* ---------- 튜토리얼 · 서면 매뉴얼 · 환영 ---------- */
function closeMenus() {
  qsa('.menu-list').forEach((m) => { m.hidden = true; });
}
function openModal(id) { qs(id).classList.add('on'); }
function closeModal(id) { qs(id).classList.remove('on'); }
function markWelcomeSeen() {
  try { localStorage.setItem(STORE_WELCOME, '1'); } catch { /* 무시 */ }
}
function startTour(at = 0) {
  closeMenus();
  closeModal('#manualModal');
  markWelcomeSeen();
  ui.tour.start(at);
}
function openManual() {
  closeMenus();
  markWelcomeSeen();
  qs('#manualBody').innerHTML = renderManualHtml(ui.tour.steps);
  openModal('#manualModal');
}
function buildTour() {
  const ctx = {
    ensureExample: () => {
      if (!qs('#seqInput').value.trim() && EXAMPLES.snp_simple) setInputText(EXAMPLES.snp_simple.fasta);
    },
    ensureAnalysis: () => {
      ctx.ensureExample();
      if (ui.analysis) return;
      if (!qs('#primerInput').value.trim()) qs('#primerInput').value = EXAMPLE_PRIMERS;
      refreshAnalyzeRecordOptions();
      const sel = qs('#analyzeRecord');
      if (Array.from(sel.options).some((o) => o.value === 'Marker_SNP1')) sel.value = 'Marker_SNP1';
      runAnalyze();
    },
    ensureDesigned: async () => {
      ctx.ensureExample();
      if (!ui.results.length) await runDesign();
    },
    openDetails: (sel) => { const d = qs(sel); if (d && 'open' in d) d.open = true; },
  };
  ui.tour = createTour({
    steps: buildTourSteps(ctx),
    onPane: showPane,
    onDone: ({ skipped }) => { if (!skipped) toast('튜토리얼을 마쳤습니다'); },
  });
}
function bindHelp() {
  buildTour();
  qs('#helpBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const list = qs('#helpList');
    const wasHidden = list.hidden;
    closeMenus();
    list.hidden = !wasHidden;
  });
  qs('#helpList').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-help]');
    if (!b) return;
    if (b.dataset.help === 'tour') startTour(0);
    else if (b.dataset.help === 'manual') openManual();
  });
  document.addEventListener('click', closeMenus);
  qs('#guideTourBtn').addEventListener('click', () => startTour(0));
  qs('#manualCloseBtn').addEventListener('click', () => closeModal('#manualModal'));
  qs('#manualPlayBtn').addEventListener('click', () => startTour(0));
  qs('#manualBody').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-play]');
    if (!b) return;
    startTour(Number(b.dataset.play));
  });
  qs('#manualModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal('#manualModal'); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || (ui.tour && ui.tour.isActive())) return;
    if (qs('#manualModal').classList.contains('on')) closeModal('#manualModal');
  });
}
/**
 * 첫 실행 때 한 번만 튜토리얼을 자동 재생한다. 시작과 동시에 "본 것"으로 기록하므로
 * 건너뛰든 끝까지 보든 다시는 자동으로 뜨지 않는다 (저장소를 쓸 수 없는 환경에서는 자동 재생 안 함).
 */
function maybeAutoTour() {
  let seen = '1';
  try { seen = localStorage.getItem(STORE_WELCOME) || ''; } catch { seen = '1'; }
  if (seen) return;
  markWelcomeSeen();
  setTimeout(() => { if (!ui.tour.isActive()) startTour(0); }, 600);
}

/* ---------- 결과 ---------- */
function currentResult() { return ui.results[ui.marker] || null; }
function pickIndex(mi, dir) { return ui.commonPick[`${mi}|${dir}`] ?? 0; }
function viewOfSet(res, set, mi, dir) {
  const ci = pickIndex(mi, dir);
  const common = set.commons[ci] || null;
  const base = set.asps.filter(Boolean);
  if (ui.mode === 'sizing') {
    const s = applyAlleleSizing(set, common, { bandStep: ui.sizing.bandStep, secondMismatch: ui.sizing.secondMismatch, maxLen: ui.sizing.maxLen, dimerThreshold: res.params.dimerThreshold, cond: res.conditions });
    return { asps: s.asps, common, commons: set.commons, sizing: s, commonIndex: ci };
  }
  return { asps: base, common, commons: set.commons, sizing: null, commonIndex: ci };
}
function tmClass(tm, p) {
  if (!Number.isFinite(tm)) return 'none';
  if (tm >= p.tmMin && tm <= p.tmMax) return '';
  if (tm >= p.tmMin - 1 && tm <= p.tmMax + 1) return 'warn';
  return 'err';
}
function seqHtml(primer) {
  if (primer.kind === 'Common') return `<span class="seq">${escapeHtml(primer.seq)}</span>`;
  const tail = primer.tail ? `<span class="tail" title="${escapeHtml(primer.tail.name)}">${escapeHtml(primer.tail.seq)}</span>` : '';
  let body = '';
  const disp = primer.bodyDisplay;
  for (let i = 0; i < disp.length; i++) {
    const ch = disp[i];
    const isVar = ch === ch.toUpperCase() && /[A-Z]/.test(ch);
    const isMm = primer.mismatchPos === i;
    if (isVar) body += `<span class="var">${ch}</span>`;
    else if (isMm) body += `<span class="mm" title="의도적 미스매치">${ch}</span>`;
    else body += ch;
  }
  return `<span class="seq">${tail}${body}</span>`;
}
function ampliconHtml(c, view) {
  if (ui.mode === 'sizing' && view.sizing) {
    return view.sizing.products.map((p) => `${escapeHtml(p.label)}:${p.size}`).join(' ');
  }
  return escapeHtml(c.ampliconLabel) + (c.tailLen ? ` <span class="muted small" title="tail 을 뺀 템플릿 구간 길이">(tail 제외 ${escapeHtml(c.ampliconLabelNoTail)})</span>` : '');
}
function renderMarkerTabs() {
  const box = qs('#markerTabs');
  box.innerHTML = ui.results.map((r, i) => `<button type="button" class="pill${i === ui.marker ? ' on' : ''}${r.error ? ' err' : ''}" data-marker="${i}" title="${escapeHtml(r.error || r.header || r.name)}">${escapeHtml(r.name)}</button>`).join('');
}
function renderWarnBox(res, set, view) {
  const items = [];
  if (res.error) items.push({ cls: 'err', text: res.error });
  for (const w of res.warnings || []) items.push({ cls: '', text: w });
  if (set) {
    for (const w of set.warnings) items.push({ cls: w.includes('없습니다') ? 'err' : '', text: w });
    for (const a of view.asps) for (const w of a.warnings) items.push({ cls: '', text: `ASP ${a.alleleLabel}: ${w}` });
    if (view.common) for (const w of view.common.warnings) items.push({ cls: view.common.ampState === 'err' ? 'err' : '', text: `Common ${view.common.id}: ${w}` });
    if (view.sizing) for (const w of view.sizing.warnings) items.push({ cls: '', text: `Allele sizing: ${w}` });
  }
  const box = qs('#warnBox');
  box.hidden = !items.length;
  box.innerHTML = `<ul>${items.map((it) => `<li class="${it.cls}">${ICONS.alert}<span>${escapeHtml(it.text)}</span></li>`).join('')}</ul>`;
}
function renderSetCard(res, set, view) {
  const card = qs('#setCard');
  const p = res.params;
  const dirLabel = ui.dir === 'forward' ? 'Forward' : 'Reverse';
  if (!set) { card.innerHTML = `<div class="card-head"><h2>${escapeHtml(res.name)}</h2></div><p class="muted">${escapeHtml(res.error || '결과 없음')}</p>`; return; }
  const cropTxt = cropOf(p.cropMode).key === 'generic' ? '' : `${cropOf(p.cropMode).label} · `;
  const condTxt = `${cropTxt}${presetLabelFor(p)} · Tm ${p.tmMin}–${p.tmMax} °C${p.homoeologs && p.homoeologs.length ? ` · 상동 ${p.homoeologs.length}` : ''}`;
  const rows = [];
  for (const a of view.asps) {
    rows.push(`<tr>
      <td class="id">${escapeHtml(a.id)}${specBadge(a)}</td>
      <td class="seq-cell">${seqHtml(a)}</td>
      <td class="num" data-label="길이">${a.fullLength}${a.tail ? ` <span class="muted small">(${a.length}+${a.tail.seq.length})</span>` : ''}</td>
      <td class="num" data-label="Tm"><span class="badge ${tmClass(a.tm, p)}">${fmt1(a.tm)}</span></td>
      <td class="num" data-label="GC%">${fmt1(a.gc)}</td>
      <td class="num" data-label="LC%">${a.lc}</td>
      <td class="num muted" data-label="Tail">${a.tail ? escapeHtml(a.tail.name) : '—'}</td>
    </tr>`);
  }
  const c = view.common;
  if (c) {
    rows.push(`<tr>
      <td class="id">${escapeHtml(c.id)}${specBadge(c)}</td>
      <td class="seq-cell">${seqHtml(c)}</td>
      <td class="num" data-label="길이">${c.length}</td>
      <td class="num" data-label="Tm"><span class="badge ${tmClass(c.tm, p)}">${fmt1(c.tm)}</span></td>
      <td class="num" data-label="GC%">${fmt1(c.gc)}</td>
      <td class="num" data-label="LC%">${c.lc}</td>
      <td class="num" data-label="Amplicon"><span class="badge ${c.ampState === 'ok' ? '' : c.ampState}">${ampliconHtml(c, view)}</span></td>
    </tr>`);
  } else {
    rows.push(`<tr><td colspan="7" class="muted">조건을 만족하는 Common 프라이머가 없습니다.</td></tr>`);
  }
  const tmDiffTxt = c ? `ASP–Common Tm 차 ${fmt1(c.tmDiff)} °C` : '';
  card.innerHTML = `
    <div class="card-head">
      <div class="set-title"><h2>${escapeHtml(res.name)} · ${dirLabel} 세트</h2><span class="sub">${escapeHtml(condTxt)}</span></div>
      <div class="card-actions">
        <button type="button" class="btn small" id="setCopyBtn">${ICONS.copy}복사</button>
        <button type="button" class="btn small" id="setXlsxBtn">${ICONS.excel}엑셀</button>
      </div>
    </div>
    <div class="table-wrap"><table class="grid stackable">
      <thead><tr><th>ID</th><th>Sequence (5′→3′)</th><th class="num">Length</th><th class="num">Tm (°C, tail 제외)</th><th class="num">GC (%)</th><th class="num">LC (%)</th><th class="num">${ui.mode === 'sizing' ? 'Filler / 산물 (bp)' : 'Tail / Amplicon (bp)'}</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table></div>
    <div class="set-foot">
      <span><span class="seq"><span class="tail">tail</span>·본체·<span class="var">변이</span></span> · ${c ? `Amplicon Tm ${fmt1(c.ampliconTm)} °C · ` : ''}${tmDiffTxt}</span>
      <span>${res.chrPos ? escapeHtml(`${res.chrPos.chr}:${res.chrPos.pos.toLocaleString()}`) + ' · ' : ''}${c ? escapeHtml(`Common ${genomicCoord(res, c.start, c.end) || `${c.start}-${c.end}`}`) : ''}</span>
    </div>`;
  qs('#setCopyBtn').addEventListener('click', () => copyText(toSetTsv(exportViewOf(res, ui.marker), ui.dir, view.commonIndex)));
  qs('#setXlsxBtn').addEventListener('click', () => downloadXlsx('current', ui.dir));
}
function presetLabelFor(p) {
  return p.preset === 'custom' ? '사용자 정의' : (TM_PRESETS[p.preset] || TM_PRESETS.bioneer).label;
}
function renderCommonCard(res, set, view) {
  const card = qs('#commonCard');
  if (!set) { card.innerHTML = ''; return; }
  const p = res.params;
  const snpPos = res.record.s1.length + 1;
  const ordered = ui.commonSort === 'pos'
    ? set.commons.slice().sort((a, b) => Math.min(Math.abs(a.start - snpPos), Math.abs(a.end - snpPos)) - Math.min(Math.abs(b.start - snpPos), Math.abs(b.end - snpPos)) || a.start - b.start)
    : set.commons;
  const list = ordered.slice(0, p.maxCommon);
  const rows = list.map((c) => { const i = set.commons.indexOf(c); return `<tr class="clickable${i === view.commonIndex ? ' pick' : ''}" data-common="${i}">
      <td class="num muted rank">${c.rank}</td>
      <td class="id">${escapeHtml(c.id)}${specBadge(c)}</td>
      <td class="seq-cell">${seqHtml(c)}</td>
      <td class="num" data-label="길이">${c.length}</td>
      <td class="num" data-label="Tm"><span class="badge ${tmClass(c.tm, p)}">${fmt1(c.tm)}</span></td>
      <td class="num" data-label="GC%">${fmt1(c.gc)}</td>
      <td class="num" data-label="LC%">${c.lc}</td>
      <td class="num" data-label="Amplicon"><span class="badge ${c.ampState === 'ok' ? '' : c.ampState}">${escapeHtml(c.ampliconLabel)}</span></td>
      <td class="num" data-label="ΔTm"><span class="badge ${c.tmDiff > p.tmDiffMax ? 'warn' : ''}">${fmt1(c.tmDiff)}</span></td>
      <td class="muted small note" title="${escapeHtml(c.warnings.join('; '))}">${escapeHtml(c.warnings.join('; '))}</td>
    </tr>`; }).join('');
  card.innerHTML = `
    <div class="card-head"><h2>Common 후보 <span class="muted small">${set.commons.length}개 중 ${list.length}개 · 행을 누르면 세트에 반영</span></h2>
      <div class="segment" role="group" aria-label="정렬"><button type="button" data-sort="score" class="${ui.commonSort === 'score' ? 'on' : ''}">점수순</button><button type="button" data-sort="pos" class="${ui.commonSort === 'pos' ? 'on' : ''}">위치순 (변이에 가까운 순)</button></div></div>
    <div class="table-wrap"><table class="grid stackable">
      <thead><tr><th class="num">#</th><th>ID</th><th>Sequence (5′→3′)</th><th class="num">Length</th><th class="num">Tm</th><th class="num">GC (%)</th><th class="num">LC (%)</th><th class="num">Amplicon (bp)</th><th class="num">ΔTm</th><th>비고</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="10" class="muted">후보 없음</td></tr>'}</tbody>
    </table></div>`;
}
function renderReport(res, set) {
  const box = qs('#report');
  if (!set) { box.innerHTML = ''; return; }
  const p = res.params;
  const rows = [];
  for (const a of set.asps) if (a) rows.push([a.id, seqHtml(a), a.fullLength, fmt1(a.tm), fmt1(a.gc), a.lc, a.warnings.join('; ')]);
  for (const c of set.commons.slice(0, p.maxReport)) rows.push([c.id, seqHtml(c), c.length, fmt1(c.tm), fmt1(c.gc), c.lc, `${c.ampliconLabel} / ${fmt1(c.ampliconTm)}${c.warnings.length ? ' ; ' + c.warnings.join('; ') : ''}`]);
  box.innerHTML = `<div class="table-wrap"><table class="grid stackable">
    <thead><tr><th>ID</th><th>Sequence (5′→3′)</th><th class="num">Length</th><th class="num">Tm (°C)</th><th class="num">GC (%)</th><th class="num">LC (%)</th><th>비고</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td class="id">${escapeHtml(r[0])}</td><td class="seq-cell">${r[1]}</td><td class="num" data-label="길이">${r[2]}</td><td class="num" data-label="Tm">${r[3]}</td><td class="num" data-label="GC%">${r[4]}</td><td class="num" data-label="LC%">${r[5]}</td><td class="muted small note" title="${escapeHtml(r[6])}">${escapeHtml(r[6])}</td></tr>`).join('')}</tbody>
  </table></div>
  <p class="hint">스캔 ${set.stats.scanned} 위치 · 탈락: Tm ${set.stats.rejected.tm}, 마스크 ${set.stats.rejected.mask}, 3′ 패턴 ${set.stats.rejected.pattern}, 반복 ${set.stats.rejected.repeat}, LC ${set.stats.rejected.lc}, 자기다이머 ${set.stats.rejected.selfDimer}, ASP 다이머 ${set.stats.rejected.crossDimer}, 겹침 ${set.stats.rejected.overlap}</p>`;
}
function renderResults(resetScroll = true) {
  const has = ui.results.length > 0;
  qs('#resultsEmpty').hidden = has;
  qs('#results').hidden = !has;
  if (!has) return;
  const res = currentResult();
  const set = res && !res.error ? res[ui.dir] : null;
  const view = set ? viewOfSet(res, set, ui.marker, ui.dir) : null;
  renderMarkerTabs();
  setSegment(qs('#dirSeg'), ui.dir);
  renderWarnBox(res, set, view);
  renderSetCard(res, set, view);
  renderCommonCard(res, set, view);
  if (set) { renderViewer(qs('#viewer'), res, view, {}); lastViewerWidth = qs('#viewer').clientWidth; } else qs('#viewer').innerHTML = '';
  renderReport(res, set);
  renderBioneerPreview();
  if (resetScroll) window.scrollTo({ top: 0 });
}
function rerenderViewer() {
  const viewer = qs('#viewer');
  const res = currentResult();
  const set = res && !res.error ? res[ui.dir] : null;
  if (!set || !viewer) return;
  renderViewer(viewer, res, viewOfSet(res, set, ui.marker, ui.dir), {});
  lastViewerWidth = viewer.clientWidth;
}
function bindResults() {
  qs('#commonCard').addEventListener('click', (e) => {
    const sortBtn = e.target.closest('button[data-sort]');
    if (sortBtn) { ui.commonSort = sortBtn.dataset.sort; renderResults(false); return; }
    const tr = e.target.closest('tr[data-common]');
    if (!tr) return;
    ui.commonPick[`${ui.marker}|${ui.dir}`] = Number(tr.dataset.common);
    renderResults(false);
  });
  qs('#viewerCard').addEventListener('toggle', () => { if (qs('#viewerCard').open && ui.results.length) rerenderViewer(); });
  qs('#markerTabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-marker]');
    if (!b) return;
    ui.marker = Number(b.dataset.marker);
    renderResults();
  });
  bindSegment(qs('#dirSeg'), (v) => { ui.dir = v; renderResults(); });
}

/* ---------- 내보내기 ---------- */
/** 결과를 내보내기용으로 변환: 선택한 Common, sizing filler 반영 */
function exportViewOf(res, mi) {
  if (res.error) return res;
  const out = { ...res };
  for (const dir of ['forward', 'reverse']) {
    const set = res[dir];
    if (!set) continue;
    const view = viewOfSet(res, set, mi, dir);
    out[dir] = { ...set, asps: view.asps };
  }
  return out;
}
function exportTargets(scopeOverride, dirOverride) {
  const scope = scopeOverride || ui.exportScope;
  const dirSel = dirOverride || ui.exportDir;
  const indices = scope === 'current' ? [ui.marker] : ui.results.map((_, i) => i);
  const results = [];
  const selections = {};
  for (const i of indices) {
    const r = ui.results[i];
    if (!r || r.error) continue;
    results.push(exportViewOf(r, i));
    selections[r.name] = { which: dirSel === 'selected' ? ui.dir : dirSel, commonIndex: { forward: pickIndex(i, 'forward'), reverse: pickIndex(i, 'reverse') } };
  }
  return { results, selections, which: dirSel === 'selected' ? ui.dir : dirSel, scope };
}
function stamp() { return new Date().toISOString().slice(0, 10).replace(/-/g, ''); }
function safeName(s) { return String(s).replace(/[^\w가-힣.-]+/g, '_').slice(0, 40); }
function downloadXlsx(scopeOverride, dirOverride) {
  const { results, selections, scope } = exportTargets(scopeOverride, dirOverride);
  if (!results.length) { toast('내보낼 결과가 없습니다'); return; }
  const scale = qs('#exportScale').value.trim() || '25 nmol';
  const { order, basis } = buildWorkbookData(results, { selections, scale });
  const bytes = buildXlsx([
    { name: '주문용', rows: order, monoCols: [1], colWidths: [34, 56, 11, 9, 20, 10] },
    { name: '설계근거', rows: basis, colWidths: [18, 26, 24, 14, 44, 16, 9, 9, 22, 12, 24, 60] },
  ], { fontName: EXCEL_STYLE.fontName, headerFill: EXCEL_STYLE.headerFill, headerFont: EXCEL_STYLE.headerFont });
  const name = scope === 'current' ? safeName(results[0].name) : 'all';
  downloadBytes(bytes, `KASP_${name}_${stamp()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  toast('엑셀 파일을 저장했습니다');
}
function bioneerOptions() {
  return {
    scale: qs('#bnScale').value, purification: qs('#bnPur').value,
    aspScale: qs('#bnAspScale').value, aspPurification: qs('#bnAspPur').value,
    includeCommon: qs('#bnIncludeCommon').checked,
  };
}
function renderBioneerPreview() {
  const box = qs('#bnPreview');
  if (!ui.results.length) { box.innerHTML = '<p class="muted small">설계 결과가 있으면 여기에 주문 행이 미리 표시됩니다.</p>'; return; }
  const { results, selections } = exportTargets();
  const items = bioneerOrderItems(results, { selections, ...bioneerOptions() });
  box.innerHTML = `<table class="grid stackable"><thead><tr><th>Oligo NAME</th><th>Scale</th><th>Purification</th><th>SEQUENCE (5′→3′)</th></tr></thead><tbody>${items.map((it) => `<tr><td class="id">${escapeHtml(it.name)}</td><td data-label="Scale">${escapeHtml(it.scale)}${it.adjusted ? ` <span class="badge warn" title="${escapeHtml(it.note)}">자동 조정</span>` : ''}</td><td data-label="Purif">${escapeHtml(it.purification)}</td><td class="seq-cell"><span class="seq">${escapeHtml(it.seq)}</span> <span class="muted small">${it.seq.length} nt · ${escapeHtml(it.purpose)}</span></td></tr>`).join('') || '<tr><td colspan="4" class="muted">행 없음</td></tr>'}</tbody></table>${items.some((it) => it.adjusted) ? '<p class="hint">바이오니어 표준 올리고는 scale 별 길이 제한이 있습니다(25 nmole 15–34 mer · 50 nmole 10–75 · 200 nmole 5–110 · 1000 nmole 5–130). tail 을 붙인 ASP(40 nt 이상)는 25 nmole 로 주문할 수 없어 허용되는 가장 작은 scale 로 자동 조정했습니다.</p>' : ''}`;
}
function downloadBioneerXlsx() {
  const { results, selections, scope } = exportTargets();
  if (!results.length) { toast('내보낼 결과가 없습니다'); return; }
  const { rows, items } = buildBioneerOrderRows(results, { selections, ...bioneerOptions() });
  if (!items.length) { toast('주문할 프라이머가 없습니다'); return; }
  const bytes = buildXlsx([{
    name: BIONEER_SHEET_NAME, rows, plainHeader: true, noFilter: true, noFreeze: true,
    colWidths: [34, 14, 14, 60, 4, 70],
    validations: [
      { sqref: `B2:B${Math.max(200, rows.length)}`, list: [...BIONEER_SCALES] },
      { sqref: `C2:C${Math.max(200, rows.length)}`, list: [...BIONEER_PURIFICATIONS] },
    ],
  }], { fontName: '맑은 고딕', monoFont: 'Consolas' });
  const name = scope === 'current' ? safeName(results[0].name) : 'all';
  downloadBytes(bytes, `Upload_Bioneer_DNA_${name}_${stamp()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  toast(`바이오니어 양식을 저장했습니다 (${items.length}행)`);
}
function bindBioneer() {
  const fill = (sel, list, def) => { sel.innerHTML = list.map((v) => `<option value="${escapeHtml(v)}"${v === def ? ' selected' : ''}>${escapeHtml(v)}</option>`).join(''); };
  fill(qs('#bnScale'), BIONEER_SCALES, '25 nmole');
  fill(qs('#bnAspScale'), BIONEER_SCALES, '25 nmole');
  fill(qs('#bnPur'), BIONEER_PURIFICATIONS, 'BioRP');
  fill(qs('#bnAspPur'), BIONEER_PURIFICATIONS, 'BioRP');
  ['#bnScale', '#bnAspScale', '#bnPur', '#bnAspPur', '#bnIncludeCommon'].forEach((s) => qs(s).addEventListener('change', renderBioneerPreview));
  qs('#bnXlsxBtn').addEventListener('click', downloadBioneerXlsx);
  qs('#bnTsvBtn').addEventListener('click', () => {
    const { results, selections } = exportTargets();
    if (!results.length) { toast('내보낼 결과가 없습니다'); return; }
    copyText(toBioneerPasteTsv(results, { selections, ...bioneerOptions() }), '붙여넣기용 TSV 를 복사했습니다');
  });
  renderBioneerPreview();
}
function bindExport() {
  bindBioneer();
  bindSegment(qs('#exportScopeSeg'), (v) => { ui.exportScope = v; saveSettings(); renderBioneerPreview(); });
  bindSegment(qs('#exportDirSeg'), (v) => { ui.exportDir = v; saveSettings(); renderBioneerPreview(); });
  qs('#copySetBtn').addEventListener('click', () => {
    const { results, which, selections } = exportTargets();
    if (!results.length) { toast('내보낼 결과가 없습니다'); return; }
    const dirs = which === 'both' ? ['forward', 'reverse'] : [which];
    const chunks = [];
    for (const r of results) for (const d of dirs) chunks.push(toSetTsv(r, d, selections[r.name].commonIndex[d]));
    copyText(chunks.join('\n\n'));
  });
  qs('#copySetsTextBtn').addEventListener('click', () => {
    const { results, which } = exportTargets();
    if (!results.length) { toast('내보낼 결과가 없습니다'); return; }
    const dirs = which === 'both' ? ['forward', 'reverse'] : [which];
    const chunks = [];
    for (const r of results) for (const d of dirs) chunks.push(toSetsText(r, d, 3));
    copyText(chunks.join('\n\n'));
  });
  qs('#copyReportBtn').addEventListener('click', () => {
    const { results, which } = exportTargets();
    if (!results.length) { toast('내보낼 결과가 없습니다'); return; }
    const dirs = which === 'both' ? ['forward', 'reverse'] : [which];
    copyText(dirs.map((d) => toReportTsv(results, d)).join('\n\n'));
  });
  qs('#xlsxBtn').addEventListener('click', () => downloadXlsx());
}

/* ---------- 반응형 레이아웃 ---------- */
let lastStack = null;
let lastViewerWidth = 0;
function updateLayoutMode() {
  const content = qs('.content');
  const width = content ? content.clientWidth : window.innerWidth;
  const stack = width < 820;
  if (stack !== lastStack) {
    document.documentElement.classList.toggle('stack', stack);
    lastStack = stack;
  }
  // 서열 뷰어는 폭에 맞춰 줄 길이를 다시 계산
  const viewer = qs('#viewer');
  if (ui.results.length && viewer && viewer.firstChild && !qs('#results').hidden && qs('#viewerCard').open) {
    const w = viewer.clientWidth;
    if (Math.abs(w - lastViewerWidth) > 24) rerenderViewer();
  }
}
const onResize = debounce(updateLayoutMode, 120);

/* ---------- 시작 ---------- */
function injectIcons() {
  qsa('[data-icon]').forEach((el) => { el.innerHTML = ICONS[el.dataset.icon] || ''; });
  qs('#helpBtn').innerHTML = ICONS.help;
}
function init() {
  injectIcons();
  applyThemeIcon();
  qs('#themeBtn').addEventListener('click', toggleTheme);
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyThemeIcon);
  qsa('.nav-item').forEach((b) => b.addEventListener('click', () => showPane(b.dataset.pane)));
  qs('#sidebarFoot').textContent = `v${BUILD.version}${BUILD.date ? ' · ' + BUILD.date : ''} · 오프라인 동작`;

  loadSettings();
  bindParamInputs();
  bindSegment(qs('#presetSeg'), setPreset);
  bindSegment(qs('#presetSeg2'), setPreset);
  bindTails();
  bindInput();
  bindCrop();
  bindAnalyze();
  bindResults();
  bindExport();
  bindHelp();
  qs('#designBtn').addEventListener('click', () => { runDesign(); });
  syncParamsForm();

  let saved = '';
  try { saved = localStorage.getItem(STORE_INPUT) || ''; } catch { saved = ''; }
  setInputText(saved);
  updateLayoutMode();
  window.addEventListener('resize', onResize);
  if (window.matchMedia) window.matchMedia('(orientation: portrait)').addEventListener('change', onResize);
  maybeAutoTour();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}
