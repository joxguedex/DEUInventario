// ── Vista de Egresos — desglose diario de entregas ────────
// Copia el formato de views/ingresos.js (mismo layout de tarjetas por día +
// modal de detalle), pero la fuente de datos es comanda_items/comandas en
// vez de movement_items/movements: cada Egreso Rápido genera una comanda
// (origen='rapida', ver egresorapido.js) y comanda_items ya trae
// producto/cantidad denormalizados sin necesitar reconstruir el tag de
// movements.note. comandas.notas es el "Destino" de texto libre que el
// usuario escribe al armar el egreso (reemplazó al selector de Solicitante,
// ver egresorapido.js) — es el dato central de este reporte, por eso se
// muestra en el detalle de cada registro.

import { auth } from '../auth.js';
import { escHtml, catColor, catLabel } from '../helpers.js';
import { toast } from '../components/toast.js';
import { SUPABASE_URL } from '../config.js';
import { DB_SCHEMA } from '../env-config.js';

function _headers() { return auth.authHeaders({ 'Accept-Profile': DB_SCHEMA }); }

let _root = null;
let _cache = null; // Array<logEntry> | null — null = todavía no cargado esta sesión
let _loading = null;

function _fmtDateLong(iso) {
  const [y, m, d] = iso.split('-');
  const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const dt = new Date(iso + 'T12:00:00');
  return { dia: dias[dt.getDay()], fecha: `${parseInt(d)} de ${meses[parseInt(m)-1]} de ${y}` };
}
function _fmtDateShort(iso) {
  const [y, m, d] = iso.split('-');
  const M = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${M[parseInt(m)-1]}`;
}
function _fmtTime(ts) { return new Date(ts).toLocaleTimeString('es-VE', { hour:'2-digit', minute:'2-digit' }); }
function _localDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

export function renderEgresos(rootEl) {
  _root = rootEl;
  if (_cache === null) {
    if (!_loading) _loading = _fetchAll();
    _root.innerHTML = `<div class="ing-diary-wrap"><div class="ing-diary-loading">Cargando historial…</div></div>`;
    _loading.then(() => _render());
    return;
  }
  _render();
}

// Refresca desde el servidor (llamado por app.js tras un Egreso Rápido y en
// cada ciclo de sync) — no bloquea si la pestaña no está abierta.
export async function refreshEgresos() {
  await _fetchAll();
  if (_root) _render();
}

async function _fetchAll() {
  try {
    const all = [];
    let from = 0; const limit = 1000;
    for (;;) {
      const url = `${SUPABASE_URL}/rest/v1/comanda_items`
        + `?select=id,cantidad,unidad,producto,producto_id,comandas!inner(id,created_at,notas,origen),products(category_id,client_id)`
        + `&comandas.origen=eq.rapida`
        + `&order=id.desc&limit=${limit}`;
      const res = await fetch(url, { headers: _headers({ Range: `${from}-${from + limit - 1}` }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      if (!Array.isArray(rows) || !rows.length) break;
      all.push(...rows);
      if (rows.length < limit) break;
      from += limit;
    }

    let logs = all.map(ci => {
      const cm = ci.comandas || {};
      const pr = ci.products || {};
      return {
        id: String(ci.id),
        item_id: pr.client_id || '',
        nombre: ci.producto || '(sin nombre)',
        categoria: pr.category_id,
        cantidad: Number(ci.cantidad) || 0,
        ts: cm.created_at,
        date: _localDate(cm.created_at),
        destino: (cm.notas || '').trim(),
      };
    });

    if (auth.isCoordinador() && !auth.isGeneral()) {
      const area = auth.area();
      logs = logs.filter(l => String(l.categoria) === String(area));
    }

    _cache = logs;
  } catch (e) {
    console.error('[egresos] carga falló', e);
    if (_cache === null) { _cache = []; toast.err('No se pudo cargar el historial de egresos'); }
  } finally {
    _loading = null;
  }
}

function _render() {
  if (!_root) return;
  const logs = _cache || [];

  const today     = _localDate(new Date());
  const yesterday = _localDate(new Date(Date.now() - 864e5));

  const byDate = {};
  for (const r of logs) (byDate[r.date] ||= []).push(r);
  const dates = Object.keys(byDate).sort().reverse();

  // ── Estadísticas generales (antes del desglose por día) ──
  const totalRegistros = logs.length;
  const totalUnidades  = logs.reduce((s, r) => s + (r.cantidad || 0), 0);
  const insumosUnicos  = new Set(logs.map(r => r.item_id || r.nombre)).size;
  const promedioDiario = dates.length ? Math.round(totalUnidades / dates.length) : 0;

  const statsHTML = `
    <div class="ing-stats-row">
      <div class="ing-stat"><div class="ing-stat-n">${totalUnidades.toLocaleString('es-VE')}</div><div class="ing-stat-l">unidades entregadas</div></div>
      <div class="ing-stat"><div class="ing-stat-n">${totalRegistros.toLocaleString('es-VE')}</div><div class="ing-stat-l">registros</div></div>
      <div class="ing-stat"><div class="ing-stat-n">${insumosUnicos.toLocaleString('es-VE')}</div><div class="ing-stat-l">insumos distintos</div></div>
      <div class="ing-stat"><div class="ing-stat-n">${promedioDiario.toLocaleString('es-VE')}</div><div class="ing-stat-l">unidades / día</div></div>
    </div>`;

  if (!dates.length) {
    _root.innerHTML = `
    <div class="ing-diary-wrap">
      ${statsHTML}
      <div class="ing-diary-empty">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:.25;margin-bottom:16px">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
        <div style="font-size:15px;font-weight:600;color:var(--t2);margin-bottom:6px">Sin egresos registrados</div>
        <div style="font-size:13px;color:var(--t4)">Lo que se registre en Egreso Rápido aparecerá aquí agrupado por día.</div>
      </div>
    </div>`;
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'ing-diary-wrap';
  wrap.innerHTML = `
    ${statsHTML}
    <div class="ing-diary-header">
      <div class="ing-diary-header-info">
        <div class="ing-diary-header-title">Historial de entregas</div>
        <div class="ing-diary-header-sub">${dates.length} día${dates.length !== 1 ? 's' : ''} registrados · ${totalUnidades.toLocaleString('es-VE')} unidades totales</div>
      </div>
    </div>
    <div class="ing-diary-grid" id="egr-diary-grid"></div>`;

  _root.innerHTML = '';
  _root.appendChild(wrap);
  const grid = wrap.querySelector('#egr-diary-grid');

  for (const d of dates) {
    const recs  = byDate[d];
    const total = recs.reduce((s, r) => s + (r.cantidad || 0), 0);
    const isToday = d === today;
    const isYest  = d === yesterday;

    const topMap = {};
    for (const r of recs) {
      const k = r.item_id || r.nombre;
      (topMap[k] ||= { nombre: r.nombre, categoria: r.categoria, total: 0 }).total += r.cantidad || 0;
    }
    const top3 = Object.values(topMap).sort((a, b) => b.total - a.total).slice(0, 3);

    const ts = recs.map(r => r.ts).filter(Boolean).sort();
    const tFirst = ts[0] ? _fmtTime(ts[0]) : '';
    const tLast  = ts.at(-1) ? _fmtTime(ts.at(-1)) : '';
    const timeStr = tFirst && tLast && tFirst !== tLast ? `${tFirst} – ${tLast}` : tFirst;

    const badge = isToday ? '<span class="ing-day-badge ing-day-badge-today">Hoy</span>'
                : isYest  ? '<span class="ing-day-badge ing-day-badge-ayer">Ayer</span>' : '';

    const destinos = [...new Set(recs.map(r => r.destino).filter(Boolean))];
    const destinoStr = destinos.length
      ? (destinos.length === 1 ? destinos[0] : `${destinos.length} destinos`)
      : '';

    const card = document.createElement('div');
    card.className = `ing-diary-card${isToday ? ' ing-diary-card-today' : ''}`;
    card.innerHTML = `
    <div class="idc-top">
      <div class="idc-date-block">
        <div class="idc-dayname">${_fmtDateLong(d).dia}${badge}</div>
        <div class="idc-datenum">${_fmtDateShort(d)}</div>
      </div>
      <div class="idc-total-block">
        <div class="idc-total" style="color:var(--red)">-${total.toLocaleString('es-VE')}</div>
        <div class="idc-total-lbl">unidades</div>
      </div>
    </div>
    <div class="idc-meta">${recs.length} registro${recs.length !== 1 ? 's' : ''}${timeStr ? ` · ${timeStr}` : ''}${destinoStr ? ` · ${escHtml(destinoStr)}` : ''}</div>
    <div class="idc-top3">
      ${top3.map(it => `
      <div class="idc-item">
        <div class="idc-item-dot" style="background:${catColor(it.categoria)}"></div>
        <div class="idc-item-name">${escHtml(it.nombre)}</div>
        <div class="idc-item-qty" style="color:var(--red)">-${it.total.toLocaleString('es-VE')}</div>
      </div>`).join('')}
    </div>
    <div class="idc-foot">Ver detalle completo →</div>`;

    card.addEventListener('click', () => _showDetail(d, recs, isToday, isYest));
    grid.appendChild(card);
  }
}

function _showDetail(date, records, isToday, isYest) {
  const total = records.reduce((s, r) => s + (r.cantidad || 0), 0);

  const byItem = {};
  for (const r of records) {
    const k = r.item_id || r.nombre;
    (byItem[k] ||= { nombre: r.nombre, categoria: r.categoria, total: 0, entries: [] }).entries.push(r);
    byItem[k].total += r.cantidad || 0;
  }
  const items = Object.values(byItem).sort((a, b) => b.total - a.total);
  const max = items[0]?.total || 1;
  const timeline = [...records].filter(r => r.ts).sort((a, b) => b.ts.localeCompare(a.ts));
  const { dia, fecha } = _fmtDateLong(date);
  const label = isToday ? 'Hoy' : isYest ? 'Ayer' : '';
  const cats = [...new Set(records.map(r => r.categoria).filter(v => v != null))];

  let ov = document.getElementById('egr-day-modal');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'egr-day-modal';
    ov.className = 'modal-ov';
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  }

  ov.innerHTML = `
  <div class="idm-box">
    <div class="idm-hero">
      <div class="idm-hero-left">
        <div class="idm-hero-day">${label ? `<span class="idm-badge">${label}</span>` : ''} ${dia}</div>
        <div class="idm-hero-date">${fecha}</div>
        <div class="idm-hero-cats">
          ${cats.map(c => `<span class="idm-cat-pill" style="background:${catColor(c)}22;border-color:${catColor(c)}44;color:${catColor(c)}">${escHtml(catLabel(c))}</span>`).join('')}
        </div>
      </div>
      <div class="idm-hero-actions">
        <button class="idm-export-btn" id="idm-export-day">
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Excel
        </button>
        <button class="idm-close" data-close="egr-day-modal">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <div class="idm-stats-row">
      <div class="idm-stat"><div class="idm-stat-n">${total.toLocaleString('es-VE')}</div><div class="idm-stat-l">unidades totales</div></div>
      <div class="idm-stat-div"></div>
      <div class="idm-stat"><div class="idm-stat-n">${items.length}</div><div class="idm-stat-l">tipos de insumo</div></div>
      <div class="idm-stat-div"></div>
      <div class="idm-stat"><div class="idm-stat-n">${records.length}</div><div class="idm-stat-l">registros</div></div>
    </div>

    <div class="idm-body">
      <div class="idm-section">
        <div class="idm-section-title">Lo más egresado</div>
        <div class="idm-bars">
          ${items.map((it, i) => {
            const w = Math.round(it.total / max * 100);
            return `<div class="idm-bar-row">
              <div class="idm-bar-rank">${i + 1}</div>
              <div class="idm-bar-info">
                <div class="idm-bar-name">${escHtml(it.nombre)}</div>
                <div class="idm-bar-track"><div class="idm-bar-fill" style="width:${w}%;background:var(--red)"></div></div>
              </div>
              <div class="idm-bar-qty" style="color:var(--red)">-${it.total.toLocaleString('es-VE')}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      ${timeline.length ? `
      <div class="idm-section">
        <div class="idm-section-title">Registro por hora</div>
        <div class="idm-timeline">
          ${timeline.map(r => `
            <div class="idm-tl-row">
              <div class="idm-tl-time">${_fmtTime(r.ts)}</div>
              <div class="idm-tl-dot" style="background:${catColor(r.categoria)}"></div>
              <div class="idm-tl-info">
                <div class="idm-tl-name">${escHtml(r.nombre)}</div>
                <div class="idm-tl-cat">Destino: ${r.destino ? escHtml(r.destino) : '—'}</div>
              </div>
              <div class="idm-tl-qty" style="color:var(--red)">-${(r.cantidad || 0).toLocaleString('es-VE')}</div>
            </div>`).join('')}
        </div>
      </div>` : ''}
    </div>
  </div>`;

  ov.classList.add('open');
  ov.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => ov.classList.remove('open')));
  ov.querySelector('#idm-export-day')?.addEventListener('click', e => { e.stopPropagation(); _exportDay(date, records); });
}

function _exportDay(date, records) {
  if (typeof XLSX === 'undefined') { toast.err('Librería Excel no cargada.'); return; }
  const rows = [...records]
    .sort((a, b) => (a.ts || '') < (b.ts || '') ? -1 : 1)
    .map(r => ({
      'Fecha': date,
      'Hora': r.ts ? new Date(r.ts).toLocaleTimeString('es-VE', { hour:'2-digit', minute:'2-digit' }) : '',
      'Producto': r.nombre || '',
      'Categoría': catLabel(r.categoria),
      'Cantidad': r.cantidad || 0,
      'Destino': r.destino || '',
    }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch:12 },{ wch:8 },{ wch:40 },{ wch:16 },{ wch:10 },{ wch:30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Egresos');
  XLSX.writeFile(wb, `egresos-${date}.xlsx`);
  toast.ok('Excel generado.');
}
