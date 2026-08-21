// ── Vista de Insumos ───────────────────────────────────────
// Portada de la pestaña "Insumos" de UCVAcopio: buscador + categorías como
// pestañas de filtro + tarjetas de insumo (estado/cantidad/progreso/
// controles −+/cantidad recibida). El ingreso/egreso rápido viven en sus
// propios paneles (ingresorapido.js/egresorapido.js) — acá se ajusta
// cantidad puntual a puntual (herramientas de conteo convencionales,
// quedan marcadas como "Conteo" en la Bitácora, ver store.js#registrar).
//
// El lápiz junto a −/+ abre "Editar insumo" (_openEditItem, portado de
// UCVAcopio/js/views/inventory.js#openEditItem): nombre/categoría/cantidad/
// umbral/eliminar en un solo modal. Único agregado sobre UCVAcopio: el
// campo Nombre puede fusionar con un insumo ya existente si se elige uno de
// los sugeridos (limpiar duplicados/typos sin perder el stock ya contado) —
// UCVAcopio no lo necesita porque sus categorías son un enum fijo (acá el
// admin las crea en vivo, store.categories) y no tiene ese flujo de fusión.
// Reasignar la categoría sigue siendo exclusivo del admin (a diferencia de
// nombre/cantidad/umbral/eliminar, que también puede un coordinador dentro
// de su propia categoría) — el <select> se deshabilita para cualquier otro
// rol (ver update_product_category en supabase/new-project-schema.sql §8b).
// "+ categoría" (admin-only, al final de las pestañas) delega en
// store.createCategory — sin categorías creadas no hay dónde clasificar un
// insumo nuevo, así que Ingreso Rápido bloquea la creación hasta que exista
// al menos una (ver ingresorapido.js).

import { store } from '../store.js';
import { auth } from '../auth.js';
import { escHtml, normSearch, catLabel, iStatus, iPct } from '../helpers.js';
import { toast } from '../components/toast.js';
import { confirmDialog } from '../components/confirm.js';

let _query = '';
let _cat   = 'todos';
let _root  = null;

// Categorías disponibles como pestaña de filtro: todas (admin/General) o
// solo la propia (coordinador con área) — mismo criterio que
// ingresorapido.js#_catOptions.
function _tabCats() {
  const all = [...store.categories].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  if (auth.isCoordinador() && !auth.isGeneral()) {
    return all.filter(c => String(c.id) === String(auth.area()));
  }
  return all;
}

export function renderConteo(rootEl) {
  _root = rootEl;
  _root.innerHTML = `
    <div class="cnt-wrap">
      <div class="inv-search-row">
        <div class="inp-wrap">
          <svg class="inp-ico" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" id="cnt-q" placeholder="Buscar insumo…" autocomplete="off">
          <button id="cnt-q-clear" class="inp-clear" style="display:none" title="Limpiar">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div class="tabs" id="cnt-tabs"></div>
      <div class="cnt-hint">${auth.canEditInventory()
        ? 'Toca una categoría para filtrar · ajusta cantidades directo desde cada tarjeta, o usa el <strong>Ingreso Rápido</strong> para sumar al instante.'
        : 'Consulta los insumos por categoría (solo lectura — tu cuenta no puede modificar el inventario).'}</div>
      <div class="inv-grid" id="cnt-grid"></div>
    </div>`;
  _wireControls();
  _paintTabs();
  renderList();
}

// Vestigial: Insumos ya no muestra un recuadro de estadísticas (ese
// panorama vive en la pestaña Resumen) — solo la lista de productos. Se
// mantiene exportada como no-op porque varios call-sites en app.js siguen
// llamándola tras cada cambio de stock.
export function renderTop() {}

function _paintTabs() {
  const box = _root?.querySelector('#cnt-tabs');
  if (!box) return;
  // Un coordinador de área ya solo ve (y solo puede ver, ver
  // store.js#visibleItems) los insumos de su propia categoría — el
  // selector "Todos | Mi categoría" no filtra nada de verdad, así que se
  // oculta entero en vez de mostrar una sola pestaña sin uso real.
  if (auth.isCoordinador() && !auth.isGeneral()) { box.style.display = 'none'; return; }
  box.style.display = '';
  const cats = _tabCats();
  box.innerHTML = `
    <div class="tab ${_cat === 'todos' ? 'active' : ''}" data-cat="todos">Todos</div>
    ${cats.map(c => `<div class="tab ${String(_cat) === String(c.id) ? 'active' : ''}" data-cat="${escHtml(c.id)}">${escHtml(c.nombre)}</div>`).join('')}
    ${auth.hasAdminRights() ? `<div class="tab tab-add" id="cnt-new-cat">+ categoría</div>` : ''}`;
}

function _wireControls() {
  const q = _root.querySelector('#cnt-q');
  const clr = _root.querySelector('#cnt-q-clear');
  let t;
  q.addEventListener('input', () => {
    clr.style.display = q.value ? 'flex' : 'none';
    clearTimeout(t);
    t = setTimeout(() => { _query = q.value.trim(); renderList(); }, 150);
  });
  clr.addEventListener('click', () => { q.value = ''; _query = ''; clr.style.display = 'none'; renderList(); q.focus(); });

  _root.querySelector('#cnt-tabs')?.addEventListener('click', e => {
    const tab = e.target.closest('.tab'); if (!tab) return;
    if (tab.id === 'cnt-new-cat') { _openNewCategoria(); return; }
    _cat = tab.dataset.cat;
    _paintTabs();
    renderList();
  });

  const grid = _root.querySelector('#cnt-grid');
  grid.addEventListener('click', _onGridClick);
  grid.addEventListener('input', _onGridInput);
  grid.addEventListener('keydown', _onGridKeydown);
}

function _matches(item) {
  if (_cat !== 'todos' && String(item.categoria) !== String(_cat)) return false;
  if (_query && !normSearch(item.nombre).includes(normSearch(_query))) return false;
  return true;
}

// Nº de insumos visibles cuando se pintó la lista, para detectar altas/bajas remotas.
let _lastCount = 0;

export function renderList() {
  const grid = _root?.querySelector('#cnt-grid');
  if (!grid) return;

  const list = store.visibleItems()
    .filter(it => !it.deleted_at && _matches(it))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  _lastCount = store.visibleItems().length;

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div class="empty-ico">${_boxLg()}</div>
        <div class="empty-title">${_query ? `Sin resultados para "${escHtml(_query)}"` : 'Sin insumos en esta categoría'}</div>
        <div class="empty-txt">${_query ? 'Prueba con otra palabra.' : 'Agrégalos desde Ingreso Rápido.'}</div>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(cardHtml).join('');
}

function _boxLg() {
  return `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
}

// ── Tarjeta de insumo (misma estética que UCVAcopio/js/views/inventory.js) ──
function cardHtml(it) {
  const s  = iStatus(it);
  const fc = s === 'critico' ? 'fill-red' : s === 'bajo' ? 'fill-amber' : s === 'exceso' ? 'fill-blue' : s === 'none' ? 'fill-gray' : 'fill-green';
  const tt = s === 'critico' ? 'Crítico' : s === 'bajo' ? 'Bajo' : s === 'exceso' ? 'Exceso' : s === 'none' ? 'No necesario' : 'OK';
  const tc = s === 'critico' ? 'tag-red' : s === 'bajo' ? 'tag-amber' : s === 'exceso' ? 'tag-blue' : s === 'none' ? 'tag-gray' : 'tag-green';
  const umbralPartes = [];
  if (it.umbral > 0) umbralPartes.push(`alerta &lt; ${it.umbral}`);
  if (it.umbral_max) umbralPartes.push(`exceso &gt; ${it.umbral_max}`);
  const umbralTxt = umbralPartes.length ? umbralPartes.join(' · ') : 'no necesario';
  const id = escHtml(it.id);

  return `
    <div class="inv-card status-${s}" data-id="${id}">
      <div class="ic-header">
        <div>
          <div class="ic-name">${escHtml(it.nombre)}</div>
          <div class="ic-cat">${escHtml(catLabel(it.categoria))}</div>
        </div>
        <span class="tag ${tc}">${tt}</span>
      </div>
      <div class="ic-qty">${it.cantidad}</div>
      <div class="ic-unit">${escHtml(it.unidad)} · ${umbralTxt}</div>
      <div class="ic-prog-row">
        <div class="prog"><div class="prog-fill ${fc}" style="width:${iPct(it)}%"></div></div>
      </div>
      ${auth.canEditInventory() ? `
      <div class="ic-controls">
        <button class="qty-btn" data-action="dec" data-id="${id}" tabindex="-1">−</button>
        <input type="number" class="qty-input" inputmode="numeric" min="0" value="${it.cantidad}" data-id="${id}">
        <button class="qty-btn" data-action="inc" data-id="${id}" tabindex="-1">+</button>
        <button class="qty-btn" data-action="edit" data-id="${id}" title="Editar" aria-label="Editar insumo">${_editIco()}</button>
      </div>
      <div class="ic-quickadd">
        <input type="number" class="ic-qadd-inp" inputmode="numeric" min="1" placeholder="Cantidad recibida…" data-qadd-id="${id}">
        <button class="ic-qadd-btn" data-action="add" data-id="${id}">+ Sumar</button>
      </div>` : ''}
    </div>`;
}

function _editIco() {
  return `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
}

// Reemplaza una tarjeta ya pintada por su versión actualizada (sin
// reconstruir toda la grilla — conserva scroll y el resto de las tarjetas).
function _patchCard(card, it) {
  const tmp = document.createElement('div');
  tmp.innerHTML = cardHtml(it);
  const fresh = tmp.firstElementChild;
  card.replaceWith(fresh);
  return fresh;
}

// Repinta en vivo las tarjetas ya visibles con los datos que acaba de traer
// el pull. No reconstruye toda la grilla (se pierde el scroll) salvo que
// cambie la cantidad total de insumos visibles (alta/baja remota).
export function syncView() {
  if (!_root) return;
  if (store.visibleItems().length !== _lastCount) { renderList(); return; }
  const cards = _root.querySelectorAll('.inv-card[data-id]');
  for (const card of cards) {
    if (card.contains(document.activeElement)) continue; // el usuario está escribiendo ahí
    const it = store.find(card.dataset.id);
    if (it) _patchCard(card, it);
  }
}

// Refresco puntual de un insumo tocado desde Ingreso Rápido.
export function refreshItem(id) {
  if (!_root) return;
  const it = store.find(id);
  if (!it) return;
  const card = _root.querySelector(`.inv-card[data-id="${CSS.escape(id)}"]`);
  if (card) _patchCard(card, it);
}

const _timers = new WeakMap();

async function _saveQty(card, id, val) {
  const it = await store.setTotal(id, val);
  if (it) _patchCard(card, it);
}

function _onGridClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  const card = btn.closest('.inv-card');

  if (action === 'dec' || action === 'inc') {
    const inp = card.querySelector('.qty-input');
    const cur = inp.value === '' ? 0 : parseInt(inp.value, 10) || 0;
    const next = Math.max(0, cur + (action === 'inc' ? 1 : -1));
    inp.value = next;
    clearTimeout(_timers.get(card));
    _saveQty(card, id, next);
    return;
  }

  if (action === 'add') {
    const inp = card.querySelector('.ic-qadd-inp');
    const qty = parseInt(inp.value, 10) || 0;
    if (qty <= 0) { inp.focus(); return; }
    (async () => {
      const it = await store.registrar(id, qty);
      if (!it) return;
      toast.ok(`+${qty} ${it.nombre} · total ${it.cantidad}`);
      _patchCard(card, it);
    })();
    return;
  }

  if (action === 'edit') { _openEditItem(id); }
}

function _onGridInput(e) {
  const inp = e.target.closest('.qty-input');
  if (!inp) return;
  const card = inp.closest('.inv-card');
  const id = inp.dataset.id;
  clearTimeout(_timers.get(card));
  _timers.set(card, setTimeout(() => {
    _saveQty(card, id, inp.value === '' ? 0 : parseInt(inp.value, 10) || 0);
  }, 550));
}

function _onGridKeydown(e) {
  const inp = e.target.closest('.qty-input');
  if (!inp || e.key !== 'Enter') return;
  e.preventDefault();
  const card = inp.closest('.inv-card');
  const id = inp.dataset.id;
  clearTimeout(_timers.get(card));
  _saveQty(card, id, inp.value === '' ? 0 : parseInt(inp.value, 10) || 0);
}

function _renModal(html) {
  let ov = document.getElementById('cnt-ren-modal');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'cnt-ren-modal';
    ov.className = 'adm-ov';
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) _closeRen(); });
  }
  ov.innerHTML = html;
  ov.classList.add('open');
  ov.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', _closeRen));
  return ov;
}
function _closeRen() { document.getElementById('cnt-ren-modal')?.classList.remove('open'); }

// ── Modal "Editar insumo" ────────────────────────────────
// Nombre (con fusión de duplicados) + categoría (admin-only) + cantidad +
// umbral + eliminar, en un solo modal — ver comentario de cabecera.
function _openEditItem(id) {
  const it = store.find(id);
  if (!it) return;
  let target = null; // insumo elegido del buscador de nombre para fusionar

  const isAdmin = auth.hasAdminRights();
  const catOptions = [...store.categories].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map(c => `<option value="${c.id}" ${String(c.id) === String(it.categoria) ? 'selected' : ''}>${escHtml(c.nombre)}</option>`).join('');

  const ov = _renModal(`
    <div class="adm-box adm-box-lg">
      <div class="adm-head">
        <div>
          <div class="adm-title">Editar insumo</div>
          <div class="adm-sub">${escHtml(it.nombre)}</div>
        </div>
        <button class="adm-x" data-close>&times;</button>
      </div>
      <div class="adm-field">
        <label>Nombre</label>
        <input id="ei-nombre" type="text" autocomplete="off" value="${escHtml(it.nombre)}">
      </div>
      <div class="adm-note">Si eliges una de las opciones de la lista, su stock se sumará al de ese insumo y "${escHtml(it.nombre)}" se eliminará del catálogo. Si no eliges ninguna, se guarda el nombre que escribiste.</div>
      <div class="ren-sugg" id="ei-sugg"></div>
      <div class="adm-field">
        <label>Categoría</label>
        <select id="ei-cat" ${isAdmin ? '' : 'disabled title="Solo un administrador puede reasignar la categoría"'}>${catOptions}</select>
      </div>
      <div class="adm-field-row">
        <div class="adm-field">
          <label>Cantidad</label>
          <input id="ei-qty" type="number" min="0" value="${it.cantidad}">
        </div>
        <div class="adm-field">
          <label>Umbral de alerta</label>
          <input id="ei-thr" type="number" min="0" value="${it.umbral}">
        </div>
      </div>
      <div class="adm-field">
        <label>Límite superior (exceso) — opcional</label>
        <input id="ei-thr-max" type="number" min="0" placeholder="Sin límite" value="${it.umbral_max ?? ''}">
      </div>
      <div class="adm-err" id="ei-err"></div>
      <div class="adm-actions-row">
        <button class="adm-btn adm-btn-danger" id="ei-delete">Eliminar</button>
        <button class="adm-btn adm-btn-primary" id="ei-save">Guardar</button>
      </div>
    </div>`);

  const nombreInp = ov.querySelector('#ei-nombre');
  const sugg      = ov.querySelector('#ei-sugg');
  const catSel    = ov.querySelector('#ei-cat');
  const qtyInp    = ov.querySelector('#ei-qty');
  const thrInp    = ov.querySelector('#ei-thr');
  const thrMaxInp = ov.querySelector('#ei-thr-max');
  const err       = ov.querySelector('#ei-err');
  const saveBtn   = ov.querySelector('#ei-save');
  const delBtn    = ov.querySelector('#ei-delete');

  function _paintSave() {
    saveBtn.textContent = target ? `Fusionar con "${target.nombre}"` : 'Guardar';
  }

  function _search(q) {
    if (!q) { sugg.innerHTML = ''; return; }
    const nq = normSearch(q);
    const scored = [];
    for (const other of store.visibleItems()) {
      if (other.id === it.id || other.deleted_at) continue;
      const n = normSearch(other.nombre);
      if (!n.includes(nq)) continue;
      scored.push([n.startsWith(nq) ? 0 : 1, other]);
    }
    scored.sort((a, b) => a[0] - b[0] || a[1].nombre.localeCompare(b[1].nombre, 'es'));
    const top = scored.slice(0, 6);
    sugg.innerHTML = top.map(([, o]) => `
      <button type="button" class="ren-sugg-item" data-id="${escHtml(o.id)}">
        <span class="ren-sugg-name">${escHtml(o.nombre)}</span>
        <span class="ren-sugg-have">${o.cantidad}</span>
      </button>`).join('');
    sugg.querySelectorAll('.ren-sugg-item').forEach(b => {
      b.onclick = () => {
        target = store.find(b.dataset.id);
        nombreInp.value = target.nombre;
        sugg.innerHTML = '';
        _paintSave();
      };
    });
  }

  let t;
  nombreInp.addEventListener('input', () => {
    target = null; // volver a escribir invalida cualquier selección previa
    err.textContent = '';
    _paintSave();
    clearTimeout(t);
    t = setTimeout(() => _search(nombreInp.value.trim()), 110);
  });

  delBtn.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Eliminar insumo',
      body: `¿Seguro que deseas eliminar "${escHtml(it.nombre)}" del catálogo por completo? No se puede deshacer.`,
      confirmText: 'Eliminar', danger: true,
    });
    if (!ok) return;
    await store.deleteInsumo(it.id);
    _closeRen();
    renderList();
    toast.ok('Insumo eliminado.');
  });

  saveBtn.addEventListener('click', async () => {
    err.textContent = '';
    const val = nombreInp.value.trim();
    if (!val) { err.textContent = 'Escribe un nombre.'; return; }

    // Fusión: reemplaza todo lo demás (el insumo actual desaparece del catálogo).
    if (target) {
      const ok = await confirmDialog({
        title: 'Fusionar insumos',
        body: `¿Fusionar "${escHtml(it.nombre)}" con "${escHtml(target.nombre)}"? Se sumará el stock de "${escHtml(it.nombre)}" (${it.cantidad}) a "${escHtml(target.nombre)}" y "${escHtml(it.nombre)}" se eliminará del catálogo. No se puede deshacer.`,
        confirmText: 'Fusionar', danger: true,
      });
      if (!ok) return;
      await store.fusionarInsumo(it.id, target.id);
      _closeRen();
      renderList();
      toast.ok(`Fusionado con "${target.nombre}".`);
      return;
    }

    if (isAdmin && String(catSel.value) !== String(it.categoria)) {
      try {
        await store.setProductCategory(it.id, catSel.value);
      } catch (ex) {
        err.textContent = ex.message || 'No se pudo cambiar la categoría.';
        return;
      }
    }

    if (normSearch(val) !== normSearch(it.nombre)) {
      await store.renombrarInsumo(it.id, val);
    }

    const qty = qtyInp.value === '' ? it.cantidad : parseInt(qtyInp.value, 10) || 0;
    const thr = thrInp.value === '' ? it.umbral : parseInt(thrInp.value, 10) || 0;
    const thrMaxRaw = thrMaxInp.value.trim();
    // 0 o vacío = "sin límite superior", mismo criterio que umbral=0 = "no necesario".
    const thrMax = thrMaxRaw === '' ? null : (parseInt(thrMaxRaw, 10) || 0) || null;
    if (thrMax !== null && thrMax <= thr) {
      err.textContent = 'El límite superior debe ser mayor que el umbral de alerta.';
      return;
    }
    if (thr !== it.umbral || thrMax !== (it.umbral_max ?? null)) await store.setUmbral(it.id, thr, thrMax);
    if (qty !== it.cantidad) await store.setTotal(it.id, qty);

    _closeRen();
    renderList();
    toast.ok('Insumo actualizado.');
  });

  _paintSave();
  setTimeout(() => { nombreInp.focus(); nombreInp.select(); }, 50);
}

// ── "+ categoría" (admin/super_admin) — atajo rápido sin salir de Insumos.
// La gestión completa (renombrar/borrar) vive en el panel de administrador
// (ver views/admin.js#_wireCategorias); acá solo se resuelve el caso más
// común: falta una categoría para poder clasificar el próximo insumo. Un
// super_admin necesita haber elegido un grupo en la barra superior primero
// (una categoría siempre pertenece a un solo grupo).
function _openNewCategoria() {
  if (!auth.hasAdminRights()) return;
  if (auth.isSuperAdmin() && store.viewingGrupoId == null) {
    toast.err('Elegí un grupo de extensión en la barra superior primero.');
    return;
  }

  const ov = _renModal(`
    <div class="adm-box">
      <div class="adm-head">
        <div class="adm-title">Nueva categoría</div>
        <button class="adm-x" data-close>&times;</button>
      </div>
      <div class="adm-field">
        <label>Nombre</label>
        <input id="newcat-input" type="text" autocomplete="off" placeholder="Ej. Alimentos" maxlength="100">
      </div>
      <div class="adm-err" id="newcat-err"></div>
      <button class="adm-btn adm-btn-primary" id="newcat-save">Crear categoría</button>
    </div>`);

  const inp = ov.querySelector('#newcat-input');
  const err = ov.querySelector('#newcat-err');
  const saveBtn = ov.querySelector('#newcat-save');

  const _submit = async () => {
    err.textContent = '';
    const val = inp.value.trim();
    if (!val) { err.textContent = 'Escribe un nombre.'; return; }
    try {
      await store.createCategory(val, auth.isSuperAdmin() ? store.viewingGrupoId : undefined);
      _closeRen();
      toast.ok(`Categoría "${val}" creada.`);
      _paintTabs();
      renderList();
    } catch (ex) {
      err.textContent = ex.message || 'No se pudo crear la categoría.';
    }
  };

  saveBtn.addEventListener('click', _submit);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') _submit(); });
  setTimeout(() => inp.focus(), 50);
}
