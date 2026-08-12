// ── Vista de Historial (log de movimientos) ────────────────
// Historial cronológico de cada movimiento (Recepción/Conteo/Egreso),
// agrupado por día y filtrable por tipo. Permite borrar/corregir un
// registro (revierte el delta sobre el insumo).

import { store } from '../store.js';
import { auth } from '../auth.js';
import { escHtml, catColor, localDate } from '../helpers.js';
import { toast } from '../components/toast.js';
import { SUPABASE_URL } from '../config.js';
import { DB_SCHEMA } from '../env-config.js';

let _root = null;
let _allLogs = [];       // último set cargado/filtrado por área, sin filtrar por tipo
let _filtroTipo = 'todos'; // 'todos' | 'Recepción' | 'Conteo' | 'Egreso'
let _scrollToDay = null; // fecha 'YYYY-MM-DD' pendiente de enfocar (ver focusRegistro)

// Días desplegados — null hasta el primer _paint(), momento en que arranca
// con solo "hoy" abierto (el resto colapsado, para ubicar un día más rápido
// sin desplazarse por todo el historial). Persiste durante la sesión: no se
// reinicia entre repintados (cambio de filtro, borrar un registro) ni al
// volver a entrar a la pestaña, solo al recargar la página.
let _expandedDays = null;

// Llamado desde app.js tras nav('registro') cuando se llega acá con la
// flecha "Ver en Historial" de una tarjeta de Ingresos/Egresos — preselecciona
// el filtro de tipo y desplaza hasta el grupo del día correspondiente, para
// poder ubicar y borrar/corregir el registro puntual sin tener que buscarlo
// a mano entre todos los días.
export function focusRegistro(tipo, date) {
  if (tipo) _filtroTipo = tipo;
  _scrollToDay = date || null;
  _paint();
}

function _headers() { return auth.authHeaders({ 'Accept-Profile': DB_SCHEMA }); }

const TIPOS = ['Recepción', 'Conteo', 'Egreso'];

// movements.note (o el `origen` de un log local todavía sin sincronizar,
// ver store.js#registrar) siempre termina en " - <Tipo>" — ver
// actor_note() / apply_count / create_comanda_rapida en
// supabase/new-project-schema.sql §8/§9/§9b.
function _splitNote(note, origenLocal) {
  for (const t of TIPOS) {
    if (note && note.endsWith(` - ${t}`)) {
      return { quien: note.slice(0, -(t.length + 3)), tipo: t };
    }
  }
  // Log local todavía sin subir: movements.note aún no existe, se infiere
  // del origen que ya viene marcado en el propio log (ver store.js).
  if (origenLocal) return { quien: note || 'sin nombre', tipo: origenLocal === 'ingreso' ? 'Recepción' : 'Conteo' };
  return { quien: note || 'sin nombre', tipo: null };
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
          logs = data.map(m => {
            const mv = m.movements || {};
            const pr = m.products || {};
            const delta = mv.direction === 'in' ? Math.abs(m.qnty) : -Math.abs(m.qnty);
            const { quien, tipo } = _splitNote(mv.note);

            return {
              id: mv.client_op_id || String(m.id),
              item_id: pr.client_id || '',
              nombre: pr.name || '(sin nombre)',
              categoria: pr.category_id,
              unidad: 'und',
              cantidad: delta,
              ts: mv.occurred_at || new Date().toISOString(),
              contado_por: quien,
              tipo,
              deleted_at: null,
            };
          });
          fromCloud = true;
        }
      }
    } catch (e) { /* sin conexión, usamos local */ }
  }

  if (!fromCloud) {
    logs = store.activeLogs().map(l => {
      const { quien, tipo } = _splitNote(l.contado_por, l.origen);
      return { ...l, contado_por: quien, tipo };
    });
  } else {
    logs = logs.filter(l => !l.deleted_at);
    if (logs.length === 0) logs = store.activeLogs().map(l => {
      const { quien, tipo } = _splitNote(l.contado_por, l.origen);
      return { ...l, contado_por: quien, tipo };
    });
  }

  // Un coordinador solo ve movimientos de su propia área (misma regla de
  // visibilidad que el catálogo, ver store.js#visibleItems()); admin y el
  // coordinador de "General" (auth.isGeneral()) ven todo.
  if (auth.isCoordinador() && !auth.isGeneral()) {
    const area = auth.area();
    logs = logs.filter(l => String(l.categoria) === String(area));
  }

  _allLogs = logs.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  _paint();
}

function _paint() {
  if (!_root) return;
  const logs = _filtroTipo === 'todos' ? _allLogs : _allLogs.filter(l => l.tipo === _filtroTipo);

  const filtros = `
    <div class="cnt-filters" id="reg-filters">
      <button class="cnt-fbtn ${_filtroTipo === 'todos' ? 'active' : ''}" data-tipo="todos">Todos</button>
      ${TIPOS.map(t => `<button class="cnt-fbtn ${_filtroTipo === t ? 'active' : ''}" data-tipo="${t}">${t}</button>`).join('')}
    </div>`;

  if (!logs.length) {
    _root.innerHTML = `
      <div class="reg-wrap">
        ${filtros}
        <div class="reg-empty">
          <svg width="46" height="46" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.25"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 13l2 2 4-4"/></svg>
          <div class="reg-empty-t">Sin registros${_filtroTipo !== 'todos' ? ` de ${_filtroTipo}` : ''}</div>
          <div class="reg-empty-s">Cada movimiento de inventario aparecerá aquí, agrupado por día.</div>
        </div>
      </div>`;
    _wireFilters();
    return;
  }

  const byDay = {};
  for (const l of logs) {
    const d = localDate(l.ts);
    (byDay[d] ||= []).push(l);
  }
  const days = Object.keys(byDay).sort().reverse();
  const today = localDate(new Date());

  if (!_expandedDays) _expandedDays = new Set([today]);
  if (_scrollToDay) _expandedDays.add(_scrollToDay); // el día destino de "Ver en Historial" siempre se abre

  let html = `<div class="reg-wrap">${filtros}`;
  for (const d of days) {
    const recs = byDay[d];
    const totalPos = recs.reduce((s, r) => s + Math.max(0, r.cantidad), 0);
    const badge = d === today ? '<span class="reg-day-badge">Hoy</span>' : '';
    const open = _expandedDays.has(d);
    html += `
      <div class="reg-day${open ? ' open' : ''}" data-day="${d}">
        <div class="reg-day-head">
          <span class="reg-day-name">
            <svg class="reg-day-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            ${_fmtDayLong(d)}${badge}
          </span>
          <span class="reg-day-sum">${recs.length} registro${recs.length!==1?'s':''} · +${totalPos.toLocaleString('es-VE')}</span>
        </div>
        <div class="reg-list">
          ${recs.map(_rowHTML).join('')}
        </div>
      </div>`;
  }
  html += '</div>';
  _root.innerHTML = html;
  _wireFilters();
  _wireDays();

  if (_scrollToDay) {
    const day = _scrollToDay;
    _scrollToDay = null;
    requestAnimationFrame(() => {
      _root.querySelector(`.reg-day[data-day="${day}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  _root.querySelectorAll('.reg-del').forEach(btn => {
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

function _wireFilters() {
  _root.querySelectorAll('#reg-filters .cnt-fbtn').forEach(b => {
    b.addEventListener('click', () => {
      _filtroTipo = b.dataset.tipo;
      _paint();
    });
  });
}

// Despliega/colapsa el grupo de un día al tocar su encabezado — solo alterna
// clases en el DOM (no repinta) para no perder scroll ni relanzar la carga.
function _wireDays() {
  _root.querySelectorAll('.reg-day').forEach(dayEl => {
    dayEl.querySelector('.reg-day-head')?.addEventListener('click', () => {
      const d = dayEl.dataset.day;
      const open = dayEl.classList.toggle('open');
      if (open) _expandedDays.add(d); else _expandedDays.delete(d);
    });
  });
}

const TIPO_TAG = { 'Recepción': 'tag-blue', 'Conteo': 'tag-amber', 'Egreso': 'tag-red' };

function _rowHTML(r) {
  const neg = r.cantidad < 0;
  const col = catColor(r.categoria);
  return `
    <div class="reg-row">
      <div class="reg-time">${_fmtTime(r.ts)}</div>
      <div class="reg-dot" style="background:${col}"></div>
      <div class="reg-info">
        <div class="reg-name">${escHtml(r.nombre)} ${r.tipo ? `<span class="tag ${TIPO_TAG[r.tipo] || 'tag-gray'}" style="margin-left:4px">${r.tipo}</span>` : ''}</div>
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
