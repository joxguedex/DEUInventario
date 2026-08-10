// ── Pestaña Despachos (coordinadores de categoría) ────────
// Cada comanda de Egreso Rápido (views/egresorapido.js#create_comanda_rapida)
// genera un "despacho" por cada uno de sus ítems, filtrado por la categoría
// del producto — el coordinador cuya categoría coincide debe confirmar la
// entrega de cada ítem antes de que la comanda pueda completarse. Pega
// directo contra `list_despachos_pendientes`/`marcar_despacho_entregado`
// (supabase/new-project-schema.sql §10).
//
// Admin (y el coordinador de área 'general') ve los despachos de cualquier
// categoría; un coordinador de categoría real solo los de la suya — la RPC
// ya resuelve ese alcance del lado del servidor vía can_access_category(),
// acá no hace falta filtrar de nuevo.

import { SUPABASE_URL } from '../config.js';
import { DB_SCHEMA } from '../env-config.js';
import { escHtml, catLabel } from '../helpers.js';
import { toast } from '../components/toast.js';
import { auth } from '../auth.js';

function _headers() {
  return auth.authHeaders({ 'Content-Profile': DB_SCHEMA });
}

async function _rpc(name, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: _headers(), body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message || data?.hint || 'Error de servidor';
    throw new Error(msg);
  }
  return data;
}

function _fmtFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

let container = null;
let loaded = false;

export function renderDespachos(hostEl) {
  container = hostEl;
  if (!loaded) {
    const isAdmin = auth.isAdmin();
    // El coordinador de "General" despacha cualquier área (documentation/
    // 05-autenticacion.md) — las RPC list_despachos_pendientes/
    // marcar_despacho_entregado ya le dan ese mismo alcance del lado del
    // servidor (ver supabase-migrations), acá solo se refleja en el rótulo.
    const subt = (isAdmin || auth.isGeneral()) ? 'Todas las áreas' : `Área: ${escHtml(catLabel(auth.area()))}`;
    container.innerHTML = `
      <div class="reg-wrap">
        <div class="cnt-topcard">
          <div class="ctc-progress-head">
            <span class="ctc-progress-title">Despachos Pendientes</span>
            <button class="adm-btn" id="dsp-refresh" type="button">Actualizar</button>
          </div>
          <div class="adm-note" style="margin:6px 0 0;">${subt}</div>
        </div>
        <div class="reg-list" id="dsp-list" style="margin-top:20px;">
          <div class="reg-empty"><span class="reg-empty-t">Cargando despachos...</span></div>
        </div>
      </div>`;

    container.querySelector('#dsp-refresh')?.addEventListener('click', loadDespachos);
    loaded = true;
  }
  loadDespachos();
}

// Pinta las filas en la lista si la pestaña ya se montó alguna vez en esta
// sesión (`container` no nulo) — no-op si todavía no se abrió: el chequeo de
// fondo (`_backgroundCheck`) igual necesita poder llamar esto sin que exista
// el DOM de la pestaña todavía, para no perder la notificación/el badge.
function _renderRows(data) {
  const listEl = container?.querySelector('#dsp-list');
  if (!listEl) return;

  if (!data.length) {
    listEl.innerHTML = `<div class="reg-empty"><span class="reg-empty-t">No hay despachos pendientes por ahora</span></div>`;
    return;
  }

  listEl.innerHTML = data.map(d => `
    <div class="dsp-item">
      <div class="dsp-info">
        <div class="dsp-name">
          ${escHtml(d.producto)}
          <span class="dsp-qty">Cant.: ${escHtml(String(d.cantidad ?? ''))} ${escHtml(d.unidad || '')}</span>
        </div>
        <div class="dsp-meta">
          <span class="dsp-badge">${escHtml(catLabel(d.category_id))}</span>
          <span class="dsp-sub">${escHtml(d.solicitante)} · ${escHtml(_fmtFecha(d.solicitado_en))}</span>
        </div>
      </div>
      <button
        class="adm-btn adm-btn-primary dsp-entregar-btn"
        data-item-id="${d.item_id}"
      >Entregar</button>
    </div>
  `).join('');

  listEl.querySelectorAll('.dsp-entregar-btn').forEach(btn => {
    btn.addEventListener('click', () => _entregar(btn));
  });
}

async function loadDespachos() {
  const listEl = container?.querySelector('#dsp-list');
  if (listEl) listEl.innerHTML = `<div class="reg-empty"><span class="reg-empty-t">Cargando despachos...</span></div>`;
  try {
    const data = await _rpc('list_despachos_pendientes', {});
    _checkNuevos(data);
    _renderRows(data);
  } catch (err) {
    if (listEl) {
      listEl.innerHTML = `<div class="reg-empty"><span class="reg-empty-t" style="color:var(--red);">${escHtml(err.message || 'Error al cargar despachos')}</span></div>`;
    }
  }
}

// ── Notificación de despachos nuevos + badge de la pestaña ────────────
// `_seenIds` empieza en null (sin línea base todavía): la primera vez que se
// consulta tras un login no se avisa de nada — solo se avisa de lo que
// aparece DESPUÉS de esa primera lectura, para no bombardear con un toast
// del backlog completo cada vez que alguien abre sesión. Si llegan varios
// ítems nuevos en la misma corrida (mismo intervalo de sondeo), se cuentan
// juntos en un solo toast — nunca uno por ítem.
let _seenIds = null;

function _updateBadge(count) {
  ['dsp-badge-desktop', 'dsp-badge-mobile'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (count > 0) {
      el.textContent = count > 99 ? '99+' : String(count);
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

function _checkNuevos(data) {
  const ids = new Set(data.map(d => d.item_id));
  if (_seenIds !== null) {
    const nuevos = [...ids].filter(id => !_seenIds.has(id)).length;
    if (nuevos > 0) {
      const plural = nuevos === 1 ? '' : 's';
      toast.info(`${nuevos} despacho${plural} nuevo${plural} pendiente${plural}.`);
    }
  }
  _seenIds = ids;
  _updateBadge(ids.size);
}

// Sondeo de fondo (independiente de si la pestaña Despachos está abierta):
// mismo criterio de cadencia que el timer de red de seguridad de sync.js
// (30s) — acá 25s, sin relación real con ese número, solo un valor cercano
// razonable para no golpear la RPC más seguido de lo necesario.
async function _backgroundCheck() {
  if (!auth.hasPlatformAccess()) {
    _seenIds = null;
    _updateBadge(0);
    return;
  }
  try {
    const data = await _rpc('list_despachos_pendientes', {});
    _checkNuevos(data);
    _renderRows(data); // no-op si la pestaña nunca se abrió en esta sesión
  } catch {
    // Sondeo silencioso: un corte de red puntual cada 25s no debe generar
    // un toast de error — el usuario ya se entera si abre la pestaña.
  }
}

export function initDespachosWatcher() {
  auth.onChange(_backgroundCheck);
  _backgroundCheck();
  setInterval(_backgroundCheck, 25000);
}

async function _entregar(btn) {
  const itemId = parseInt(btn.dataset.itemId, 10);
  btn.disabled = true;
  btn.textContent = 'Entregando...';
  try {
    await _rpc('marcar_despacho_entregado', { p_item_id: itemId });
    toast.ok('Ítem despachado.');
    await loadDespachos();
  } catch (err) {
    toast.err(err.message || 'No se pudo marcar el despacho.');
    btn.disabled = false;
    btn.textContent = 'Entregar';
  }
}
