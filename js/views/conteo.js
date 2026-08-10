// ── Vista de Conteo Físico ────────────────────────────────
// Catálogo completo agrupado por categoría (todo arranca en 0).
// El ingreso/egreso rápido viven en sus propios paneles (ingresorapido.js/egresorapido.js).
//
// Cada insumo es un .cnt-item (data-id) que envuelve la línea visible
// (.cnt-row: check + nombre + stock + botón ⋮) y un panel colapsable
// (.cnt-row-menu: −/cantidad/+, "Renombrar" y "Eliminar insumo") que se abre
// con el ⋮ — decisión de IHC para no saturar la lista con controles siempre
// visibles.
// "Eliminar insumo" borra el insumo por completo del catálogo (soft delete,
// store.deleteInsumo); solo pide confirmación, no contraseña.
// "Renombrar" abre un buscador (_openRename): si se elige un insumo ya
// existente, el actual se fusiona en ese (suma de stock + eliminación del
// actual, store.fusionarInsumo); si no se elige ninguno, solo se cambia el
// nombre (store.renombrarInsumo). Pensado para limpiar duplicados/typos del
// catálogo sin perder el stock ya contado.

import { store } from '../store.js';
import { auth } from '../auth.js';
import { escHtml, normSearch, catIcon, catLabel, catColor } from '../helpers.js';
import { toast } from '../components/toast.js';

// Orden de despliegue de categorías: alfabético por nombre — ya no hay un
// orden fijo hardcodeado (las categorías las crea el admin en vivo, ver
// views/admin.js). Se recalcula en cada renderList() contra store.categories.
function _catOrder() {
  return [...store.categories].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(c => String(c.id));
}

let _filter   = 'todos';
let _query    = '';
let _expanded = new Set();
let _root     = null;
let _seeded   = false;   // ¿ya se abrió una categoría por defecto?

export function renderConteo(rootEl) {
  _root = rootEl;
  _root.innerHTML = `
    <div class="cnt-wrap">
      <div class="cnt-topcard" id="cnt-topcard"></div>
      <div class="cnt-controls">
        <div class="cnt-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="cnt-q" placeholder="Filtrar la lista…" autocomplete="off">
          <button id="cnt-q-clear" class="cnt-q-clear" style="display:none">&times;</button>
        </div>
        <div class="cnt-filters">
          <button class="cnt-fbtn active" data-f="todos">Todos</button>
          <button class="cnt-fbtn" data-f="pendientes">Pendientes</button>
          <button class="cnt-fbtn" data-f="contados">Contados</button>
        </div>
      </div>
      <div class="cnt-hint">${auth.canEditInventory()
        ? 'Toca una categoría para ver y contar sus insumos · o usa el <strong>Agregado rápido</strong> para sumar al instante.'
        : 'Toca una categoría para consultar sus insumos (solo lectura — tu cuenta no puede modificar el inventario).'}</div>
      <div class="cnt-list" id="cnt-list"></div>
    </div>`;
  _wireControls();
  renderTop();
  renderList();
}

export function renderTop() {
  const el = _root?.querySelector('#cnt-topcard');
  if (!el) return;
  const s = store.stats();
  const pct = s.total ? Math.round(s.contados / s.total * 100) : 0;
  el.innerHTML = `
    <div class="ctc-progress">
      <div class="ctc-progress-head">
        <span class="ctc-progress-title">Progreso del conteo</span>
        <span class="ctc-progress-pct">${pct}%</span>
      </div>
      <div class="ctc-bar"><div class="ctc-bar-fill" style="width:${pct}%"></div></div>
      <div class="ctc-progress-sub">
        <strong>${s.contados.toLocaleString('es-VE')}</strong> de ${s.total.toLocaleString('es-VE')} insumos ·
        <strong>${s.unidades.toLocaleString('es-VE')}</strong> unidades
      </div>
    </div>`;
}

function _wireControls() {
  const q = _root.querySelector('#cnt-q');
  const clr = _root.querySelector('#cnt-q-clear');
  let t;
  q.addEventListener('input', () => {
    clr.style.display = q.value ? 'block' : 'none';
    clearTimeout(t);
    t = setTimeout(() => { _query = q.value.trim(); renderList(); }, 150);
  });
  clr.addEventListener('click', () => { q.value=''; _query=''; clr.style.display='none'; renderList(); q.focus(); });
  _root.querySelectorAll('.cnt-fbtn').forEach(b => {
    b.addEventListener('click', () => {
      _root.querySelectorAll('.cnt-fbtn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      _filter = b.dataset.f;
      renderList();
    });
  });
}

function _matches(item) {
  if (_filter === 'pendientes' && item.contado) return false;
  if (_filter === 'contados'   && !item.contado) return false;
  if (_query && !normSearch(item.nombre).includes(normSearch(_query))) return false;
  return true;
}

export function renderList() {
  const list = _root?.querySelector('#cnt-list');
  if (!list) return;

  const groups = {};
  for (const it of store.visibleItems()) {
    if (it.deleted_at) continue;
    if (!_matches(it)) continue;
    (groups[it.categoria] ||= []).push(it);
  }
  const order = _catOrder();
  const cats = order.filter(c => groups[c]?.length)
    .concat(Object.keys(groups).filter(c => !order.includes(c)));

  if (!cats.length) { list.innerHTML = `<div class="cnt-empty">Sin resultados.</div>`; return; }

  // Abrir la primera categoría por defecto (una vez), para que se vean los insumos de entrada.
  if (!_seeded && !_query && _filter === 'todos') { _expanded.add(cats[0]); _seeded = true; }

  const forceOpen = !!_query || _filter !== 'todos';
  let html = '';
  for (const c of cats) {
    const items = groups[c].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const open  = forceOpen || _expanded.has(c);
    const contados = items.filter(i => i.contado).length;
    html += `
      <section class="cnt-cat ${open ? 'open' : ''}" data-cat="${c}">
        <button class="cnt-cat-head" data-toggle="${c}">
          <span class="cnt-cat-ico" style="color:${catColor(c)}">${catIcon(c)}</span>
          <span class="cnt-cat-name">${catLabel(c)}</span>
          <span class="cnt-cat-badge">${contados}/${items.length}</span>
          <svg class="cnt-cat-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="cnt-cat-body">${open ? _bodyHTML(items) : ''}</div>
      </section>`;
  }
  list.innerHTML = html;
  _lastCount = store.visibleItems().length;
  _wireList(list, groups, forceOpen);
}

// Cada insumo es un .cnt-item que envuelve la línea visible + el panel ⋮.
const _bodyHTML = items => items.map(_itemHTML).join('');

// Nº de insumos que había cuando se pintó la lista, para detectar altas remotas.
let _lastCount = 0;

// Repinta en vivo las filas ya visibles con los datos que acaba de traer el pull.
// No re-renderiza la lista entera: así no se pierde el scroll ni las categorías
// abiertas. Solo si otro dispositivo creó un insumo nuevo hace falta el repintado
// completo.
export function syncView() {
  if (!_root) return;
  renderTop();

  if (store.visibleItems().length !== _lastCount) { renderList(); return; }

  const wraps = _root.querySelectorAll('.cnt-item[data-id]');
  const cats = new Set();
  for (const wrap of wraps) {
    const it = store.find(wrap.dataset.id);
    if (!it) continue;
    const inp = wrap.querySelector('.cnt-qty');
    if (inp === document.activeElement) continue;  // el usuario está escribiendo ahí
    _patchItem(wrap, it);
    cats.add(wrap.closest('.cnt-cat'));
  }
  for (const sec of cats) _updateBadge(sec);
}

const _check = () => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const _dots = () => `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;

function _itemHTML(it) {
  const done = it.contado;
  // El coordinador del área "General" solo consulta (auth.canEditInventory()):
  // sin botón ⋮ ni panel −/cantidad/+/eliminar — nunca puede modificar el
  // inventario de ninguna área (documentation/05-autenticacion.md).
  if (!auth.canEditInventory()) {
    return `
      <div class="cnt-item" data-id="${escHtml(it.id)}">
        <div class="cnt-row ${done ? 'done' : ''}">
          <div class="cnt-row-check">${done ? _check() : ''}</div>
          <div class="cnt-row-name">${escHtml(it.nombre)}${it.unidad && it.unidad !== 'und' ? `<span class="cnt-row-unit">${escHtml(it.unidad)}</span>` : ''}</div>
          <div class="cnt-row-stock">${done ? it.cantidad : '—'}</div>
        </div>
      </div>`;
  }
  return `
    <div class="cnt-item" data-id="${escHtml(it.id)}">
      <div class="cnt-row ${done ? 'done' : ''}">
        <div class="cnt-row-check">${done ? _check() : ''}</div>
        <div class="cnt-row-name">${escHtml(it.nombre)}${it.unidad && it.unidad !== 'und' ? `<span class="cnt-row-unit">${escHtml(it.unidad)}</span>` : ''}</div>
        <div class="cnt-row-stock">${done ? it.cantidad : '—'}</div>
        <button class="cnt-row-menu-btn" aria-label="Opciones de conteo" tabindex="-1">${_dots()}</button>
      </div>
      <div class="cnt-row-menu" style="display:none">
        <div class="cnt-row-input">
          <button class="cnt-step" data-step="-1" tabindex="-1">−</button>
          <input class="cnt-qty" type="number" inputmode="numeric" min="0" step="1" value="${done ? it.cantidad : ''}" placeholder="0">
          <button class="cnt-step" data-step="1" tabindex="-1">+</button>
        </div>
        <button class="cnt-row-rename">Renombrar</button>
        ${auth.isAdmin() ? '<button class="cnt-row-recat">Cambiar categoría</button>' : ''}
        <button class="cnt-row-delete">Eliminar insumo</button>
      </div>
    </div>`;
}

// Aplica el estado de `it` a un .cnt-item ya pintado (sin reconstruir el HTML).
function _patchItem(wrap, it) {
  const line = wrap.querySelector('.cnt-row');
  line.classList.toggle('done', it.contado);
  line.querySelector('.cnt-row-check').innerHTML = it.contado ? _check() : '';
  line.querySelector('.cnt-row-stock').textContent = it.contado ? it.cantidad : '—';
  const qtyInp = wrap.querySelector('.cnt-qty');
  if (qtyInp) qtyInp.value = it.contado ? it.cantidad : '';
}

function _wireList(list, groups, forceOpen) {
  list.querySelectorAll('.cnt-cat-head').forEach(head => {
    head.addEventListener('click', () => {
      const c = head.dataset.toggle;
      const sec = head.closest('.cnt-cat');
      const body = sec.querySelector('.cnt-cat-body');
      const isOpen = sec.classList.toggle('open');
      if (isOpen) {
        if (!body.innerHTML.trim()) {
          const items = (groups[c] || []).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
          body.innerHTML = _bodyHTML(items);
        }
        if (!forceOpen) _expanded.add(c);
      } else if (!forceOpen) _expanded.delete(c);
    });
  });
  list.addEventListener('input', _onInput);
  list.addEventListener('click', _onClick);
  list.addEventListener('keydown', _onKeydown);
}

async function _saveRow(wrap) {
  const id  = wrap.dataset.id;
  const inp = wrap.querySelector('.cnt-qty');
  const val = inp.value === '' ? 0 : parseInt(inp.value, 10) || 0;
  const it = await store.setTotal(id, val);
  const line = wrap.querySelector('.cnt-row');
  line.classList.add('done');
  line.querySelector('.cnt-row-check').innerHTML = _check();
  line.querySelector('.cnt-row-stock').textContent = it ? it.cantidad : val;
  inp.value = it ? it.cantidad : val;
  _updateBadge(wrap.closest('.cnt-cat'));
  renderTop();
}

function _updateBadge(sec) {
  if (!sec) return;
  const cat = sec.dataset.cat;
  const items = store.visibleItems().filter(i => String(i.categoria) === String(cat) && !i.deleted_at);
  const badge = sec.querySelector('.cnt-cat-badge');
  if (badge) badge.textContent = `${items.filter(i => i.contado).length}/${items.length}`;
}

// Refresco puntual de un insumo tocado desde Ingreso Rápido
export function refreshItem(id) {
  if (!_root) return;
  renderTop();
  const it = store.find(id);
  if (!it) return;
  const wrap = _root.querySelector(`.cnt-item[data-id="${CSS.escape(id)}"]`);
  if (wrap) {
    _patchItem(wrap, it);
    _updateBadge(wrap.closest('.cnt-cat'));
  } else {
    _updateBadge(_root.querySelector(`.cnt-cat[data-cat="${it.categoria}"]`));
  }
}

const _timers = new WeakMap();
function _onInput(e) {
  const inp = e.target.closest('.cnt-qty'); if (!inp) return;
  const wrap = inp.closest('.cnt-item');
  clearTimeout(_timers.get(wrap));
  _timers.set(wrap, setTimeout(() => _saveRow(wrap), 550));
}
function _onClick(e) {
  const menuBtn = e.target.closest('.cnt-row-menu-btn');
  if (menuBtn) {
    const wrap = menuBtn.closest('.cnt-item');
    const menu = wrap.querySelector('.cnt-row-menu');
    const willOpen = menu.style.display === 'none';
    // Cerrar cualquier otro menú abierto en la lista (uno a la vez, evita
    // confusión de qué fila se está editando).
    _root.querySelectorAll('.cnt-row-menu').forEach(m => { if (m !== menu) m.style.display = 'none'; });
    menu.style.display = willOpen ? '' : 'none';
    if (willOpen) wrap.querySelector('.cnt-qty')?.focus();
    return;
  }

  const renBtn = e.target.closest('.cnt-row-rename');
  if (renBtn) {
    const wrap = renBtn.closest('.cnt-item');
    _openRename(wrap.dataset.id);
    return;
  }

  const recatBtn = e.target.closest('.cnt-row-recat');
  if (recatBtn) {
    const wrap = recatBtn.closest('.cnt-item');
    _openRecat(wrap.dataset.id);
    return;
  }

  const delBtn = e.target.closest('.cnt-row-delete');
  if (delBtn) {
    const wrap = delBtn.closest('.cnt-item');
    const it = store.find(wrap.dataset.id);
    if (!confirm(`¿Seguro que deseas eliminar "${it?.nombre || ''}" del catálogo por completo? No se puede deshacer.`)) return;
    (async () => {
      await store.deleteInsumo(wrap.dataset.id);
      wrap.remove();
      _updateBadge(_root.querySelector(`.cnt-cat[data-cat="${it?.categoria}"]`));
      renderTop();
      toast.ok('Insumo eliminado.');
    })();
    return;
  }

  const step = e.target.closest('.cnt-step'); if (!step) return;
  const wrap = step.closest('.cnt-item');
  const inp = wrap.querySelector('.cnt-qty');
  const cur = inp.value === '' ? 0 : parseInt(inp.value, 10) || 0;
  inp.value = Math.max(0, cur + parseInt(step.dataset.step, 10));
  clearTimeout(_timers.get(wrap));
  _saveRow(wrap);
}
function _onKeydown(e) {
  if (e.key !== 'Enter') return;
  const inp = e.target.closest('.cnt-qty'); if (!inp) return;
  e.preventDefault();
  const wrap = inp.closest('.cnt-item');
  clearTimeout(_timers.get(wrap));
  _saveRow(wrap);
}

// ── Modal "Renombrar" ────────────────────────────────────
// Un mismo insumo suele terminar duplicado en el catálogo con nombres
// ligeramente distintos (typos, mayúsculas, singular/plural). Este modal
// resuelve ambos casos con un solo buscador: si el usuario elige uno de los
// insumos sugeridos, el actual se fusiona en ese (suma de stock + borrado del
// actual); si no elige ninguno, el texto escrito se usa como nuevo nombre.
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

function _openRename(id) {
  const it = store.find(id);
  if (!it) return;
  let target = null; // insumo elegido del buscador para fusionar (null = solo renombrar)

  const ov = _renModal(`
    <div class="adm-box adm-box-lg">
      <div class="adm-head">
        <div>
          <div class="adm-title">Renombrar insumo</div>
          <div class="adm-sub">${escHtml(it.nombre)}</div>
        </div>
        <button class="adm-x" data-close>&times;</button>
      </div>
      <div class="adm-field">
        <label>Nombre correcto o nuevo</label>
        <input id="ren-input" type="text" autocomplete="off" value="${escHtml(it.nombre)}">
      </div>
      <div class="adm-note">Si eliges una de las opciones de la lista, su stock se sumará al de ese insumo y "${escHtml(it.nombre)}" se eliminará del catálogo. Si no eliges ninguna, solo se le cambiará el nombre por el que escribiste.</div>
      <div class="ren-sugg" id="ren-sugg"></div>
      <div class="adm-err" id="ren-err"></div>
      <button class="adm-btn adm-btn-primary" id="ren-save">Renombrar</button>
    </div>`);

  const inp     = ov.querySelector('#ren-input');
  const sugg    = ov.querySelector('#ren-sugg');
  const err     = ov.querySelector('#ren-err');
  const saveBtn = ov.querySelector('#ren-save');

  function _paintSave() {
    saveBtn.textContent = target ? `Fusionar con "${target.nombre}" y eliminar` : 'Renombrar';
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
        inp.value = target.nombre;
        sugg.innerHTML = '';
        _paintSave();
      };
    });
  }

  let t;
  inp.addEventListener('input', () => {
    target = null; // volver a escribir invalida cualquier selección previa
    err.textContent = '';
    _paintSave();
    clearTimeout(t);
    t = setTimeout(() => _search(inp.value.trim()), 110);
  });

  saveBtn.addEventListener('click', async () => {
    err.textContent = '';
    const val = inp.value.trim();
    if (!val) { err.textContent = 'Escribe un nombre.'; return; }

    if (target) {
      if (!confirm(`¿Fusionar "${it.nombre}" con "${target.nombre}"? Se sumará el stock de "${it.nombre}" (${it.cantidad}) a "${target.nombre}" y "${it.nombre}" se eliminará del catálogo. No se puede deshacer.`)) return;
      await store.fusionarInsumo(it.id, target.id);
      _closeRen();
      const wrap = _root.querySelector(`.cnt-item[data-id="${CSS.escape(it.id)}"]`);
      wrap?.remove();
      _updateBadge(_root.querySelector(`.cnt-cat[data-cat="${it.categoria}"]`));
      renderTop();
      toast.ok(`Fusionado con "${target.nombre}".`);
      return;
    }

    if (normSearch(val) === normSearch(it.nombre)) { _closeRen(); return; }
    await store.renombrarInsumo(it.id, val);
    _closeRen();
    const wrap = _root.querySelector(`.cnt-item[data-id="${CSS.escape(it.id)}"]`);
    if (wrap) {
      const unit = it.unidad && it.unidad !== 'und' ? `<span class="cnt-row-unit">${escHtml(it.unidad)}</span>` : '';
      wrap.querySelector('.cnt-row-name').innerHTML = `${escHtml(val)}${unit}`;
    }
    toast.ok('Insumo renombrado.');
  });

  _paintSave();
  setTimeout(() => { inp.focus(); inp.select(); }, 50);
}

// ── Modal "Cambiar categoría" (admin-only) ──────────────────────────────
// Reasignar la categoría de un producto es exclusivo del admin (a
// diferencia de crear/editar/eliminar insumos, que también puede un
// coordinador dentro de su propia categoría) — ver update_product_category
// en supabase/new-project-schema.sql §8b. El botón que abre esto ya está
// oculto para no-admin (_itemHTML), esto es respaldo defensivo: la RPC en
// sí también rechaza a cualquiera que no sea admin.
function _openRecat(id) {
  const it = store.find(id);
  if (!it || !auth.isAdmin()) return;

  const ov = _renModal(`
    <div class="adm-box">
      <div class="adm-head">
        <div>
          <div class="adm-title">Cambiar categoría</div>
          <div class="adm-sub">${escHtml(it.nombre)}</div>
        </div>
        <button class="adm-x" data-close>&times;</button>
      </div>
      <div class="adm-field">
        <label>Categoría nueva</label>
        <select id="recat-sel" style="width:100%; padding:12px; border:1.5px solid var(--bdr); border-radius:var(--r-sm); background:var(--s2);">
          ${[...store.categories].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
            .map(c => `<option value="${c.id}" ${String(c.id) === String(it.categoria) ? 'selected' : ''}>${escHtml(c.nombre)}</option>`).join('')}
        </select>
      </div>
      <div class="adm-err" id="recat-err"></div>
      <button class="adm-btn adm-btn-primary" id="recat-save">Guardar</button>
    </div>`);

  const sel = ov.querySelector('#recat-sel');
  const err = ov.querySelector('#recat-err');
  ov.querySelector('#recat-save').addEventListener('click', async () => {
    err.textContent = '';
    const nuevaCat = sel.value;
    if (String(nuevaCat) === String(it.categoria)) { _closeRen(); return; }
    try {
      await store.setProductCategory(it.id, nuevaCat);
      _closeRen();
      renderList();
      toast.ok('Categoría actualizada.');
    } catch (ex) {
      err.textContent = ex.message || 'No se pudo cambiar la categoría.';
    }
  });
}
