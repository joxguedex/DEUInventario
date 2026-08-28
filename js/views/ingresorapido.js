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
import { sync } from '../sync.js';
import { db } from '../db.js';
import { auth } from '../auth.js';
import { SUPABASE_URL } from '../config.js';
import { DB_SCHEMA } from '../env-config.js';
import { openPanel as openAdminPanel } from './admin.js';
import { escHtml, normSearch, catIcon, catLabel, catColor } from '../helpers.js';
import { toast } from '../components/toast.js';
import { confirmDialog } from '../components/confirm.js';

const UNIDADES  = ['und','paquetes','cajas','bolsas','litros','kg','piezas'];

// Categorías disponibles para el <select> de "crear insumo nuevo": todas
// (admin) o solo la propia (coordinador) — ordenadas por nombre, ya no hay
// un orden fijo (ver views/admin.js, categorías dinámicas).
function _catOptions() {
  const all = [...store.categories].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return auth.isCoordinador() ? all.filter(c => String(c.id) === String(auth.area())) : all;
}

let _shell = null;  // <aside id="ingresorapido"> — abre/cierra la hoja móvil (compartido con Egreso)
let _host = null;   // <div id="qa-panel-ingreso"> — donde se pinta este panel
let _footEl = null; // <div id="qa-shell-foot"> — pie compartido (nombre + herramientas admin), NO se
                     // oculta al alternar a Egreso: ver app.js#_setQaMode, que solo cambia qué panel
                     // de contenido se ve, no el pie.
let _onAdded = null;
let _sel = null;   // insumo seleccionado
let _new = null;   // { nombre, categoria?, unidad?, umbral?, umbralMax?, reused? } modo crear

// Catálogo compartido: productos ya usados por OTROS grupos en las mismas
// categorías que mi grupo (store.categories) — permite sugerirlos como
// "adoptar" en vez de crear un duplicado. Se recarga al abrir el panel, al
// cambiar de grupo/re-loguear (resetIngresoRapido(), ver app.js) y en cada
// ciclo de sync (más abajo) — best-effort, sin bloquear: una sugerencia
// levemente desactualizada no es un problema de INTEGRIDAD (si dos grupos
// crean el mismo insumo casi a la vez de todos modos, add_product_to_grupo
// resuelve la carrera del lado del servidor sin duplicar la fila — ver el
// catch de unique_violation ahí, fix 2026-08-29), solo de UX: mientras más
// fresca esté, más frecuente que el segundo grupo vea "adoptar" en vez de
// "crear" para el mismo nombre.
let _catalogCache = [];
async function _loadCatalogCache() {
  if (!navigator.onLine) return;
  const ids = store.categories.map(c => c.id);
  if (!ids.length) { _catalogCache = []; return; }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?category_id=in.(${ids.join(',')})&deleted_at=is.null&select=client_id,name,unidad,category_id,umbral,umbral_max`,
      { headers: auth.authHeaders({ 'Accept-Profile': DB_SCHEMA }) }
    );
    if (res.ok) _catalogCache = await res.json();
  } catch { /* sin red: se queda con lo último cargado */ }
}

// sync.onChange dispara en cada ciclo (automático cada 30s, o antes por
// Realtime si products/inventory cambia en cualquier grupo) — recargar acá
// mantiene la sugerencia "usados por otros grupos" al día casi en vivo sin
// necesitar un timer propio.
sync.onChange(() => { _loadCatalogCache(); });

export function renderIngresoRapido(shellEl, opts = {}) {
  _shell = shellEl;
  _host = shellEl.querySelector('#qa-panel-ingreso') || shellEl;
  _footEl = shellEl.querySelector('#qa-shell-foot');
  _onAdded = opts.onAdded || null;
  // Si no hay nombre guardado manualmente, usar el nombre de la cuenta con sesión
  if (!store.contadorNombre && auth.name()) {
    store.setContador(auth.name());
  }
  _paint();
  _paintFoot();
  _loadCatalogCache();
}

// Cierra el panel a estado buscador (usado al cerrar la hoja móvil) y
// refresca el pie (nombre del contador puede haber cambiado, ver app.js).
// También recarga el catálogo compartido (_loadCatalogCache): app.js la
// llama tras un login fresco (store.categories recién quedó al día — antes
// _loadCatalogCache() solo corría UNA vez en boot(), casi siempre ANTES de
// que hubiera sesión, y la caché de "usados por otros grupos" se quedaba
// vacía para siempre) y tras cambiar de grupo (categorías distintas).
export function resetIngresoRapido() { _sel = null; _new = null; _paint(); _paintFoot(); _loadCatalogCache(); }

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
      ${auth.hasAdminRights() ? `
      <div class="qa-admin-tools">
        <button class="qa-tool-btn" id="qa-export-json">↓ Exportar datos (JSON)</button>
        <button class="qa-tool-btn qa-tool-blue" id="qa-refresh-local">↺ Actualizar datos locales</button>
        <button class="qa-tool-btn qa-tool-green" id="qa-export-excel">↓ Exportar inventario (Excel)</button>
        <label class="qa-tool-btn qa-tool-purple" id="qa-import-excel-lbl" style="margin:0">
          ↑ Cargar inventario (Excel)
          <input type="file" id="qa-import-excel" accept=".xlsx,.xls,.csv" style="display:none">
        </label>
        <button class="qa-tool-btn qa-tool-blue" id="qa-time-machine">🕒 Máquina del Tiempo</button>
      </div>` : ''}
    </div>`;
}

function _paint() {
  if (!_host) return;
  _host.innerHTML = _head() + `<div class="qa-body" id="qa-body">${_body()}</div>`;
  _wire();
}

function _paintFoot() {
  if (!_footEl) return;
  _footEl.innerHTML = _foot();
  if (auth.hasAdminRights()) _wireAdminTools(_footEl);
}

// super_admin sin un grupo puntual elegido ("Todos los grupos") no tiene un
// inventario concreto al que sumarle cantidad — bloquear acá en vez de dejar
// que la RPC lo rechace recién al intentar guardar (add_product_to_grupo/
// apply_count exigen p_grupo_id, ver supabase/2026-08-25-productos-
// multigrupo.sql).
function _blocked() {
  return auth.isSuperAdmin() && store.viewingGrupoId == null;
}

function _body() {
  if (_blocked()) {
    return `
      <div class="qa-hint" style="margin-top:0">Elige un grupo de extensión específico en la barra superior para usar Ingreso Rápido — con "Todos los grupos" no hay un inventario puntual al que sumarle cantidad.</div>`;
  }
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
    const opciones = _catOptions();
    // Sin categorías (propias o en general) no hay dónde clasificar un
    // insumo nuevo — bloquear la creación en vez de dejar el <select> vacío
    // (ver views/conteo.js#_openNewCategoria para crear la primera).
    if (!opciones.length) {
      return `
      <div class="qa-new">
        <div class="qa-hint">${auth.hasAdminRights()
          ? 'Todavía no hay ninguna categoría creada — crea la primera desde Insumos ("+ Nueva categoría") antes de agregar insumos.'
          : 'Todavía no hay ninguna categoría creada. Pide a un administrador que cree al menos una antes de agregar insumos.'}</div>
        <button class="qa-link" id="qa-back">← volver</button>
      </div>`;
    }
    // reused: sugerencia elegida de otro grupo (catálogo compartido) — el
    // nombre/categoría/unidad ya son los del producto real, se bloquean para
    // no crear sin querer uno distinto; solo falta la cantidad de MI grupo.
    const locked = !!_new.reused;
    return `
      <div class="qa-new">
        ${locked ? `<div class="qa-hint" style="margin-top:0">Insumo ya usado por otro grupo — se suma a tu inventario sin duplicar el catálogo.</div>` : ''}
        <input class="qa-new-name" id="qa-new-name" placeholder="Nombre del insumo…" maxlength="80" value="${escHtml(_new.nombre || '')}" ${locked ? 'disabled' : ''}>
        <div class="qa-new-row">
          <select class="qa-new-sel" id="qa-new-cat" ${auth.isCoordinador() || locked ? 'disabled' : ''}>
            ${opciones.map(c => `<option value="${c.id}" ${locked && String(c.id) === String(_new.categoria) ? 'selected' : ''}>${escHtml(c.nombre)}</option>`).join('')}
          </select>
          <select class="qa-new-sel" id="qa-new-unit" ${locked ? 'disabled' : ''}>
            ${UNIDADES.map(u => `<option value="${u}" ${locked && u === _new.unidad ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
        <input class="qa-new-name" id="qa-new-umbral" type="number" inputmode="numeric" min="0" placeholder="Umbral de alerta (mín. deseado)" value="${_new.umbral ?? 10}" ${locked ? 'disabled' : ''}>
        <input class="qa-qty" id="qa-new-qty" type="number" inputmode="numeric" min="0" placeholder="Cantidad contada">
        <button class="qa-add-btn" id="qa-new-ok">${locked ? 'Sumar a mi grupo' : 'Crear y sumar'}</button>
        <button class="qa-link" id="qa-back">← cancelar</button>
      </div>`;
  }
  return `
    <div class="qa-searchbox">
      <svg class="qa-search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input id="qa-search" placeholder="¿Qué recibiste?" autocomplete="off">
    </div>
    <div class="qa-sugg" id="qa-sugg"></div>
    <div class="qa-hint">Escribe un insumo, pon la cantidad y listo. Se puede sumar varias veces.</div>`;
}

function _wire() {
  _host.querySelector('#qa-close-m')?.addEventListener('click', () => closeSheet());
  _host.querySelector('#qa-back')?.addEventListener('click', () => { _sel = null; _new = null; _paint(); _host.querySelector('#qa-search')?.focus(); });
  if (_blocked()) return; // _body() ya pintó el aviso — sin buscador que cablear

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
      const it = await store.registrar(_sel.id, n, { origen: 'ingreso' });
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
    const okBtn = _host.querySelector('#qa-new-ok');
    if (!okBtn) return; // sin categorías: solo el botón "← volver" existe, ver _body()
    okBtn.onclick = async () => {
      const nombre = name.value.trim();
      if (!nombre) { name.focus(); return; }
      const it = await store.addNuevo({
        nombre,
        categoria: _host.querySelector('#qa-new-cat').value,
        unidad: _host.querySelector('#qa-new-unit').value,
        umbral: parseInt(_host.querySelector('#qa-new-umbral').value, 10) || 10,
        umbralMax: _new.umbralMax ?? null,
        cantidad: parseInt(_host.querySelector('#qa-new-qty').value, 10) || 0,
      });
      toast.ok(_new.reused ? `Sumado a tu grupo: ${it.nombre}` : `Creado: ${it.nombre}`);
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

  // Catálogo compartido: productos de mis categorías ya usados por OTROS
  // grupos, que mi grupo todavía no cuenta (si ya lo cuento, ya está arriba)
  // — sugerirlos evita crear un duplicado con nombre/unidad ligeramente
  // distinto (ver _loadCatalogCache).
  const mine = new Set(store.items.map(i => i.productClientId));
  const otros = _catalogCache
    .filter(p => !mine.has(p.client_id) && normSearch(p.name).includes(nq))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .slice(0, 5);

  box.innerHTML = top.map(([, it]) => `
    <button class="qa-sugg-item" data-id="${escHtml(it.id)}">
      <span class="qa-sugg-dot" style="background:${catColor(it.categoria)}"></span>
      <span class="qa-sugg-name">${escHtml(it.nombre)}</span>
      ${it.contado ? `<span class="qa-sugg-have">${it.cantidad}</span>` : ''}
    </button>`).join('') + (otros.length ? `
    <div class="qa-hint" style="margin:6px 0 2px">Usados por otros grupos:</div>` + otros.map(p => `
    <button class="qa-sugg-item" data-otro="${escHtml(p.client_id)}">
      <span class="qa-sugg-dot" style="background:${catColor(p.category_id)}"></span>
      <span class="qa-sugg-name">${escHtml(p.name)}</span>
      <span class="qa-sugg-have" title="Todavía no está en tu grupo">+ tu grupo</span>
    </button>`).join('') : '') + `
    <button class="qa-sugg-new" data-new="1">
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
      Crear “${escHtml(q)}”
    </button>`;

  box.querySelectorAll('.qa-sugg-item[data-id]').forEach(b => {
    b.onclick = () => { _sel = store.find(b.dataset.id); _paint(); };
  });
  box.querySelectorAll('.qa-sugg-item[data-otro]').forEach(b => {
    b.onclick = () => {
      const p = _catalogCache.find(x => x.client_id === b.dataset.otro);
      if (!p) return;
      _new = {
        nombre: p.name, categoria: p.category_id, unidad: p.unidad,
        umbral: p.umbral, umbralMax: p.umbral_max, reused: true,
      };
      _paint();
    };
  });
  box.querySelector('.qa-sugg-new').onclick = () => { _new = { nombre: q }; _paint(); };
}

// ── Hoja móvil (el shell es compartido: Ingreso y Egreso alternan adentro) ──
export function openSheet() {
  _shell?.classList.add('open');
  document.getElementById('qa-backdrop')?.classList.add('open');
  document.body.classList.add('qa-lock');
  setTimeout(() => _host?.querySelector('#qa-search')?.focus(), 260);
}
export function closeSheet() {
  _shell?.classList.remove('open');
  document.getElementById('qa-backdrop')?.classList.remove('open');
  document.body.classList.remove('qa-lock');
  _sel = null; _new = null; _paint();
}

// ── Herramientas admin (portadas de UCVAcopio/index.html) ──────────────
// Se cablean contra el pie compartido (_footEl), no contra _host: viven
// fuera de _paint() para no desaparecer al alternar a Egreso Rápido.
function _wireAdminTools(el) {
  el.querySelector('#qa-export-json')?.addEventListener('click', _exportJSON);
  el.querySelector('#qa-refresh-local')?.addEventListener('click', _refreshLocal);
  el.querySelector('#qa-export-excel')?.addEventListener('click', _exportExcel);
  el.querySelector('#qa-import-excel')?.addEventListener('change', _importExcel);
  el.querySelector('#qa-time-machine')?.addEventListener('click', openAdminPanel);
}

async function _exportJSON() {
  const items = await db.getAll();
  const payload = { version: 'gbsinventario_v1', exportedAt: new Date().toISOString(), items };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `gbsinventario-${new Date().toISOString().slice(0, 10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  toast.ok('Datos exportados.');
}

// Fuerza un pull completo desde el servidor (olvida el checkpoint incremental,
// ver sync.js#pullAll) — el refresco de la vista activa lo hace solo el
// sync.onChange ya suscrito en app.js, no hace falta repetirlo acá.
async function _refreshLocal() {
  if (!sync.enabled) { toast.info('Nube no configurada.'); return; }
  toast.info('Actualizando datos locales…');
  try {
    await sync.pullAll();
    toast.ok('Datos locales actualizados.');
  } catch {
    toast.err('No se pudo actualizar — revisa la conexión.');
  }
}

function _exportExcel() {
  if (typeof XLSX === 'undefined') { toast.err('Librería Excel no cargada.'); return; }
  const items = store.visibleItems().filter(i => !i.deleted_at).map(i => ({
    ID: i.id, Nombre: i.nombre, Categoría: catLabel(i.categoria),
    Cantidad: i.cantidad, Unidad: i.unidad, Umbral: i.umbral,
  }));
  if (!items.length) { toast.err('No hay insumos para exportar.'); return; }
  const ws = XLSX.utils.json_to_sheet(items);
  ws['!cols'] = [{ wch:12 },{ wch:35 },{ wch:20 },{ wch:10 },{ wch:10 },{ wch:10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  XLSX.writeFile(wb, `inventario-gbsinventario-${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast.ok('Excel generado.');
}

// Importa/actualiza insumos desde un Excel — empareja por ID (si viene) o
// por nombre+categoría, igual criterio que UCVAcopio. La columna Categoría
// se busca por NOMBRE contra store.categories (ya no es un enum fijo) — una
// fila cuya categoría no exista en la BD se descarta con error, no se
// inventa una por defecto (a diferencia de UCVAcopio, que caía a una fija).
async function _importExcel(e) {
  const input = e.target;
  if (!input.files?.length) return;
  if (typeof XLSX === 'undefined') { toast.err('Librería Excel no cargada.'); return; }
  const file = input.files[0];
  input.value = '';

  if (!store.categories.length) { toast.err('No hay categorías creadas todavía — crea al menos una antes de importar.'); return; }

  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = new Uint8Array(ev.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (!rows.length) { toast.err('El archivo está vacío o no tiene el formato correcto.'); return; }

      const first = rows[0];
      if (!('Nombre' in first || 'nombre' in first) || !('Cantidad' in first || 'cantidad' in first)) {
        toast.err('El Excel debe tener columnas: Nombre, Categoría, Cantidad, Unidad, Umbral. Usa "Exportar" para la plantilla correcta.');
        return;
      }

      const proceed = await confirmDialog({
        title: 'Cargar inventario',
        body: `Se importarán ${rows.length} insumos desde "${escHtml(file.name)}". Los que coincidan por ID o nombre+categoría se actualizan. ¿Continuar?`,
        confirmText: 'Continuar',
      });
      if (!proceed) return;

      let ok = 0, err = 0;
      for (const row of rows) {
        try {
          const nombre = String(row.Nombre || row.nombre || '').trim();
          const catNombre = String(row['Categoría'] || row.Categoria || row.categoria || '').trim();
          const cat = store.categories.find(c => c.nombre.toLowerCase() === catNombre.toLowerCase());
          const cantidad = parseInt(row.Cantidad || row.cantidad || 0, 10) || 0;
          const unidad = String(row.Unidad || row.unidad || 'und').trim() || 'und';
          const umbral = parseInt(row.Umbral || row.umbral || 0, 10) || 0;

          if (!nombre || !cat) { err++; continue; }
          await store.addNuevo({ nombre, categoria: cat.id, unidad, umbral, cantidad });
          ok++;
        } catch { err++; }
      }
      toast.ok(`Importación completada: ${ok} insumos${err ? `, ${err} con error (categoría no encontrada)` : ''}`);
      _onAdded?.(null, true);
    } catch (ex) {
      toast.err('Error leyendo el archivo: ' + (ex.message || ''));
    }
  };
  reader.readAsArrayBuffer(file);
}
