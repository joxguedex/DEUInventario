// ── Utilidades puras + catálogo de categorías (tema AcopioUCV) ──

export function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Normaliza texto: minúsculas, sin tildes, sin puntuación
export function normSearch(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function nowISO() { return new Date().toISOString(); }

export function timeAgo(ts) {
  const t = typeof ts === 'number' ? ts : new Date(ts).getTime();
  const d = Date.now() - t;
  if (d < 60_000)     return 'hace un momento';
  if (d < 3_600_000)  return `hace ${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `hace ${Math.floor(d / 3_600_000)}h`;
  return `hace ${Math.floor(d / 86_400_000)}d`;
}

export function uid() {
  const r = crypto.getRandomValues(new Uint32Array(2));
  return Date.now().toString(36) + '-' + r[0].toString(36) + r[1].toString(36);
}

// Devuelve la fecha LOCAL (YYYY-MM-DD) — evita corrimiento por UTC
export function localDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Iconos SVG (subconjunto del sistema de acopio) ────────
function _svg(paths, w = 15) {
  return `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;flex-shrink:0">${paths}</svg>`;
}

const P = {
  hidratacion: `<path d="M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 007 7z"/>`,
  alim: `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3v7"/>`,
  ropa: `<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>`,
  med:  `<circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>`,
  herr: `<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>`,
  box:  `<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`,
  higie:`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
  bebes:`<circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>`,
  masco:`<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>`,
  limp: `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>`,
  papel:`<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>`,
  botella: `<path d="M9 2h6v3.5l1.5 2A4 4 0 0117 10v10a2 2 0 01-2 2H9a2 2 0 01-2-2V10a4 4 0 011.5-3.13L9 5.5V2z"/><line x1="8" y1="13" x2="16" y2="13"/>`,
  galleta: `<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14.5" r="1" fill="currentColor" stroke="none"/>`,
};

// categoría interna → [icono, etiqueta, color]
export const CATS = {
  alimentos_no_perecederos: [_svg(P.box),      'Alimentos No Perecederos', '#fb923c'],
  alimentos:                [_svg(P.alim),     'Alimentos',                '#eab308'],
  higiene_personal:         [_svg(P.higie),    'Higiene Personal',         '#a78bfa'],
  snacks:                   [_svg(P.galleta),  'Snacks',                   '#d946ef'],
  alimentos_bebe:           [_svg(P.botella),  'Alimentos Bebé',           '#22d3ee'],
  limpieza:                 [_svg(P.limp),     'Limpieza',                 '#60a5fa'],
  panales_higiene_ninos:    [_svg(P.bebes),    'Pañales e Higiene de Niños', '#f472b6'],
  hidratacion:              [_svg(P.hidratacion), 'Hidratación',           '#38bdf8'],
  veterinaria:              [_svg(P.masco),    'Veterinaria',              '#34d399'],
  herramientas:             [_svg(P.herr),     'Herramientas',             '#fbbf24'],
  ropa_descanso:            [_svg(P.ropa),     'Ropa y Descanso',          '#818cf8'],
  medicina:                 [_svg(P.med),      'Medicina',                 '#f87171'],
  papeleria:                [_svg(P.papel),    'Papelería',                '#94a3b8'],
};

const _FALLBACK = [_svg(P.box), 'Sin categoría', '#9ca3af'];
export function catIcon(c)  { return (CATS[c] || _FALLBACK)[0]; }
export function catLabel(c) { return (CATS[c] || _FALLBACK)[1]; }
export function catColor(c) { return (CATS[c] || _FALLBACK)[2]; }
