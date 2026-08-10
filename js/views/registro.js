// ── Vista de Bitácora (log de conteos) ────────────────────
// Historial cronológico de cada registro de conteo, agrupado
// por día. Permite borrar/corregir un registro (revierte el
// delta sobre el insumo).

import { store } from '../store.js';
import { auth } from '../auth.js';
import { escHtml, catColor, localDate } from '../helpers.js';
import { toast } from '../components/toast.js';
import { SUPABASE_URL } from '../config.js';
import { DB_SCHEMA } from '../env-config.js';

let _root = null;

function _headers() { return auth.authHeaders({ 'Accept-Profile': DB_SCHEMA }); }

// Egresos generados por una comanda (UCVComandas, o el Egreso Rápido propio
// de Inventario) no traen contado_por en movements.note — el dato de "quién"
// vive en la tabla `comandas`, no accesible directo con la anon key (trae
// PII: cédulas/teléfonos/OCR). `comandas_movement_info` es una vista propia
// que expone solo lo necesario para la Bitácora (ver
// supabase/2026-07-27-bitacora-procedencia.sql).
async function _fetchComandaInfo(movementIds) {
  const map = new Map();
  if (!movementIds.length) return map;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/comandas_movement_info?select=movement_id,origen,autorizado_por,aprobado_por,created_by&movement_id=in.(${movementIds.join(',')})`,
      { headers: _headers() }
    );
    if (res.ok) {
      const rows = await res.json();
      for (const r of rows) map.set(r.movement_id, r);
    }
  } catch { /* sin red o vista aún no aplicada: se degrada a mostrar el nombre libre */ }
  return map;
}

function _fmtDayLong(iso) {
  const dias  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const [y, m, d] = iso.split('-');
  const dt = new Date(iso + 'T12:00:00');
  return `${dias[dt.getDay()]}, ${parseInt(d)} de ${meses[parseInt(m)-1]}`;
}
function _fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}

export async function renderRegistro(rootEl) {
  _root = rootEl;

  // Mostrar spinner mientras carga
  rootEl.innerHTML = `<div class="reg-wrap"><div class="reg-empty"><span class="reg-empty-t" style="opacity:.5">Cargando registros...</span></div></div>`;

  let logs = [];
  let fromCloud = false;

  if (SUPABASE_URL) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/movement_items?select=id,qnty,movements(id,direction,note,occurred_at,client_op_id),products(name,category_id,client_id)&order=id.desc&limit=500`,
        { headers: _headers() }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const movementIds = [...new Set(data.map(m => m.movements?.id).filter(Boolean))];
          const comandaMap = await _fetchComandaInfo(movementIds);

          logs = data.map(m => {
            const mv = m.movements || {};
            const pr = m.products || {};
            const delta = mv.direction === 'in' ? Math.abs(m.qnty) : -Math.abs(m.qnty);
            const productName = pr.name || '';

            // El área de quien contó ya viene embebida en movements.note como
            // "Nombre · Área" (o "Nombre · Administrador"), armada del lado
            // del cliente al momento de registrar (ver store.js#_conTag) —
            // mismo formato que ya usa UCVAcopio, comparten la tabla.
            const comanda = comandaMap.get(mv.id);
            const contado_por = comanda
              // Egreso por comanda: el nombre de quien la CREÓ no es relevante
              // acá — lo que importa es quién autorizó la salida del insumo.
              ? `Autorizado por ${comanda.autorizado_por || comanda.aprobado_por || 'sin especificar'}`
              : (mv.note || 'sin nombre');

            return {
              id: mv.client_op_id || String(m.id),
              item_id: pr.client_id || '',
              nombre: productName || '(sin nombre)',
              categoria: pr.category_id,
              unidad: 'und',
              cantidad: delta,
              ts: mv.occurred_at || new Date().toISOString(),
              contado_por,
              deleted_at: null,
            };
          });
          fromCloud = true;
        }
      }
    } catch (e) { /* sin conexión, usamos local */ }
  }

  // Si no se pudo cargar desde la nube, usar logs locales
  if (!fromCloud) {
    logs = store.activeLogs();
  } else {
    logs = logs.filter(l => !l.deleted_at);
    // Si la nube no devolvió nada, combinar con logs locales
    if (logs.length === 0) {
      logs = store.activeLogs();
    }
  }

  // Un coordinador solo ve movimientos de su propia área (misma regla de
  // visibilidad que el catálogo, ver store.js#visibleItems()); admin y el
  // coordinador de "General" (auth.isGeneral()) ven todo.
  if (auth.isCoordinador() && !auth.isGeneral()) {
    const area = auth.area();
    logs = logs.filter(l => String(l.categoria) === String(area));
  }

  logs = logs.sort((a, b) => (a.ts < b.ts ? 1 : -1));

  if (!logs.length) {
    rootEl.innerHTML = `
      <div class="reg-wrap"><div class="reg-empty">
        <svg width="46" height="46" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.25"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 13l2 2 4-4"/></svg>
        <div class="reg-empty-t">Sin registros todavía</div>
        <div class="reg-empty-s">Cada cantidad que cuentes aparecerá aquí, agrupada por día.</div>
      </div></div>`;
    return;
  }

  // Agrupar por día local
  const byDay = {};
  for (const l of logs) {
    const d = localDate(l.ts);
    (byDay[d] ||= []).push(l);
  }
  const days = Object.keys(byDay).sort().reverse();
  const today = localDate(new Date());

  let html = '<div class="reg-wrap">';
  for (const d of days) {
    const recs = byDay[d];
    const totalPos = recs.reduce((s, r) => s + Math.max(0, r.cantidad), 0);
    const badge = d === today ? '<span class="reg-day-badge">Hoy</span>' : '';
    html += `
      <div class="reg-day">
        <div class="reg-day-head">
          <span class="reg-day-name">${_fmtDayLong(d)}${badge}</span>
          <span class="reg-day-sum">${recs.length} registro${recs.length!==1?'s':''} · +${totalPos.toLocaleString('es-VE')}</span>
        </div>
        <div class="reg-list">
          ${recs.map(_rowHTML).join('')}
        </div>
      </div>`;
  }
  html += '</div>';
  rootEl.innerHTML = html;

  rootEl.querySelectorAll('.reg-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const fallback = {
        item_id: btn.dataset.itemId,
        nombre: btn.dataset.nombre,
        categoria: btn.dataset.categoria,
        cantidad: parseInt(btn.dataset.qty, 10),
        contado_por: btn.dataset.by,
        ts: btn.dataset.ts
      };
      btn.disabled = true;
      await store.deleteLog(id, fallback);
      toast.ok('Registro borrado.');
      await renderRegistro(_root);
    });
  });
}

function _rowHTML(r) {
  const neg = r.cantidad < 0;
  const col = catColor(r.categoria);
  return `
    <div class="reg-row">
      <div class="reg-time">${_fmtTime(r.ts)}</div>
      <div class="reg-dot" style="background:${col}"></div>
      <div class="reg-info">
        <div class="reg-name">${escHtml(r.nombre)}</div>
        <div class="reg-meta">${escHtml(r.contado_por || 'sin nombre')}${r.cantidad === 0 ? ' · confirmó 0' : ''}</div>
      </div>
      <div class="reg-qty ${neg ? 'neg' : ''}">${neg ? '' : '+'}${r.cantidad.toLocaleString('es-VE')}</div>
      ${auth.canEditInventory() ? `
      <button
        class="reg-del"
        data-id="${escHtml(r.id)}"
        data-item-id="${escHtml(r.item_id)}"
        data-nombre="${escHtml(r.nombre)}"
        data-categoria="${escHtml(r.categoria)}"
        data-qty="${r.cantidad}"
        data-by="${escHtml(r.contado_por || 'sin nombre')}"
        data-ts="${escHtml(r.ts)}"
        title="Corregir / borrar"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
      </button>` : ''}
    </div>`;
}
