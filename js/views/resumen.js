// ── Vista de Resumen — panorama general (portado de UCVAcopio/dashboard.js) ──
// Reemplaza al Resumen viejo (progreso de conteo + subpestañas Ingresos/
// Egresos): esas dos ya tienen su propio lugar (pestaña "Ingresos" nueva,
// y "Egreso" es un filtro más en Bitácora) — acá queda un panorama general
// de solo lectura: insumos/categorías/bajo umbral/usuarios activos, más el
// desglose por categoría. La exportación a Excel/JSON y "Máquina del
// Tiempo" se movieron al panel de Ingreso Rápido (admin-only, ver
// ingresorapido.js), que es de donde vienen en UCVAcopio.

import { store } from '../store.js';
import { escHtml, catLabel, catColor } from '../helpers.js';

let _root = null;
let _usuariosActivos = null; // cache en memoria — countActiveUsers() es admin/coordinador-only

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

  _root.innerHTML = `
    <div class="stats-wrap">
      <div class="stats-cards">
        <div class="stat-card stat-card-total"><div class="stat-card-num">${s.unidades.toLocaleString('es-VE')}</div><div class="stat-card-lbl">unidades</div></div>
        <div class="stat-card"><div class="stat-card-num">${store.categories.length.toLocaleString('es-VE')}</div><div class="stat-card-lbl">categorías</div></div>
        <div class="stat-card ${criticos ? 'stat-card-crit' : 'stat-card-ok'}"><div class="stat-card-num">${criticos.toLocaleString('es-VE')}</div><div class="stat-card-lbl">bajo umbral</div></div>
        <div class="stat-card stat-card-ok"><div class="stat-card-num" id="rsm-usuarios-activos">–</div><div class="stat-card-lbl">usuarios activos</div></div>
      </div>

      <div class="stats-panel">
        <div class="stats-panel-title">Insumos por categoría <small>${s.unidades.toLocaleString('es-VE')} unidades en total</small></div>
        ${cats.length ? `
        <div class="stats-cat-grid">
          ${cats.map(c => {
            const d = bc[c];
            const w = Math.round(d.unidades / maxUnidades * 100);
            const col = catColor(c);
            return `<div class="stats-cat-row">
              <div class="stats-cat-info">
                <div class="stats-cat-dot" style="background:${col}"></div>
                <div>
                  <div class="stats-cat-name">${escHtml(catLabel(c))}</div>
                  <div class="stats-cat-sub">${d.total.toLocaleString('es-VE')} insumo${d.total !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div class="stats-cat-bar-wrap"><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${w}%;background:${col}"></div></div></div>
              <div class="stats-cat-num">${d.unidades.toLocaleString('es-VE')}</div>
            </div>`;
          }).join('')}
        </div>` : `<div class="empty"><div class="empty-title">Sin categorías todavía</div><div class="empty-txt">Un admin puede crear la primera desde Insumos.</div></div>`}
      </div>
    </div>`;

  _paintUsuariosActivos();
}

function _paintUsuariosActivos() {
  const el = _root?.querySelector('#rsm-usuarios-activos');
  if (el) el.textContent = _usuariosActivos == null ? '–' : _usuariosActivos.toLocaleString('es-VE');
}
