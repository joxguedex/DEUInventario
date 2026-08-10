// ── Panel de Ingreso Rápido ────────────────────────────────
// Panel persistente (izquierda en desktop, hoja inferior en
// móvil). Buscar insumo → sumar cantidad (acumulable) o crear
// uno nuevo. Independiente de la vista activa.
//
// Reemplaza al antiguo "Agregado Rápido" (quickadd.js): ya no permite
// "Restar" — sacar mercancía de verdad ahora pasa por Egreso Rápido
// (genera una comanda + movimiento real, ver egresorapido.js), no por un
// decremento de conteo suelto sin trazabilidad de negocio.

import { store } from '../store.js';
import { auth } from '../auth.js';
import { escHtml, normSearch, catIcon, catLabel, catColor, CATS } from '../helpers.js';
import { toast } from '../components/toast.js';

const CAT_ORDER = ['alimentos_no_perecederos','alimentos','higiene_personal','snacks','alimentos_bebe','limpieza','panales_higiene_ninos','hidratacion','veterinaria','herramientas','ropa_descanso','medicina','papeleria'];
const UNIDADES  = ['und','paquetes','cajas','bolsas','litros','kg','piezas'];

let _host = null;
let _onAdded = null;
let _sel = null;   // insumo seleccionado
let _new = null;   // { nombre } modo crear

export function renderIngresoRapido(hostEl, opts = {}) {
  _host = hostEl;
  _onAdded = opts.onAdded || null;
  // Si no hay nombre guardado manualmente, usar el nombre de la cuenta con sesión
  if (!store.contadorNombre && auth.name()) {
    store.setContador(auth.name());
  }
  _paint();
}

// Cierra el panel a estado buscador (usado al cerrar la hoja móvil)
export function resetIngresoRapido() { _sel = null; _new = null; _paint(); }

function _head() {
  return `
    <div class="qa-head">
      <div class="qa-head-icon">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
      </div>
      <div>
        <div class="qa-title">Ingreso Rápido</div>
        <div class="qa-sub">Cuenta insumos al instante</div>
      </div>
      <button class="qa-close-m" id="qa-close-m" aria-label="Cerrar">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4" stroke-linecap="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>`;
}

function _foot() {
  // Nombre a mostrar: el guardado manualmente, o el nombre de la cuenta con sesión
  const authName = auth.name();
  const nombre = store.contadorNombre || authName;
  const isFromAuth = !store.contadorNombre && !!authName;
  return `
    <div class="qa-foot">
      <div class="qa-foot-user">
        <span class="qa-foot-ico">
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </span>
        <span class="qa-foot-name">${escHtml(nombre || 'Sin nombre')}</span>
        ${isFromAuth ? '<span class="qa-foot-badge">cuenta</span>' : ''}
      </div>
    </div>`;
}

function _paint() {
  if (!_host) return;
  _host.innerHTML = _head() + `<div class="qa-body" id="qa-body">${_body()}</div>` + _foot();
  _wire();
}

function _body() {
  if (_sel) {
    const total = _sel.contado ? _sel.cantidad : 0;
    return `
      <div class="qa-sel-card">
        <div class="qa-sel-top">
          <span class="qa-sel-ico" style="color:${catColor(_sel.categoria)}">${catIcon(_sel.categoria)}</span>
          <div class="qa-sel-txt">
            <div class="qa-sel-name">${escHtml(_sel.nombre)}</div>
            <div class="qa-sel-cat">${catLabel(_sel.categoria)}</div>
          </div>
        </div>
        <div class="qa-total-row">
          <span class="qa-total-lbl">Total actual</span>
          <span class="qa-total-val" id="qa-total-val">${total} <span class="qa-total-unit">${escHtml(_sel.unidad)}</span></span>
        </div>
        <div class="qa-delta-wrap">
          <input class="qa-delta-inp" id="qa-delta" type="number" inputmode="numeric" min="1" placeholder="Cantidad…" autofocus>
        </div>
        <div class="qa-actions">
          <button class="qa-btn-add" id="qa-add-ok">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Sumar
          </button>
        </div>
        <button class="qa-link" id="qa-back">← buscar otro</button>
      </div>`;
  }
  if (_new) {
    return `
      <div class="qa-new">
        <input class="qa-new-name" id="qa-new-name" placeholder="Nombre del insumo…" maxlength="80" value="${escHtml(_new.nombre || '')}">
        <div class="qa-new-row">
          <select class="qa-new-sel" id="qa-new-cat" ${auth.isCoordinador() ? 'disabled' : ''}>
            ${(auth.isCoordinador() ? [auth.area()] : CAT_ORDER).map(c => `<option value="${c}">${catLabel(c)}</option>`).join('')}
          </select>
          <select class="qa-new-sel" id="qa-new-unit">
            ${UNIDADES.map(u => `<option value="${u}">${u}</option>`).join('')}
          </select>
        </div>
        <input class="qa-new-name" id="qa-new-umbral" type="number" inputmode="numeric" min="0" placeholder="Umbral de alerta (mín. deseado)" value="10">
        <input class="qa-qty" id="qa-new-qty" type="number" inputmode="numeric" min="0" placeholder="Cantidad contada">
        <button class="qa-add-btn" id="qa-new-ok">Crear y contar</button>
        <button class="qa-link" id="qa-back">← cancelar</button>
      </div>`;
  }
  return `
    <div class="qa-searchbox">
      <svg class="qa-search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input id="qa-search" placeholder="¿Qué contaste?" autocomplete="off">
    </div>
    <div class="qa-sugg" id="qa-sugg"></div>
    <div class="qa-hint">Escribe un insumo, pon la cantidad y listo. Se puede sumar varias veces.</div>`;
}

function _wire() {
  _host.querySelector('#qa-close-m')?.addEventListener('click', () => closeSheet());
  _host.querySelector('#qa-back')?.addEventListener('click', () => { _sel = null; _new = null; _paint(); _host.querySelector('#qa-search')?.focus(); });

  if (_sel) {
    const deltaInp  = _host.querySelector('#qa-delta');
    const totalEl   = _host.querySelector('#qa-total-val');
    const addBtn    = _host.querySelector('#qa-add-ok');

    deltaInp?.focus();

    // Actualiza el total mostrado sin recargar el DOM
    const _showTotal = (it) => {
      if (totalEl) totalEl.innerHTML = `${it.cantidad} <span class="qa-total-unit">${escHtml(it.unidad)}</span>`;
    };

    const _apply = async () => {
      const n = parseInt(deltaInp.value, 10);
      if (!n || n <= 0) { deltaInp.focus(); deltaInp.classList.add('qa-shake'); setTimeout(() => deltaInp.classList.remove('qa-shake'), 400); return; }
      const it = await store.registrar(_sel.id, n);
      toast.ok(`+${n} ${it.nombre} · total ${it.cantidad}`);
      _onAdded?.(it.id, false);
      // Actualiza el total en pantalla y limpia el input (no cierra el panel)
      _sel = it;
      _showTotal(it);
      deltaInp.value = '';
      deltaInp.focus();
    };

    addBtn?.addEventListener('click', _apply);

    deltaInp?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); _apply(); }
    });

    return;
  }

  if (_new) {
    const name = _host.querySelector('#qa-new-name');
    name?.focus();
    _host.querySelector('#qa-new-ok').onclick = async () => {
      const nombre = name.value.trim();
      if (!nombre) { name.focus(); return; }
      const it = await store.addNuevo({
        nombre,
        categoria: _host.querySelector('#qa-new-cat').value,
        unidad: _host.querySelector('#qa-new-unit').value,
        umbral: parseInt(_host.querySelector('#qa-new-umbral').value, 10) || 10,
        cantidad: parseInt(_host.querySelector('#qa-new-qty').value, 10) || 0,
      });
      toast.ok(`Creado: ${it.nombre}`);
      _onAdded?.(it.id, true);
      _new = null; _paint();
      const s = _host.querySelector('#qa-search');
      if (s) { s.value = ''; s.focus(); } // Evitar que retenga el valor del insumo anterior
    };
    return;
  }

  // buscador
  const inp  = _host.querySelector('#qa-search');
  const sugg = _host.querySelector('#qa-sugg');
  let t;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => _sugg(inp.value.trim(), sugg), 110);
  });
}

function _sugg(q, box) {
  if (!q) { box.innerHTML = ''; return; }
  const nq = normSearch(q);
  const scored = [];
  for (const it of store.visibleItems()) {
    if (it.deleted_at) continue;
    const n = normSearch(it.nombre);
    if (!n.includes(nq)) continue;
    scored.push([n.startsWith(nq) ? 0 : 1, it]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].nombre.localeCompare(b[1].nombre, 'es'));
  const top = scored.slice(0, 8);

  box.innerHTML = top.map(([, it]) => `
    <button class="qa-sugg-item" data-id="${escHtml(it.id)}">
      <span class="qa-sugg-dot" style="background:${catColor(it.categoria)}"></span>
      <span class="qa-sugg-name">${escHtml(it.nombre)}</span>
      ${it.contado ? `<span class="qa-sugg-have">${it.cantidad}</span>` : ''}
    </button>`).join('') + `
    <button class="qa-sugg-new" data-new="1">
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
      Crear “${escHtml(q)}”
    </button>`;

  box.querySelectorAll('.qa-sugg-item').forEach(b => {
    b.onclick = () => { _sel = store.find(b.dataset.id); _paint(); };
  });
  box.querySelector('.qa-sugg-new').onclick = () => { _new = { nombre: q }; _paint(); };
}

// ── Hoja móvil ──
export function openSheet() {
  _host?.classList.add('open');
  document.getElementById('qa-backdrop')?.classList.add('open');
  document.body.classList.add('qa-lock');
  setTimeout(() => _host?.querySelector('#qa-search')?.focus(), 260);
}
export function closeSheet() {
  _host?.classList.remove('open');
  document.getElementById('qa-backdrop')?.classList.remove('open');
  document.body.classList.remove('qa-lock');
  _sel = null; _new = null; _paint();
}
