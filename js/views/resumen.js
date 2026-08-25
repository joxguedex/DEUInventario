// ── Vista de Resumen — panorama general (portado de UCVAcopio/dashboard.js) ──
// Reemplaza al Resumen viejo (progreso de conteo + subpestañas Ingresos/
// Egresos): esas dos ya tienen su propio lugar (pestaña "Ingresos" nueva,
// y "Egreso" es un filtro más en Bitácora) — acá queda un panorama general
// de solo lectura: insumos/categorías/bajo umbral/usuarios activos, más el
// desglose por categoría y los comunicados recientes (portado de
// UCVAcopio/dashboard.js#d-comms). La exportación a Excel/JSON y "Máquina
// del Tiempo" se movieron al panel de Ingreso Rápido (admin-only, ver
// ingresorapido.js), que es de donde vienen en UCVAcopio.

import { store } from '../store.js';
import { auth } from '../auth.js';
import { escHtml, catLabel, catColor, timeAgo } from '../helpers.js';
import { APP_NAME_BOLD, HERO_DESCRIPTION } from '../branding.js';

function _grupoLabel(id) {
  return store.grupos.find(g => String(g.id) === String(id))?.nombre || '?';
}

let _root = null;
let _usuariosActivos = null; // cache en memoria — countActiveUsers() es admin/coordinador-only

function _svg(paths, w = 14) {
  return `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;flex-shrink:0">${paths}</svg>`;
}
const ICO = {
  alerta: _svg(`<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`),
  clock:  _svg(`<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`),
  info:   _svg(`<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`),
  bellLg: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
};

// Vista previa de solo lectura de un comunicado (sin "Marcar resuelto" — esa
// acción vive solo en la pestaña Comunicados, ver views/comunicados.js#tlItem).
function _tlMini(c) {
  const tc = c.urgencia === 'critico' ? 'tag-red' : c.urgencia === 'urgente' ? 'tag-amber' : 'tag-blue';
  const tl = c.urgencia === 'critico' ? `${ICO.alerta} Crítico`
           : c.urgencia === 'urgente' ? `${ICO.clock} Urgente`
           : `${ICO.info} Info`;
  return `<div class="tl-item ${c.urgencia}">
    <div class="tl-dot"></div>
    <div class="tl-card">
      <div class="tl-top">
        <span class="tag ${tc}">${tl}</span>
        <span class="tl-title">${escHtml(c.titulo)}</span>
        <span class="tl-time">${timeAgo(c.fecha)}</span>
      </div>
      <div class="tl-body">${escHtml(c.cuerpo)}</div>
      <div class="tl-foot"><span class="tl-author">— ${escHtml(c.autor)}</span></div>
    </div>
  </div>`;
}

export function renderResumen(rootEl) {
  _root = rootEl;
  _paint();
  store.countActiveUsers().then(n => {
    _usuariosActivos = n;
    _paintUsuariosActivos();
  });
}

function _paint() {
  if (!_root) return;
  const s = store.stats();
  const bc = store.statsByCat();
  const criticos = store.visibleItems().filter(i => !i.deleted_at && i.umbral > 0 && i.cantidad < i.umbral).length;

  const cats = Object.keys(bc).sort((a, b) => catLabel(a).localeCompare(catLabel(b), 'es'));
  const maxUnidades = Math.max(1, ...cats.map(c => bc[c].unidades));

  // Totales por grupo — solo tiene sentido cuando la vista mezcla más de uno
  // (super_admin sin un grupo elegido en la barra superior, ver
  // store.js#statsByGrupo).
  const bg = (auth.isSuperAdmin() && store.viewingGrupoId == null) ? store.statsByGrupo() : {};
  const grps = Object.keys(bg).sort((a, b) => _grupoLabel(a).localeCompare(_grupoLabel(b), 'es'));
  const maxGrupoUnidades = Math.max(1, ...grps.map(g => bg[g].unidades));

  const comms = [...store.activeCommunications]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 3);

  _root.innerHTML = `
    <div class="stats-wrap">
      <div class="hero">
        <div class="hero-wm" aria-hidden="true">${escHtml(APP_NAME_BOLD)}</div>
        <div class="hero-left">
          <div class="hero-eyebrow">Estado de la Dirección</div>
          <div class="hero-h">
            <span class="hl-fill">Dirección</span>
            <span class="hl-outline">de Extensión</span>
          </div>
          <div class="hero-sub">${escHtml(HERO_DESCRIPTION)}</div>
          <div class="hero-pills">
            <div class="hero-pill"><span class="hero-pill-n" id="rsm-hero-vols">–</span>usuarios activos</div>
            <div class="hero-pill"><span class="hero-pill-n">${criticos.toLocaleString('es-VE')}</span>bajo umbral</div>
            <div class="hero-pill"><span class="hero-pill-n">${store.activeCommunications.length.toLocaleString('es-VE')}</span>avisos</div>
          </div>
        </div>
        <div class="hero-right">
          <div class="hr-dot"></div>
          <div class="hr-ring"></div>
          <div class="hr-ring"></div>
          <div class="hr-ring"></div>
        </div>
      </div>

      <div class="stats-cards">
        <div class="stat-card stat-card-total"><div class="stat-card-num">${s.unidades.toLocaleString('es-VE')}</div><div class="stat-card-lbl">unidades</div></div>
        <div class="stat-card"><div class="stat-card-num">${store.categories.length.toLocaleString('es-VE')}</div><div class="stat-card-lbl">categorías</div></div>
        <div class="stat-card ${criticos ? 'stat-card-crit' : 'stat-card-ok'}"><div class="stat-card-num">${criticos.toLocaleString('es-VE')}</div><div class="stat-card-lbl">bajo umbral</div></div>
        <div class="stat-card stat-card-ok"><div class="stat-card-num" id="rsm-usuarios-activos">–</div><div class="stat-card-lbl">usuarios activos</div></div>
      </div>

      <div class="stats-panel">
        <div class="stats-panel-title">
          Insumos por categoría
          <span class="stats-panel-link" data-nav="conteo">Ver todo →</span>
        </div>
        ${cats.length ? `
        <div class="stats-cat-grid">
          ${cats.map(c => {
            const d = bc[c];
            const w = Math.round(d.unidades / maxUnidades * 100);
            const col = catColor(c);
            return `<div class="stats-cat-row">
              <div class="stats-cat-top">
                <div class="stats-cat-info">
                  <div class="stats-cat-dot" style="background:${col}"></div>
                  <div class="stats-cat-name">${escHtml(catLabel(c))}</div>
                </div>
                <div class="stats-cat-num">${d.unidades.toLocaleString('es-VE')}</div>
              </div>
              <div class="stats-cat-sub">${d.total.toLocaleString('es-VE')} insumo${d.total !== 1 ? 's' : ''}</div>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${w}%;background:${col}"></div></div>
            </div>`;
          }).join('')}
        </div>` : `<div class="empty"><div class="empty-title">Sin categorías todavía</div><div class="empty-txt">Un admin puede crear la primera desde Insumos.</div></div>`}
      </div>

      ${grps.length ? `
      <div class="stats-panel">
        <div class="stats-panel-title">Unidades por grupo de extensión</div>
        <div class="stats-cat-grid">
          ${grps.map(g => {
            const d = bg[g];
            const w = Math.round(d.unidades / maxGrupoUnidades * 100);
            const col = catColor(g);
            return `<div class="stats-cat-row">
              <div class="stats-cat-top">
                <div class="stats-cat-info">
                  <div class="stats-cat-dot" style="background:${col}"></div>
                  <div class="stats-cat-name">${escHtml(_grupoLabel(g))}</div>
                </div>
                <div class="stats-cat-num">${d.unidades.toLocaleString('es-VE')}</div>
              </div>
              <div class="stats-cat-sub">${d.total.toLocaleString('es-VE')} insumo${d.total !== 1 ? 's' : ''}</div>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${w}%;background:${col}"></div></div>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      <div class="stats-panel">
        <div class="stats-panel-title">
          Comunicados recientes
          <span class="stats-panel-link" data-nav="comunicados">Ver todos →</span>
        </div>
        ${comms.length
          ? `<div class="timeline">${comms.map(_tlMini).join('')}</div>`
          : `<div class="empty"><div class="empty-ico">${ICO.bellLg}</div><div class="empty-title">Sin comunicados activos</div></div>`}
      </div>
    </div>`;

  _paintUsuariosActivos();
}

function _paintUsuariosActivos() {
  const txt = _usuariosActivos == null ? '–' : _usuariosActivos.toLocaleString('es-VE');
  const el  = _root?.querySelector('#rsm-usuarios-activos');
  const pill = _root?.querySelector('#rsm-hero-vols');
  if (el) el.textContent = txt;
  if (pill) pill.textContent = txt;
}
