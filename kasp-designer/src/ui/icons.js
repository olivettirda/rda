/**
 * icons.js — 선형 아이콘 (24×24, stroke 1.5, 직접 그린 단순 경로)
 */
function svgIcon(paths, size = 20) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

export const ICONS = Object.freeze({
  dna: svgIcon('<path d="M6 3c0 6 12 6 12 12M18 3c0 6-12 6-12 12M6 21c0-6 12-6 12-12M18 21c0-6-12-6-12-12"/><path d="M8 7h8M8 17h8"/>'),
  sliders: svgIcon('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
  tag: svgIcon('<path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9z"/><circle cx="8" cy="8" r="1.2"/>'),
  table: svgIcon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>'),
  download: svgIcon('<path d="M12 4v11M7 10l5 5 5-5M4 19h16"/>'),
  moon: svgIcon('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  sun: svgIcon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  copy: svgIcon('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', 18),
  excel: svgIcon('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 12l6 6M15 12l-6 6"/>', 18),
  alert: svgIcon('<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>', 18),
  check: svgIcon('<path d="M5 12l5 5L19 7"/>', 18),
  chevron: svgIcon('<path d="M6 9l6 6 6-6"/>', 18),
  info: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>', 18),
  search: svgIcon('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', 18),
  empty: svgIcon('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 10h8M8 14h5"/>', 40),
  trash: svgIcon('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', 18),
  play: svgIcon('<path d="M7 5v14l11-7z"/>', 18),
  help: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17v.5"/>'),
  book: svgIcon('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13M8 7h7"/>', 18),
});

export function icon(name) {
  return ICONS[name] || '';
}
