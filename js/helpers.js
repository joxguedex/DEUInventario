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

// ── Iconos SVG ─────────────────────────────────────────────
function _svg(paths, w = 15) {
  return `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;flex-shrink:0">${paths}</svg>`;
}

// Un solo icono genérico para toda categoría — GBSInventario es una
// plantilla reutilizable por distintas organizaciones (categorías creadas
// libremente por cada admin, ver views/admin.js), ya no tiene sentido un
// set de iconos hecho a mano por categoría fija como en el sistema viejo.
const _BOX = _svg(`<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`);

// Paleta fija, cíclica por id — cada categoría nueva se asigna un color
// distinto de forma determinística (mismo id → siempre el mismo color, sin
// necesidad de guardar el color en la BD).
const _PALETTE = ['#fb923c','#eab308','#a78bfa','#d946ef','#22d3ee','#60a5fa','#f472b6','#38bdf8','#34d399','#fbbf24','#818cf8','#f87171','#94a3b8'];

// Mapa {id → nombre} de las categorías cargadas de la BD (store.loadCategories()
// lo puebla al iniciar y tras cada cambio) — todo lo demás en este módulo se
// deriva de acá, nunca de una lista hardcodeada.
// Catálogo COMPARTIDO entre grupos (revisión "productos multigrupo",
// 2026-08-25): una categoría ya no pertenece a un único grupo (ver
// category_grupos en el esquema) — el grupo de un conteo vive ahora en el
// propio ítem local (item.grupoId, ver store.js), no se deriva más de la
// categoría.
let _categorias = new Map();
export function setCategories(list) {
  _categorias = new Map((list || []).map(c => [String(c.id), c.nombre]));
}
export function allCategories() {
  return [..._categorias.entries()].map(([id, nombre]) => ({ id, nombre }));
}

export function catIcon()      { return _BOX; }
export function catLabel(id)   { return _categorias.get(String(id)) || 'Sin categoría'; }
export function catColor(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return '#9ca3af';
  return _PALETTE[Math.abs(n) % _PALETTE.length];
}

// ── Estado de stock de un insumo (portado de UCVAcopio/js/helpers.js) ──
// umbral 0 = "no necesario" (el admin marcó que no hace falta reponerlo).
// umbral_max nulo/0 = "sin límite superior" (mismo criterio) — cuando está
// fijado y se supera, "exceso" pisa cualquier otro estado: tener demasiado
// de un insumo es información propia, independiente de si además está bajo
// o sobre su umbral mínimo.
export function iStatus(item) {
  if (item.umbral_max && item.cantidad > item.umbral_max) return 'exceso';
  if (item.umbral === 0) return 'none';
  if (!item.umbral)      return item.cantidad === 0 ? 'critico' : 'ok';
  if (item.cantidad <= item.umbral * 0.4) return 'critico';
  if (item.cantidad <= item.umbral)       return 'bajo';
  return 'ok';
}

// % de llenado de la barra de progreso de una tarjeta de insumo.
export function iPct(item) {
  return Math.min(100, (item.cantidad / Math.max(item.umbral * 2.5, item.cantidad, 1)) * 100);
}
