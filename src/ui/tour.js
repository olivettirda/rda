/**
 * tour.js — 스포트라이트 튜토리얼 엔진 (의존성 없음)
 *
 *  - 화면 전체를 어둡게 하고 대상 요소만 밝게 비춘 뒤(box-shadow 구멍), 옆에 설명 카드를 띄운다
 *  - 다음/이전/건너뛰기 버튼, → ← Enter Esc 키, 진행 막대
 *  - 단계: { pane, target(선택자), title, text, before(async), group }
 *    target 이 없거나 숨겨진 단계는 자동으로 건너뛴다. target 이 없는 단계는 화면 중앙 카드.
 */
function tEsc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function createTour(options) {
  const { steps, onPane, onDone, storageKey = 'kasp-tour-seen' } = options;
  const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let root = null, spot = null, card = null;
  let idx = -1, active = false, currentEl = null, raf = 0, token = 0;

  function build() {
    root = document.createElement('div');
    root.className = 'tour-root';
    root.innerHTML = '<div class="tour-backdrop"></div><div class="tour-spot"></div><div class="tour-card" role="dialog" aria-modal="true" aria-live="polite"></div>';
    document.body.appendChild(root);
    spot = root.querySelector('.tour-spot');
    card = root.querySelector('.tour-card');
    card.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tour]');
      if (!b) return;
      const a = b.dataset.tour;
      if (a === 'next') next();
      else if (a === 'prev') prev();
      else if (a === 'close') stop(true);
    });
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === 'Escape') { e.preventDefault(); stop(true); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  }

  function schedule() {
    if (!active) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(position);
  }

  function visible(el) {
    if (!el) return false;
    if (el.hidden || el.closest('[hidden]')) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function targetEl(step) {
    if (!step.target) return null;
    const el = document.querySelector(step.target);
    return visible(el) ? el : null;
  }

  async function show(i, dir) {
    const my = ++token;
    let step = null, el = null;
    while (i >= 0 && i < steps.length) {
      step = steps[i];
      if (step.pane && onPane) onPane(step.pane);
      if (step.before) {
        try { await step.before(); } catch (e) { console.error(e); }
        if (my !== token || !active) return;
      }
      await new Promise((r) => requestAnimationFrame(() => r()));
      el = targetEl(step);
      if (!step.target || el) break;
      i += dir;
    }
    if (my !== token || !active) return;
    if (i < 0) i = 0;
    if (i >= steps.length) { stop(false); return; }
    idx = i;
    currentEl = el;
    render(step, el);
    if (el) el.scrollIntoView({ block: isSmall() ? 'start' : 'center', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    position();
    setTimeout(position, reduced ? 0 : 350);
    setTimeout(position, 700);
  }

  function render(step, el) {
    const last = idx === steps.length - 1;
    card.innerHTML = `
      <div class="tour-head"><span class="tour-count">${idx + 1} / ${steps.length}${step.group ? ' · ' + tEsc(step.group) : ''}</span><button type="button" class="tour-x" data-tour="close" aria-label="닫기">×</button></div>
      <h3>${tEsc(step.title)}</h3>
      <p>${step.html || tEsc(step.text)}</p>
      <div class="tour-progress"><i style="width:${(((idx + 1) / steps.length) * 100).toFixed(1)}%"></i></div>
      <div class="tour-foot">
        <button type="button" class="btn small" data-tour="close">건너뛰기</button>
        <span class="tour-nav">
          <button type="button" class="btn small" data-tour="prev" ${idx === 0 ? 'disabled' : ''}>이전</button>
          <button type="button" class="btn-primary small" data-tour="next">${last ? '완료' : '다음'}</button>
        </span>
      </div>`;
    root.classList.toggle('tour-center', !el);
    const nextBtn = card.querySelector('[data-tour="next"]');
    if (nextBtn) nextBtn.focus({ preventScroll: true });
  }

  function isSmall() {
    return window.innerWidth < 640 || window.innerHeight < 520;
  }

  function position() {
    if (!active || !card) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const cw = card.offsetWidth, ch = card.offsetHeight;
    if (!currentEl) {
      spot.style.opacity = '0';
      card.style.left = `${Math.max(12, (vw - cw) / 2)}px`;
      card.style.top = `${Math.max(12, (vh - ch) / 2)}px`;
      return;
    }
    const r = currentEl.getBoundingClientRect();
    const pad = 6, gap = 14;
    spot.style.opacity = '1';
    spot.style.left = `${r.left - pad}px`;
    spot.style.top = `${r.top - pad}px`;
    spot.style.width = `${r.width + pad * 2}px`;
    spot.style.height = `${r.height + pad * 2}px`;
    let top, left = r.left + r.width / 2 - cw / 2;
    if (isSmall()) {
      // 작은 화면: 대상이 위쪽이면 카드를 아래에, 아래쪽이면 위에 고정해 겹침을 줄인다
      const center = r.top + r.height / 2;
      top = center < vh / 2 ? vh - ch - 12 : 12;
      if (center < vh / 2 && r.bottom + gap + ch <= vh - 12) top = r.bottom + gap;
      if (center >= vh / 2 && r.top - gap - ch >= 12) top = r.top - gap - ch;
    } else if (r.bottom + gap + ch <= vh - 12) top = r.bottom + gap;
    else if (r.top - gap - ch >= 12) top = r.top - gap - ch;
    else {
      top = Math.max(12, Math.min(vh - ch - 12, r.top));
      if (r.right + gap + cw <= vw - 12) left = r.right + gap;
      else if (r.left - gap - cw >= 12) left = r.left - gap - cw;
    }
    top = Math.max(12, Math.min(vh - ch - 12, top));
    left = Math.max(12, Math.min(vw - cw - 12, left));
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function start(at = 0) {
    if (!root) build();
    active = true;
    root.classList.add('on');
    document.documentElement.classList.add('tour-active');
    show(Math.max(0, Math.min(steps.length - 1, at)), 1);
  }
  function stop(skipped) {
    if (!active) return;
    active = false;
    token++;
    root.classList.remove('on', 'tour-center');
    document.documentElement.classList.remove('tour-active');
    try { localStorage.setItem(storageKey, '1'); } catch { /* 무시 */ }
    if (onDone) onDone({ skipped: !!skipped, index: idx });
  }
  function next() { if (!active) return; if (idx >= steps.length - 1) { stop(false); return; } show(idx + 1, 1); }
  function prev() { if (!active || idx <= 0) return; show(idx - 1, -1); }

  return { start, stop, next, prev, isActive: () => active, get index() { return idx; }, steps };
}

/** 서면 매뉴얼 HTML (단계를 group 별로 묶어 번호·제목·설명·재생 링크) */
export function renderManualHtml(steps) {
  let html = '';
  let group = null;
  steps.forEach((s, i) => {
    if (s.group !== group) {
      group = s.group;
      html += `<h3>${tEsc(group || '')}</h3>`;
    }
    html += `<div class="manual-step"><span class="n">${i + 1}</span><div><h4>${tEsc(s.title)}</h4><p>${s.html || tEsc(s.text)}</p></div><button type="button" class="link-btn" data-play="${i}">▶ 이 단계 재생</button></div>`;
  });
  return html;
}
