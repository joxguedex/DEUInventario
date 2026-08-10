// ── Panel de Egreso Rápido ─────────────────────────────────
// Overlay de pantalla completa (todos los viewports, no solo móvil).
// Busca un solicitante + arma un carrito de ítems y, al confirmar, genera
// una comanda real (equivalente a la "Entrega Rápida" de UCVComandas,
// origen='rapida') vía la RPC create_comanda_rapida — no un simple
// decremento de conteo. La RPC también crea el movement/movement_item de
// salida correspondiente, así que el descuento real de stock ocurre en el
// servidor (trigger trg_movement_items_apply), nunca localmente.
//
// A diferencia del conteo (offline-first), esta acción REQUIERE conexión:
// crea un documento de negocio irreversible con reserva de stock en tiempo
// real, y no existe hoy un flujo de edición/anulación de comandas expuesto
// en Inventario. Ver documentation del plan para el detalle de la decisión.

import { store } from '../store.js';
import { sync } from '../sync.js';
import { db } from '../db.js';
import { auth } from '../auth.js';
import { SUPABASE_URL } from '../config.js';
import { DB_SCHEMA } from '../env-config.js';
import { escHtml, normSearch, uid, nowISO } from '../helpers.js';
import { toast } from '../components/toast.js';

let _host = null;
let _onSubmitted = null;
let _solicitante = null;              // { ci, name, surname }
let _rows = [{ item: null, cantidad: null }];
let _submitting = false;
let _pendingOpId = null;              // client_op_id estable entre reintentos
let _ubicacionNombre = null;
let _solSugg = [];                    // últimos resultados de búsqueda de solicitante
let _addingPersona = false;           // toggle del mini-form "+ Nueva persona"

// Espejo de PHONE_PREFIXES/PersonCategoria de UCVComandas (app.js / models/person.py).
// Sin "¿Es ucevista?" a propósito: en Comandas esa casilla otorga un login de
// voluntario automático (_grant_vol_access) — acá el pedido es explícitamente
// "sin ingreso, solo registrado en persons, sin área", así que se omite entero.
const PHONE_PREFIXES = ['0412', '0414', '0416', '0422', '0424', '0426'];
const CATEGORIAS = ['Externo', 'Voluntario', 'Medico', 'Rescatista', 'Conductor'];

function _headers(extra = {}) {
  return auth.authHeaders({
    'Accept-Profile': DB_SCHEMA,
    'Content-Profile': DB_SCHEMA,
    ...extra,
  });
}

// El botón "Confirmar entrega" depende de sync.online. sync.onChange se
// dispara en CADA ciclo de sync (cada 30s automático, o antes por Realtime
// si cualquiera de las 3 apps toca products/inventory) — no solo cuando
// cambia la conectividad. Repintar todo el panel (_paint(), innerHTML
// completo) en cada disparo borraba lo que el usuario tenía a medio
// escribir (el form de "Nueva persona", el buscador, la cantidad de una
// fila). Por eso acá NUNCA se llama _paint(): solo se actualiza el
// indicador de conexión de forma puntual, y solo si de verdad cambió.
let _lastOnlineSeen = null;
sync.onChange(() => {
  if (!_host?.classList.contains('open')) return;
  if (_lastOnlineSeen === sync.online) return;
  _lastOnlineSeen = sync.online;
  _refreshOnlineIndicator();
});

function _refreshOnlineIndicator() {
  const warn = _host?.querySelector('#eg-offline-warn');
  if (warn) warn.style.display = sync.online ? 'none' : '';
  _refreshSubmitState();
}

export function renderEgresoRapido(hostEl, opts = {}) {
  _host = hostEl;
  _onSubmitted = opts.onSubmitted || null;
  _paint();
}

function _resetState() {
  _solicitante = null;
  _rows = [{ item: null, cantidad: null }];
  _submitting = false;
  _pendingOpId = null;
  _solSugg = [];
  _addingPersona = false;
}

export async function openEgreso() {
  _host?.classList.add('open');
  document.body.classList.add('qa-lock');
  _lastOnlineSeen = sync.online;
  if (!_ubicacionNombre) _fetchUbicacionGenerica();
  _paint();
  setTimeout(() => _host?.querySelector('#eg-sol-search')?.focus(), 200);
}

export function closeEgreso() {
  _host?.classList.remove('open');
  document.body.classList.remove('qa-lock');
  _resetState();
  _paint();
}

// Puramente cosmético (mostrar "Entregando desde: X"): la RPC
// create_comanda_rapida resuelve el destino real del lado del servidor a la
// ubicación marcada `es_default_egreso` (configurable por cada organización
// en Ubicaciones — ya no un nombre hardcodeado tipo "UCV Centro de Acopio").
async function _fetchUbicacionGenerica() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ubicaciones_genericas_selectable?select=nombre&es_default_egreso=eq.true&limit=1`,
      { headers: _headers() }
    );
    if (!res.ok) return;
    const rows = await res.json();
    _ubicacionNombre = Array.isArray(rows) && rows[0] ? rows[0].nombre : null;
  } catch { /* cosmético — la RPC resuelve el destino real igual */ }
  // Actualiza solo el subtítulo del header (sin _paint(): esto llega async
  // justo después de abrir el panel, y un repintado completo en ese momento
  // borraría cualquier tecla que el usuario ya haya escrito).
  const sub = _host?.querySelector('.qa-sub');
  if (sub && _ubicacionNombre) sub.textContent = `Entregando desde: ${_ubicacionNombre}`;
}

function _head() {
  return `
    <div class="qa-head eg-head">
      <div class="qa-head-icon eg-head-icon">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </div>
      <div>
        <div class="qa-title">Egreso Rápido</div>
        <div class="qa-sub">${_ubicacionNombre ? `Entregando desde: ${escHtml(_ubicacionNombre)}` : 'Genera una comanda de entrega'}</div>
      </div>
      <button class="qa-close-m eg-close" id="eg-close" aria-label="Cerrar">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4" stroke-linecap="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>`;
}

function _solicitanteBlock() {
  if (_solicitante) {
    return `
      <div class="eg-sol-chip">
        <span class="eg-sol-name">${escHtml(_solicitante.name)} ${escHtml(_solicitante.surname)}</span>
        <button class="eg-x" id="eg-sol-clear" aria-label="Quitar solicitante">✕</button>
      </div>`;
  }
  return `
    <div class="eg-sol-row">
      <div class="eg-searchbox eg-sol-searchbox">
        <input id="eg-sol-search" placeholder="Buscar solicitante por nombre o cédula…" autocomplete="off">
      </div>
      <button class="eg-add-persona-btn" id="eg-add-persona-btn" type="button" title="Agregar nueva persona">+</button>
    </div>
    <div class="eg-sugg" id="eg-sol-sugg"></div>
    ${_addingPersona ? _personaFormHtml() : ''}`;
}

function _personaFormHtml() {
  return `
    <div class="eg-persona-form">
      <div class="eg-persona-title">Nueva persona · sin acceso al sistema</div>
      <input class="eg-input" id="eg-pqa-ci" type="number" inputmode="numeric" placeholder="Cédula">
      <div class="eg-persona-row">
        <input class="eg-input" id="eg-pqa-nombre" placeholder="Nombre" maxlength="80">
        <input class="eg-input" id="eg-pqa-apellido" placeholder="Apellido" maxlength="80">
      </div>
      <div class="eg-persona-row">
        <select class="qa-new-sel eg-persona-tel-sel" id="eg-pqa-prefijo">
          ${PHONE_PREFIXES.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
        <input class="eg-input" id="eg-pqa-numero" inputmode="numeric" maxlength="7" placeholder="1234567">
      </div>
      <select class="qa-new-sel" id="eg-pqa-categoria">
        ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
      <div class="eg-persona-actions">
        <button class="eg-persona-save" id="eg-pqa-save" type="button">Guardar persona</button>
        <button class="qa-link" id="eg-pqa-cancel" type="button">Cancelar</button>
      </div>
    </div>`;
}

function _rowHtml(row, idx) {
  if (row.item) {
    const over = row.cantidad > row.item.cantidad;
    return `
      <div class="eg-row-wrap" data-idx="${idx}">
        <div class="eg-row">
          <div class="eg-row-item">
            <span class="eg-row-name">${escHtml(row.item.nombre)}</span>
            <span class="eg-row-stock">stock: ${row.item.cantidad} ${escHtml(row.item.unidad || '')}</span>
          </div>
          <input class="eg-row-qty ${over ? 'eg-qty-warn' : ''}" type="number" min="1" inputmode="numeric"
                 value="${row.cantidad ?? ''}" data-idx="${idx}" placeholder="Cant.">
          <button class="eg-row-x" data-idx="${idx}" aria-label="Quitar ítem">✕</button>
        </div>
        <div class="eg-row-warn" ${over ? '' : 'style="display:none"'}>Pide más de lo disponible — el servidor lo rechazará si no alcanza.</div>
      </div>`;
  }
  return `
    <div class="eg-row-wrap" data-idx="${idx}">
      <div class="eg-row eg-row-empty">
        <div class="eg-searchbox eg-row-searchbox">
          <input class="eg-row-input" data-idx="${idx}" placeholder="Buscar producto…" autocomplete="off">
        </div>
      </div>
      <div class="eg-sugg eg-row-sugg" data-idx="${idx}"></div>
    </div>`;
}

function _body() {
  const puedeEnviar = !!_solicitante
    && _rows.some(r => r.item && r.cantidad > 0)
    && sync.online
    && !_submitting;

  return `
    <div class="eg-section">
      <label class="eg-label">Solicitante</label>
      ${_solicitanteBlock()}
    </div>
    <div class="eg-section">
      <label class="eg-label">Ítems</label>
      <div class="eg-cart">
        ${_rows.map((r, i) => _rowHtml(r, i)).join('')}
      </div>
    </div>
    <div class="eg-offline-warn" id="eg-offline-warn" ${sync.online ? 'style="display:none"' : ''}>Sin conexión — Egreso Rápido requiere estar en línea.</div>
    <button class="eg-submit" id="eg-submit" ${puedeEnviar ? '' : 'disabled'}>
      ${_submitting ? 'Registrando…' : 'Confirmar entrega'}
    </button>`;
}

function _paint() {
  if (!_host) return;
  _host.innerHTML = _head() + `<div class="qa-body eg-body" id="eg-body">${_body()}</div>`;
  _wire();
}

function _wire() {
  _host.querySelector('#eg-close')?.addEventListener('click', closeEgreso);

  // ── Solicitante ──
  if (_solicitante) {
    _host.querySelector('#eg-sol-clear')?.addEventListener('click', () => { _solicitante = null; _paint(); });
  } else {
    const inp = _host.querySelector('#eg-sol-search');
    const box = _host.querySelector('#eg-sol-sugg');
    let t;
    inp?.addEventListener('input', () => {
      clearTimeout(t);
      const q = inp.value.trim();
      if (!q) { box.innerHTML = ''; _solSugg = []; return; }
      t = setTimeout(() => _searchSolicitantes(q, box), 200);
    });

    _host.querySelector('#eg-add-persona-btn')?.addEventListener('click', () => {
      _addingPersona = !_addingPersona;
      _paint();
    });
    if (_addingPersona) {
      _host.querySelector('#eg-pqa-cancel')?.addEventListener('click', () => { _addingPersona = false; _paint(); });
      _host.querySelector('#eg-pqa-save')?.addEventListener('click', _crearPersonaRapida);
      _host.querySelector('#eg-pqa-ci')?.focus();
    }
  }

  // ── Filas del carrito ──
  _rows.forEach((row, idx) => {
    if (row.item) {
      const wrap = _host.querySelector(`.eg-row-wrap[data-idx="${idx}"]`);
      const qtyInp = wrap?.querySelector('.eg-row-qty');
      const warnEl = wrap?.querySelector('.eg-row-warn');
      qtyInp?.addEventListener('input', () => {
        row.cantidad = parseInt(qtyInp.value, 10) || null;
        const over = row.cantidad > row.item.cantidad;
        qtyInp.classList.toggle('eg-qty-warn', over);
        if (warnEl) warnEl.style.display = over ? '' : 'none';
        _refreshSubmitState();
      });
      _host.querySelector(`.eg-row-x[data-idx="${idx}"]`)?.addEventListener('click', () => {
        _rows.splice(idx, 1);
        if (_rows.length === 0 || _rows[_rows.length - 1].item) _rows.push({ item: null, cantidad: null });
        _paint();
      });
    } else {
      const inp = _host.querySelector(`.eg-row-input[data-idx="${idx}"]`);
      const box = _host.querySelector(`.eg-row-sugg[data-idx="${idx}"]`);
      let t;
      inp?.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => _searchProducto(inp.value.trim(), box, idx), 110);
      });
    }
  });

  _host.querySelector('#eg-submit')?.addEventListener('click', _submit);
}

// Actualiza solo el estado disabled del botón, sin repintar todo (no perder foco del input de cantidad)
function _refreshSubmitState() {
  const btn = _host.querySelector('#eg-submit');
  if (!btn) return;
  const puedeEnviar = !!_solicitante && _rows.some(r => r.item && r.cantidad > 0) && sync.online && !_submitting;
  btn.disabled = !puedeEnviar;
}

async function _searchSolicitantes(q, box) {
  try {
    const term = encodeURIComponent(q);
    const url = `${SUPABASE_URL}/rest/v1/persons_solicitantes?select=ci,name,surname`
      + `&or=(name.ilike.*${term}*,surname.ilike.*${term}*,ci_text.ilike.*${term}*)`
      + `&order=name.asc,surname.asc&limit=20`;
    const res = await fetch(url, { headers: _headers() });
    _solSugg = res.ok ? await res.json() : [];
  } catch { _solSugg = []; }

  box.innerHTML = _solSugg.length
    ? _solSugg.map(p => `
        <button class="qa-sugg-item eg-sol-item" data-ci="${p.ci}">
          <span class="qa-sugg-name">${escHtml(p.name)} ${escHtml(p.surname)}</span>
        </button>`).join('')
    : `<div class="eg-sugg-empty">Sin resultados</div>`;

  box.querySelectorAll('.eg-sol-item').forEach(b => {
    b.onclick = () => {
      _solicitante = _solSugg.find(p => String(p.ci) === b.dataset.ci) || null;
      _paint();
    };
  });
}

// Crea una persona SIN inicio de sesión (RPC create_person, ver
// supabase/new-project-schema.sql §8) — un solicitante no necesita cuenta,
// solo existir en `persons` para poder elegirlo como destinatario.
async function _crearPersonaRapida() {
  const ci = parseInt(_host.querySelector('#eg-pqa-ci')?.value, 10);
  const nombre = _host.querySelector('#eg-pqa-nombre')?.value.trim();
  const apellido = _host.querySelector('#eg-pqa-apellido')?.value.trim();
  const prefijo = _host.querySelector('#eg-pqa-prefijo')?.value;
  const numero = _host.querySelector('#eg-pqa-numero')?.value.trim();
  const categoria = _host.querySelector('#eg-pqa-categoria')?.value;

  if (!ci || ci <= 0) { toast.err('Cédula inválida.'); return; }
  if (!nombre || !apellido) { toast.err('Nombre y apellido son obligatorios.'); return; }
  if (!/^\d{7}$/.test(numero)) { toast.err('Teléfono inválido (7 dígitos tras el prefijo).'); return; }

  const btn = _host.querySelector('#eg-pqa-save');
  if (btn) btn.disabled = true;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_person`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({
        p_ci: ci,
        p_name: nombre,
        p_surname: apellido,
        p_phone_company_code: prefijo,
        p_phone_number: numero,
        p_categoria: categoria,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.err(err.message || 'No se pudo registrar la persona.');
      if (btn) btn.disabled = false;
      return;
    }
    const rows = await res.json();
    const p = Array.isArray(rows) ? rows[0] : rows;
    if (!p) { toast.err('No se pudo registrar la persona.'); if (btn) btn.disabled = false; return; }
    _solicitante = { ci: p.ci, name: p.name, surname: p.surname };
    _addingPersona = false;
    toast.ok('Persona guardada.');
    _paint();
  } catch (e) {
    console.error('create_person', e);
    toast.err('Sin conexión — no se pudo registrar la persona.');
    if (btn) btn.disabled = false;
  }
}

function _searchProducto(q, box, idx) {
  if (!q) { box.innerHTML = ''; return; }
  const nq = normSearch(q);
  const scored = [];
  for (const it of store.visibleItems()) {
    if (it.deleted_at) continue;
    if (it.db_id == null) continue;   // sin id real de servidor todavía (creado offline sin sync)
    const n = normSearch(it.nombre);
    if (!n.includes(nq)) continue;
    scored.push([n.startsWith(nq) ? 0 : 1, it]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].nombre.localeCompare(b[1].nombre, 'es'));
  const top = scored.slice(0, 8);

  box.innerHTML = top.length
    ? top.map(([, it]) => `
        <button class="qa-sugg-item" data-id="${escHtml(it.id)}">
          <span class="qa-sugg-name">${escHtml(it.nombre)}</span>
          <span class="qa-sugg-have">${it.cantidad}</span>
        </button>`).join('')
    : `<div class="eg-sugg-empty">Sin resultados (o sin sincronizar aún)</div>`;

  box.querySelectorAll('.qa-sugg-item').forEach(b => {
    b.onclick = () => {
      const it = store.find(b.dataset.id);
      if (!it) return;
      _rows[idx] = { item: { db_id: it.db_id, nombre: it.nombre, unidad: it.unidad, cantidad: it.cantidad }, cantidad: null };
      if (idx === _rows.length - 1) _rows.push({ item: null, cantidad: null });
      _paint();
    };
  });
}

// La RPC create_comanda_rapida NO pasa por la cola de sync.enqueue, así que
// nada la refleja automáticamente en store.items — a diferencia de
// store.registrar() (Ingreso Rápido), que actualiza la cantidad local de
// forma optimista ANTES de confirmar con el servidor. Sin este parche, la
// fila del insumo en Conteo Físico se queda con el valor viejo: el próximo
// pull incremental (sync.run()/_pull()) filtra por products.updated_at, y
// un egreso solo toca inventory.qnty (vía trigger), así que ese producto no
// vuelve a aparecer en el pull hasta que algo más lo toque. Se marca
// contado=true (igual que hace registrar()): un egreso es un cambio de
// cantidad tan real y confirmado como un conteo manual.
async function _applyLocalStockPatch(items) {
  for (const { product_id, qnty } of items) {
    const it = store.items.find(i => i.db_id === product_id);
    if (!it) continue;
    it.cantidad = Math.max(0, it.cantidad - qnty);
    it.contado = true;
    it.updated_at = nowISO();
    it.dirty = true;
    await db.put(it);
  }
}

async function _submit() {
  if (_submitting) return;
  if (!sync.online) { toast.err('Egreso Rápido requiere estar en línea.'); return; }
  if (!_solicitante) { toast.err('Elige un solicitante.'); return; }

  const items = _rows
    .filter(r => r.item && r.cantidad > 0)
    .map(r => ({ product_id: r.item.db_id, qnty: r.cantidad }));
  if (items.length === 0) { toast.err('Agrega al menos un producto con cantidad.'); return; }

  _submitting = true;
  _paint();

  if (!_pendingOpId) _pendingOpId = uid();

  const payload = {
    p_solicitante_ci: _solicitante.ci,
    p_items: items,
    p_client_op_id: _pendingOpId,
    p_note: null,
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_comanda_rapida`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.err(err.message || 'No se pudo registrar la entrega.');
      _submitting = false;
      _paint();
      return;
    }
    toast.ok('Comanda registrada y completada.');
    _pendingOpId = null;
    await _applyLocalStockPatch(items);   // ver comentario de la función: por qué no basta con sync.run()
    _onSubmitted?.();
    closeEgreso();
    sync.run();   // en segundo plano: confirma/reconcilia con el servidor, no bloquea la UI
  } catch (e) {
    console.error('create_comanda_rapida', e);
    toast.err('Sin conexión — no se pudo registrar la entrega. Intenta de nuevo cuando tengas señal.');
    _submitting = false;
    _paint();
  }
}
