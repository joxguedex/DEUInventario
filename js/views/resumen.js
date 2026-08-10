// ── Vista de Resumen ──────────────────────────────────────
// Tres subpestañas:
//  · General:   progreso global, desglose por categoría, exportar a Excel
//                (contenido original de esta vista, sin cambios).
//  · Ingresos:  total histórico recibido, desglose por área (desplegable:
//                cada área lista sus productos recibidos, con un botón de
//                lupa que precarga el buscador con ese producto), top de
//                productos, buscador con bitácora por producto y exportes a
//                Excel (productos agregados / bitácora completa) — solo
//                cuenta lo migrado del historial viejo o lo recibido por
//                Recepción en AcopioUCV (misma tabla `movements`, mismo
//                criterio de nota que usa AcopioUCV/js/views/ingresos.js
//                para no inflar esto con cada conteo/ingreso propio de
//                Inventario).
//  · Egresos:   placeholder, se implementa más adelante.

import { store } from '../store.js';
import { sync }  from '../sync.js';
import { auth }  from '../auth.js';
import { escHtml, normSearch, catIcon, catLabel, catColor, localDate } from '../helpers.js';
import { toast } from '../components/toast.js';
import { requireCoord } from './admin.js';
import { SUPABASE_URL } from '../config.js';
import { DB_SCHEMA } from '../env-config.js';

// Orden de categorías: alfabético por nombre, ya no hay un orden fijo (ver
// conteo.js#_catOrder, mismo criterio — las categorías son dinámicas).
function _catOrder() {
  return [...store.categories].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(c => String(c.id));
}
function _catRank(id) { return _catOrder().indexOf(String(id)); }

let _root = null;
let _tab  = 'general'; // 'general' | 'ingresos' | 'egresos'

export function renderResumen(rootEl) {
  _root = rootEl;
  rootEl.innerHTML = `
    <div class="rsm-shell">
      <div class="rsm-subtabs">
        <button class="rsm-subtab" data-tab="general">General</button>
        <button class="rsm-subtab" data-tab="ingresos">Ingresos</button>
        <button class="rsm-subtab" data-tab="egresos">Egresos</button>
      </div>
      <div class="rsm-content" id="rsm-content"></div>
    </div>`;

  rootEl.querySelectorAll('.rsm-subtab').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.tab === _tab) return;
      _tab = b.dataset.tab;
      _paintSubtabs();
      _renderTab();
    });
  });

  _paintSubtabs();
  _renderTab();
}

function _paintSubtabs() {
  _root.querySelectorAll('.rsm-subtab').forEach(b => b.classList.toggle('active', b.dataset.tab === _tab));
}

function _renderTab() {
  const el = _root?.querySelector('#rsm-content');
  if (!el) return;
  if (_tab === 'general')       _renderGeneral(el);
  else if (_tab === 'ingresos') _renderIngresos(el);
  else                          _renderEgresos(el);
}

// ── General (contenido original) ──────────────────────────

function _renderGeneral(el) {
  const s  = store.stats();
  const bc = store.statsByCat();
  const pct = s.total ? Math.round(s.contados / s.total * 100) : 0;

  const order = _catOrder();
  const cats = order.filter(c => bc[c]).concat(Object.keys(bc).filter(c => !order.includes(c)));

  el.innerHTML = `
    <div class="rsm-wrap">
      <div class="rsm-hero">
        <div class="rsm-hero-pct">
          <svg viewBox="0 0 120 120" class="rsm-ring">
            <circle cx="60" cy="60" r="52" class="rsm-ring-bg"/>
            <circle cx="60" cy="60" r="52" class="rsm-ring-fg"
              style="stroke-dasharray:${(pct/100*326.7).toFixed(1)} 326.7"/>
          </svg>
          <div class="rsm-ring-num">${pct}<span>%</span></div>
        </div>
        <div class="rsm-hero-stats">
          <div class="rsm-stat"><div class="rsm-stat-n">${s.contados.toLocaleString('es-VE')}</div><div class="rsm-stat-l">contados</div></div>
          <div class="rsm-stat"><div class="rsm-stat-n">${s.pendientes.toLocaleString('es-VE')}</div><div class="rsm-stat-l">pendientes</div></div>
          <div class="rsm-stat"><div class="rsm-stat-n">${s.unidades.toLocaleString('es-VE')}</div><div class="rsm-stat-l">unidades</div></div>
        </div>
      </div>

      <div class="rsm-actions">
        <button class="rsm-btn rsm-btn-primary" id="rsm-export">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar a Excel
        </button>
        <button class="rsm-btn" id="rsm-export-pend">Solo pendientes</button>
        ${sync.enabled && auth.canEditInventory() ? `<button class="rsm-btn" id="rsm-cloud">Subir todo a la nube</button>` : ''}
        ${!sync.enabled ? `<span class="rsm-cloud-off">Nube sin configurar · guardado local</span>` : ''}
      </div>

      <div class="rsm-cats">
        ${cats.map(c => {
          const d = bc[c]; const p = d.total ? Math.round(d.contados/d.total*100) : 0;
          const col = catColor(c);
          return `<div class="rsm-cat">
            <div class="rsm-cat-ico" style="color:${col}">${catIcon(c)}</div>
            <div class="rsm-cat-main">
              <div class="rsm-cat-top">
                <span class="rsm-cat-name">${catLabel(c)}</span>
                <span class="rsm-cat-nums">${d.contados}/${d.total} · ${d.unidades.toLocaleString('es-VE')} und</span>
              </div>
              <div class="rsm-cat-bar"><div class="rsm-cat-fill" style="width:${p}%;background:${col}"></div></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  el.querySelector('#rsm-export')?.addEventListener('click', () => _export(false));
  el.querySelector('#rsm-export-pend')?.addEventListener('click', () => _export(true));
  el.querySelector('#rsm-cloud')?.addEventListener('click', async (e) => {
    if (!requireCoord()) return;   // acción sensible: requiere coordinador
    e.target.disabled = true; e.target.textContent = 'Subiendo…';
    const ok = await sync.pushAll(store.items);
    toast[ok ? 'ok' : 'err'](ok ? 'Conteo subido a la nube.' : 'No se pudo subir. Revisa la conexión/credenciales.');
    e.target.disabled = false; e.target.textContent = 'Subir todo a la nube';
  });
}

function _export(soloPendientes) {
  if (typeof XLSX === 'undefined') { toast.err('Librería Excel no cargada.'); return; }
  const rows = store.visibleItems()
    .filter(i => !i.deleted_at)
    .filter(i => soloPendientes ? !i.contado : true)
    .sort((a, b) =>
      (_catRank(a.categoria) - _catRank(b.categoria)) ||
      a.nombre.localeCompare(b.nombre, 'es'))
    .map(i => ({
      'ID':        i.id,
      'Insumo':    i.nombre,
      'Categoría': catLabel(i.categoria),
      'Unidad':    i.unidad,
      'Cantidad':  i.contado ? i.cantidad : '',
      'Contado':   i.contado ? 'Sí' : 'No',
      'Contado por': i.contado_por || '',
    }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch:14 },{ wch:42 },{ wch:18 },{ wch:10 },{ wch:10 },{ wch:9 },{ wch:20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `inventario-real-${soloPendientes ? 'pendientes-' : ''}${fecha}.xlsx`);
  toast.ok('Excel generado.');
}

// ── Ingresos ───────────────────────────────────────────────
// Solo cuentan como "ingreso" acá los movimientos direction=in cuya nota
// sea exactamente "Migracion historial ingresos_log" (migración del
// historial viejo) o termine en "Recepción" (registrados por Recepción en
// AcopioUCV) — mismo criterio que AcopioUCV/js/views/ingresos.js usa para
// no inflar su propio historial con cada conteo/ingreso rápido normal de
// Inventario, que jamás produce una nota con ese formato (ver
// store.js#_conTag: siempre "Nombre · Área", nunca "· Recepción" — el área
// "recepcion" está vedada de esta plataforma, ver auth.js).

function _headers() { return auth.authHeaders({ 'Accept-Profile': DB_SCHEMA }); }
const NOTE_FILTER =
  `or=(note.eq.${encodeURIComponent('Migracion historial ingresos_log')},` +
  `note.like.${encodeURIComponent('*Recepción')})`;

let _ingCache    = null;  // registros planos {item_id,nombre,categoria,cantidad,ts,note}, sin filtrar por rol
let _ingLoading  = false;
let _ingError    = null;
let _ingQuery    = '';
let _ingSelected = null;  // item_id del producto elegido en el buscador
let _ingOpenAreas = new Set(); // áreas con el desplegable abierto (persiste entre repintados)

async function _fetchIngresos() {
  const all = [];
  let cursor = 0;
  // Paginado por cursor de id: puede haber miles de movimientos migrados,
  // el límite de PostgREST por página es 1000.
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/movements?direction=eq.in&${NOTE_FILTER}&id=gt.${cursor}` +
      `&select=id,occurred_at,note,movement_items(id,qnty,products(client_id,name,category_id,unidad))` +
      `&order=id.asc&limit=1000`;
    const res = await fetch(url, { headers: _headers() });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) break;
    all.push(...rows);
    cursor = rows[rows.length - 1].id;
    if (rows.length < 1000) break;
  }

  const out = [];
  for (const mv of all) {
    if (!mv.movement_items) continue;
    for (const mi of mv.movement_items) {
      const pr = mi.products;
      if (!pr) continue;
      out.push({
        item_id:   pr.client_id || pr.name,
        nombre:    pr.name || '(sin nombre)',
        categoria: pr.category_id,
        unidad:    pr.unidad || 'und',
        cantidad:  Math.abs(mi.qnty) || 0,
        ts:        mv.occurred_at,
        note:      mv.note || '',
      });
    }
  }
  return out;
}

async function _renderIngresos(el) {
  if (!SUPABASE_URL) {
    el.innerHTML = `<div class="rsm-empty">
      <div class="rsm-empty-t">Nube sin configurar</div>
      <div class="rsm-empty-s">El historial de ingresos requiere conexión con la base de datos.</div>
    </div>`;
    return;
  }

  if (!_ingCache && !_ingError && !_ingLoading) {
    el.innerHTML = `<div class="rsm-loading">Cargando historial de ingresos…</div>`;
    _ingLoading = true;
    try {
      _ingCache = await _fetchIngresos();
      _ingError = null;
    } catch (e) {
      _ingError = e;
    } finally {
      _ingLoading = false;
    }
    // El usuario pudo cambiar de subpestaña mientras esperábamos la red.
    if (_tab !== 'ingresos' || _root?.querySelector('#rsm-content') !== el) return;
  }

  if (_ingLoading) return; // ya hay un fetch en curso (llamada re-entrante)

  if (_ingError && !_ingCache) {
    el.innerHTML = `
      <div class="rsm-empty">
        <div class="rsm-empty-t">No se pudo cargar</div>
        <div class="rsm-empty-s">Verifica tu conexión e inténtalo de nuevo.</div>
        <button class="rsm-btn" id="rsm-ing-retry" style="margin-top:14px">Reintentar</button>
      </div>`;
    el.querySelector('#rsm-ing-retry')?.addEventListener('click', () => { _ingError = null; _renderIngresos(el); });
    return;
  }

  const restricted = auth.isCoordinador() && !auth.isGeneral();
  const area = auth.area();
  const records = restricted ? _ingCache.filter(r => r.categoria === area) : _ingCache;
  const total = records.reduce((s, r) => s + r.cantidad, 0);

  // Productos agregados (base del desglose por área, el top y el buscador)
  const byProduct = new Map();
  for (const r of records) {
    if (!byProduct.has(r.item_id)) byProduct.set(r.item_id, { nombre: r.nombre, categoria: r.categoria, unidad: r.unidad, total: 0 });
    byProduct.get(r.item_id).total += r.cantidad;
  }
  const top10 = [...byProduct.values()].sort((a, b) => b.total - a.total).slice(0, 10);

  // Desglose por área — solo admin / coordinador de "General" (un
  // coordinador de área real ya está limitado a la suya, ver
  // store.js#visibleItems() y el mismo criterio en registro.js). Cada área
  // es un desplegable: al abrirlo se listan sus productos recibidos (los
  // que tienen total > 0, que es justo lo único que hay en byProduct) con
  // un botón para saltar al buscador con ese producto ya cargado.
  let areasHTML = '';
  if (!restricted) {
    const byArea = new Map();
    const byAreaProducts = new Map();
    for (const [key, p] of byProduct) {
      byArea.set(p.categoria, (byArea.get(p.categoria) || 0) + p.total);
      if (!byAreaProducts.has(p.categoria)) byAreaProducts.set(p.categoria, []);
      byAreaProducts.get(p.categoria).push({ item_id: key, ...p });
    }
    for (const arr of byAreaProducts.values()) arr.sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'));
    const order = _catOrder();
    const areas = order.filter(c => byArea.has(c)).concat([...byArea.keys()].filter(c => !order.includes(c)));
    const max = Math.max(1, ...areas.map(c => byArea.get(c)));
    areasHTML = `
      <div class="rsm-ing-section">
        <div class="rsm-ing-title">Desglose por área</div>
        <div class="rsm-cats">
          ${areas.map(c => {
            const val = byArea.get(c);
            const p = Math.round(val / max * 100);
            const col = catColor(c);
            const open = _ingOpenAreas.has(c);
            const productos = byAreaProducts.get(c) || [];
            return `<div class="rsm-ing-area${open ? ' open' : ''}" data-area="${escHtml(c)}">
              <button class="rsm-ing-area-head">
                <div class="rsm-cat-ico" style="color:${col}">${catIcon(c)}</div>
                <div class="rsm-cat-main">
                  <div class="rsm-cat-top">
                    <span class="rsm-cat-name">${catLabel(c)}</span>
                    <span class="rsm-cat-nums">${val.toLocaleString('es-VE')} und</span>
                  </div>
                  <div class="rsm-cat-bar"><div class="rsm-cat-fill" style="width:${p}%;background:${col}"></div></div>
                </div>
                <svg class="rsm-ing-area-chev" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="rsm-ing-area-body">
                ${productos.map(pr => `
                  <div class="rsm-ing-area-item">
                    <span class="rsm-ing-area-item-name">${escHtml(pr.nombre)}</span>
                    <span class="rsm-ing-area-item-qty">+${pr.total.toLocaleString('es-VE')}</span>
                    <button class="rsm-ing-area-item-btn" data-key="${escHtml(pr.item_id)}" data-nombre="${escHtml(pr.nombre)}" title="Buscar en el log">
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </button>
                  </div>`).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  el.innerHTML = `
    <div class="rsm-ing-wrap">
      <div class="rsm-ing-hero">
        <button class="rsm-ing-refresh" id="rsm-ing-refresh" title="Actualizar">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        </button>
        <div class="rsm-ing-hero-n">${total.toLocaleString('es-VE')}</div>
        <div class="rsm-ing-hero-l">unidades ingresadas${restricted ? ' en tu área' : ''}</div>
      </div>

      <div class="rsm-actions">
        <button class="rsm-btn" id="rsm-ing-export-productos">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar productos (Excel)
        </button>
        <button class="rsm-btn" id="rsm-ing-export-log">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar bitácora (Excel)
        </button>
      </div>

      ${areasHTML}

      <div class="rsm-ing-section">
        <div class="rsm-ing-title">Productos más recibidos</div>
        ${top10.length ? `
        <div class="rsm-ing-top">
          ${top10.map((p, i) => `
            <div class="rsm-ing-top-row">
              <span class="rsm-ing-top-rank">${i + 1}</span>
              <span class="rsm-ing-top-ico" style="color:${catColor(p.categoria)}">${catIcon(p.categoria)}</span>
              <span class="rsm-ing-top-name">${escHtml(p.nombre)}</span>
              <span class="rsm-ing-top-qty">+${p.total.toLocaleString('es-VE')}</span>
            </div>`).join('')}
        </div>` : `<div class="rsm-empty-s" style="padding:10px 2px">Sin ingresos registrados todavía.</div>`}
      </div>

      <div class="rsm-ing-section" id="rsm-ing-search-anchor">
        <div class="rsm-ing-title">Buscar producto</div>
        <div class="cnt-search rsm-ing-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="rsm-ing-q" placeholder="Nombre del insumo…" autocomplete="off" value="${escHtml(_ingQuery)}">
        </div>
        <div class="rsm-ing-sugg" id="rsm-ing-sugg"></div>
        <div id="rsm-ing-detail"></div>
      </div>
    </div>`;

  el.querySelector('#rsm-ing-refresh')?.addEventListener('click', () => {
    _ingCache = null; _ingError = null;
    _renderIngresos(el);
  });

  el.querySelector('#rsm-ing-export-productos')?.addEventListener('click', () => _exportIngresosProductos(byProduct));
  el.querySelector('#rsm-ing-export-log')?.addEventListener('click', () => _exportIngresosLog(records));

  el.querySelectorAll('.rsm-ing-area-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.rsm-ing-area');
      const c = wrap.dataset.area;
      if (_ingOpenAreas.has(c)) _ingOpenAreas.delete(c); else _ingOpenAreas.add(c);
      wrap.classList.toggle('open');
    });
  });

  el.querySelectorAll('.rsm-ing-area-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _ingQuery = btn.dataset.nombre;
      _ingSelected = btn.dataset.key;
      _renderTab();
      _root?.querySelector('#rsm-ing-search-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const inp = el.querySelector('#rsm-ing-q');
  const suggBox = el.querySelector('#rsm-ing-sugg');
  let t;
  inp.addEventListener('input', () => {
    _ingQuery = inp.value.trim();
    clearTimeout(t);
    t = setTimeout(() => _paintSugg(byProduct, suggBox), 120);
  });
  if (_ingQuery) _paintSugg(byProduct, suggBox);
  if (_ingSelected) _paintDetail(records, el.querySelector('#rsm-ing-detail'));
}

function _exportIngresosProductos(byProduct) {
  if (typeof XLSX === 'undefined') { toast.err('Librería Excel no cargada.'); return; }
  const rows = [...byProduct.values()]
    .sort((a, b) =>
      (_catRank(a.categoria) - _catRank(b.categoria)) ||
      a.nombre.localeCompare(b.nombre, 'es'))
    .map(p => ({
      'Insumo':    p.nombre,
      'Categoría': catLabel(p.categoria),
      'Unidad':    p.unidad,
      'Cantidad total recibida': p.total,
    }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch:42 },{ wch:24 },{ wch:10 },{ wch:22 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos recibidos');
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ingresos-productos-${fecha}.xlsx`);
  toast.ok('Excel generado.');
}

function _exportIngresosLog(records) {
  if (typeof XLSX === 'undefined') { toast.err('Librería Excel no cargada.'); return; }
  const rows = [...records]
    .sort((a, b) => (a.ts < b.ts ? 1 : -1))
    .map(r => ({
      'Insumo':    r.nombre,
      'Categoría': catLabel(r.categoria),
      'Día':       localDate(r.ts),
      'Hora':      _fmtTime(r.ts),
      'Nota':      r.note,
    }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch:38 },{ wch:24 },{ wch:12 },{ wch:10 },{ wch:36 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bitácora de ingresos');
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ingresos-bitacora-${fecha}.xlsx`);
  toast.ok('Excel generado.');
}

function _paintSugg(byProduct, box) {
  if (!_ingQuery) { box.innerHTML = ''; return; }
  const nq = normSearch(_ingQuery);
  const scored = [];
  for (const [key, p] of byProduct) {
    const n = normSearch(p.nombre);
    if (!n.includes(nq)) continue;
    scored.push([n.startsWith(nq) ? 0 : 1, key, p]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[2].nombre.localeCompare(b[2].nombre, 'es'));
  const top = scored.slice(0, 8);

  if (!top.length) {
    box.innerHTML = `<div class="rsm-empty-s" style="padding:8px 2px">Sin coincidencias.</div>`;
    return;
  }
  box.innerHTML = top.map(([, key, p]) => `
    <button class="rsm-ing-sugg-item" data-key="${escHtml(key)}">
      <span class="rsm-ing-sugg-dot" style="background:${catColor(p.categoria)}"></span>
      <span class="rsm-ing-sugg-name">${escHtml(p.nombre)}</span>
      <span class="rsm-ing-sugg-total">+${p.total.toLocaleString('es-VE')}</span>
    </button>`).join('');

  box.querySelectorAll('.rsm-ing-sugg-item').forEach(b => {
    b.addEventListener('click', () => {
      _ingSelected = b.dataset.key;
      _renderTab();
    });
  });
}

function _paintDetail(records, el) {
  if (!el) return;
  const matches = records.filter(r => r.item_id === _ingSelected);
  if (!matches.length) { el.innerHTML = ''; return; }

  const total = matches.reduce((s, r) => s + r.cantidad, 0);
  const nombre = matches[0].nombre;

  const byDay = {};
  for (const r of matches) (byDay[localDate(r.ts)] ||= []).push(r);
  const days = Object.keys(byDay).sort().reverse();

  el.innerHTML = `
    <div class="rsm-ing-detail-head">
      <div>
        <div class="rsm-ing-detail-name">${escHtml(nombre)}</div>
        <div class="rsm-ing-detail-sub">${matches.length} movimiento${matches.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="rsm-ing-detail-total">+${total.toLocaleString('es-VE')}<span>und totales</span></div>
    </div>
    <div class="reg-wrap">
      ${days.map(d => {
        const recs = [...byDay[d]].sort((a, b) => (a.ts < b.ts ? 1 : -1));
        const sum = recs.reduce((s, r) => s + r.cantidad, 0);
        return `<div class="reg-day">
          <div class="reg-day-head">
            <span class="reg-day-name">${_fmtDayLong(d)}</span>
            <span class="reg-day-sum">${recs.length} registro${recs.length !== 1 ? 's' : ''} · +${sum.toLocaleString('es-VE')}</span>
          </div>
          <div class="reg-list">
            ${recs.map(r => `
              <div class="reg-row">
                <div class="reg-time">${_fmtTime(r.ts)}</div>
                <div class="reg-dot" style="background:${catColor(r.categoria)}"></div>
                <div class="reg-info">
                  <div class="reg-name">${escHtml(r.nombre)}</div>
                  <div class="reg-meta">${escHtml(r.note || 'Recepción')}</div>
                </div>
                <div class="reg-qty">+${r.cantidad.toLocaleString('es-VE')}</div>
              </div>`).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function _fmtDayLong(iso) {
  const dias  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const [y, m, d] = iso.split('-');
  const dt = new Date(iso + 'T12:00:00');
  return `${dias[dt.getDay()]}, ${parseInt(d)} de ${meses[parseInt(m) - 1]}`;
}
function _fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}

// ── Egresos (placeholder) ─────────────────────────────────

function _renderEgresos(el) {
  el.innerHTML = `
    <div class="rsm-empty">
      <svg width="46" height="46" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.25"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M12 11v6M9 14h6"/></svg>
      <div class="rsm-empty-t">Próximamente</div>
      <div class="rsm-empty-s">El desglose de egresos se habilitará más adelante.</div>
    </div>`;
}
