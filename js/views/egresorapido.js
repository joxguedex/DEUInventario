// ── Panel de Egreso Rápido ─────────────────────────────────
// Comparte ubicación con Ingreso Rápido: ambos viven dentro de <aside
// id="ingresorapido">, alternados por un switcher (ver app.js#_setQaMode) que
// muestra/oculta #qa-panel-ingreso / #qa-panel-egreso. Este módulo solo pinta
// dentro de su <div id="qa-panel-egreso">: abrir/cerrar la hoja móvil entera
// lo maneja ingresorapido.js (el "shell" compartido), no este archivo.
//
// Pide un destino de texto libre + arma un carrito de ítems y, al confirmar,
// genera una comanda real (equivalente a la "Entrega Rápida" de UCVComandas,
// origen='rapida') vía la RPC create_comanda_rapida — no un simple
// decremento de conteo. La RPC también crea el movement/movement_item de
// salida correspondiente, así que el descuento real de stock ocurre en el
// servidor (trigger trg_movement_items_apply), nunca localmente.
//
// Sin selector de Solicitante a propósito (ver supabase/2026-08-11-egreso-
// destino-libre.sql): no había forma de ver/editar las personas creadas
// desde acá, así que se reemplazó por un campo de texto libre ("Destino")
// que va directo a comandas.notas — visible en la pestaña Egresos.
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
let _onClose = null;                  // notifica al switcher (app.js) para volver a modo Ingreso
let _destino = '';                    // texto libre — va a comandas.notas
let _rows = [{ item: null, cantidad: null }];
let _submitting = false;
let _pendingOpId = null;              // client_op_id estable entre reintentos

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
// escribir (el destino, el buscador, la cantidad de una fila). Por eso acá
// NUNCA se llama _paint(): solo se actualiza el indicador de conexión de
// forma puntual, y solo si de verdad cambió. El panel puede seguir montado
// (oculto por el switcher) sin estar activo, así que igual se guarda el
// chequeo de "cambió de verdad" — solo se quitó el gate de "¿está open?"
// porque ya no hay una clase .open que lo indique acá.
let _lastOnlineSeen = null;
sync.onChange(() => {
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
  _onClose = opts.onClose || null;
  _paint();
}

function _resetState() {
  _destino = '';
  _rows = [{ item: null, cantidad: null }];
  _submitting = false;
  _pendingOpId = null;
}

// Activa el modo Egreso — llamado por el switcher (app.js) al cambiar de
// pestaña dentro del panel compartido. Ya no abre un overlay propio (eso lo
// resuelve el switcher mostrando/ocultando #qa-panel-egreso).
export async function openEgreso() {
  _lastOnlineSeen = sync.online;
  _paint();
  setTimeout(() => _host?.querySelector('#eg-destino')?.focus(), 200);
}

// Reinicia el formulario de Egreso y avisa al switcher para volver a modo
// Ingreso — se llama tanto desde el botón "✕" como tras un envío exitoso.
export function closeEgreso() {
  _resetState();
  _paint();
  _onClose?.();
}

function _head() {
  return `
    <div class="qa-head eg-head">
      <div class="qa-head-icon eg-head-icon">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </div>
      <div>
        <div class="qa-title">Egreso Rápido</div>
        <div class="qa-sub">Genera una comanda de entrega</div>
      </div>
      <button class="qa-close-m eg-close" id="eg-close" aria-label="Cerrar">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4" stroke-linecap="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>`;
}

function _destinoBlock() {
  return `<input class="eg-input" id="eg-destino" placeholder="¿Hacia dónde se entrega?" maxlength="200" value="${escHtml(_destino)}">`;
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
  const puedeEnviar = _destino.trim().length > 0
    && _rows.some(r => r.item && r.cantidad > 0)
    && sync.online
    && !_submitting;

  return `
    <div class="eg-section">
      <label class="eg-label">Destino</label>
      ${_destinoBlock()}
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

  // ── Destino ──
  _host.querySelector('#eg-destino')?.addEventListener('input', e => {
    _destino = e.target.value;
    _refreshSubmitState();
  });

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
  const puedeEnviar = _destino.trim().length > 0 && _rows.some(r => r.item && r.cantidad > 0) && sync.online && !_submitting;
  btn.disabled = !puedeEnviar;
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
// fila del insumo en Insumos se queda con el valor viejo: el próximo
// pull incremental (sync.run()/_pull()) filtra por products.updated_at, y
// un egreso solo toca inventory.qnty (vía trigger), así que ese producto no
// vuelve a aparecer en el pull hasta que algo más lo toque. Se marca
// contado=true (igual que hace registrar()): un egreso es un cambio de
// cantidad tan real y confirmado como un conteo manual.
async function _applyLocalStockPatch(items, grupoId) {
  for (const { product_id, qnty } of items) {
    const it = store.items.find(i => i.db_id === product_id && i.grupoId === grupoId);
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
  const destino = _destino.trim();
  if (!destino) { toast.err('Escribe un destino.'); return; }

  const items = _rows
    .filter(r => r.item && r.cantidad > 0)
    .map(r => ({ product_id: r.item.db_id, qnty: r.cantidad }));
  if (items.length === 0) { toast.err('Agrega al menos un producto con cantidad.'); return; }

  const grupoId = store.writeGrupoId();
  if (grupoId == null) { toast.err('Elegí un grupo de extensión en la barra superior primero.'); return; }

  _submitting = true;
  _paint();

  if (!_pendingOpId) _pendingOpId = uid();

  // Sin solicitante_ci: el destino ahora es texto libre, va a comandas.notas
  // (ver supabase/2026-08-11-egreso-destino-libre.sql) — la columna es
  // nullable y la RPC ya no exige que exista. p_grupo_id: admin/coordinador
  // lo resuelven solos server-side (current_grupo_id()); super_admin debe
  // mandar el que eligió en la barra superior (ver create_comanda_rapida).
  const payload = {
    p_solicitante_ci: null,
    p_items: items,
    p_client_op_id: _pendingOpId,
    p_note: destino,
    p_grupo_id: grupoId,
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
    await _applyLocalStockPatch(items, grupoId);   // ver comentario de la función: por qué no basta con sync.run()
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
