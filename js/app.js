// ── Bootstrap de la app de Inventario ─────────────────────

import { store } from './store.js';
import { sync }  from './sync.js';
import { auth }  from './auth.js';
import { db }    from './db.js';
import { checkpoints } from './checkpoints.js';
import { renderConteo, renderTop, renderList, refreshItem, syncView } from './views/conteo.js';
import { renderRegistro, focusRegistro } from './views/registro.js';
import { renderIngresos, refreshIngresos } from './views/ingresos.js';
import { renderEgresos, refreshEgresos } from './views/egresos.js';
import { renderResumen }  from './views/resumen.js';
import { renderVoluntarios } from './views/voluntarios.js';
import { renderGrupos } from './views/grupos.js';
import { renderDespachos } from './views/despachos.js';
import { renderIngresoRapido, openSheet, closeSheet, resetIngresoRapido } from './views/ingresorapido.js';
import { renderEgresoRapido, openEgreso } from './views/egresorapido.js';
import { initAdmin, renderLoginWall } from './views/admin.js';
import { initComunicados, refreshComunicados } from './views/comunicados.js';
import { modal } from './components/modal.js';
import { toast } from './components/toast.js';
import { APP_VERSION } from './version.js';
import { APP_NAME_BOLD, APP_NAME_REST, APP_TITLE } from './branding.js';

const pages = {
  conteo:   document.getElementById('page-conteo'),
  registro: document.getElementById('page-registro'),
  ingresos: document.getElementById('page-ingresos'),
  egresos:  document.getElementById('page-egresos'),
  resumen:  document.getElementById('page-resumen'),
  despachos: document.getElementById('page-despachos'),
  comunicados: document.getElementById('page-comunicados'),
  voluntarios: document.getElementById('page-voluntarios'),
  grupos: document.getElementById('page-grupos'),
};
const TITLES = {
  conteo: 'Insumos', registro: 'Historial', ingresos: 'Ingresos', egresos: 'Egresos', resumen: 'Resumen',
  despachos: 'Despachos Pendientes', comunicados: 'Comunicados y Necesidades',
  voluntarios: 'Gestión de Accesos', grupos: 'Grupos de Extensión',
};

let _current = 'resumen';

// Móvil: Ingresos/Egresos comparten un solo botón en la bottom nav (ver
// .mbn-item[data-page="movimientos"] en index.html) — _movSub recuerda cuál
// de las dos se vio último, para que el botón reabra ahí en vez de resetear
// siempre a Ingresos.
let _movSub = 'ingresos';
function _syncMovSubnav(page) {
  const bar = document.getElementById('m-subnav-mov');
  if (!bar) return;
  const isMov = page === 'ingresos' || page === 'egresos';
  bar.classList.toggle('show', isMov);
  if (isMov) {
    _movSub = page;
    bar.querySelectorAll('.m-subnav-btn').forEach(b => b.classList.toggle('active', b.dataset.subpage === page));
  }
}

// ── Switcher Ingreso/Egreso Rápido (mismo panel, ver #qa-switcher en
// index.html) — Egreso ya no tiene su propio botón/overlay; alterna dentro
// de <aside id="ingresorapido"> mostrando/ocultando #qa-panel-ingreso vs.
// #qa-panel-egreso. Por defecto siempre arranca en 'ingreso'.
let _qaMode = 'ingreso';
function _setQaMode(mode) {
  if (mode === 'ingreso' && !auth.canEditInventory()) return; // "General": solo Egreso, defensivo (ver applyRBAC)
  if (_qaMode === mode) return;
  _qaMode = mode;
  const pIngreso = document.getElementById('qa-panel-ingreso');
  const pEgreso  = document.getElementById('qa-panel-egreso');
  if (pIngreso) pIngreso.style.display = mode === 'ingreso' ? '' : 'none';
  if (pEgreso)  pEgreso.style.display  = mode === 'egreso'  ? '' : 'none';
  document.querySelectorAll('.qa-switch-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  if (mode === 'egreso') openEgreso();
}

async function nav(page) {
  _current = page;
  document.querySelectorAll('.tn-item, .mbn-item').forEach(n => {
    const p = n.dataset.page;
    n.classList.toggle('active', p === page || (p === 'movimientos' && (page === 'ingresos' || page === 'egresos')));
  });
  _syncMovSubnav(page);
  Object.entries(pages).forEach(([k, el]) => el.style.display = k === page ? 'block' : 'none');
  document.getElementById('page-title').textContent = TITLES[page] || '';

  if (page === 'conteo')   renderConteo(pages.conteo);
  if (page === 'registro') await renderRegistro(pages.registro);
  if (page === 'ingresos') renderIngresos(pages.ingresos);
  if (page === 'egresos')  renderEgresos(pages.egresos);
  if (page === 'resumen')  renderResumen(pages.resumen);
  if (page === 'despachos') renderDespachos(pages.despachos);
  if (page === 'comunicados') refreshComunicados();
  if (page === 'voluntarios') renderVoluntarios(pages.voluntarios);
  if (page === 'grupos') renderGrupos(pages.grupos, {
    onChange: _paintGrupoSwitch,
    onManage: async (id) => {
      store.setViewingGrupo(id);
      _paintGrupoSwitch();
      await store.loadCategories();
      await nav('voluntarios');
    },
  });
}

// Pinta las opciones del selector de grupo (super_admin-only) con lo que
// haya en store.grupos + "Todos los grupos", y sincroniza el valor
// seleccionado con store.viewingGrupoId (persistido, ver store.js).
function _paintGrupoSwitch() {
  const opts = `<option value="">Todos los grupos</option>` +
    store.grupos.map(g => `<option value="${g.id}">${g.nombre}</option>`).join('');
  ['grupo-switch', 'grupo-switch-m'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = opts;
    el.value = store.viewingGrupoId ?? '';
  });
}

// Cambiar de grupo solo mueve un filtro del lado del cliente (RLS ya le
// deja ver todo a un super_admin) — no hace falta re-sincronizar, alcanza
// con recargar categorías (acotadas al grupo elegido, ver
// store.js#loadCategories) y repintar la página activa.
async function _onGrupoChange(rawValue) {
  store.setViewingGrupo(rawValue === '' ? null : Number(rawValue));
  ['grupo-switch', 'grupo-switch-m'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = store.viewingGrupoId ?? '';
  });
  await store.loadCategories();
  await nav(_current);
}

function applyRBAC() {
  document.querySelectorAll('.tn-item, .mbn-item').forEach(el => { el.style.display = ''; });
  const authBtn = document.getElementById('auth-btn');
  const authBtnM = document.getElementById('auth-btn-m');
  if (authBtn) authBtn.style.display = '';
  if (authBtnM) authBtnM.style.display = '';

  // "Usuarios" (Gestión de Accesos) es admin/super_admin-only del lado del
  // servidor (voluntarios.js#renderVoluntarios ya mostraba un mensaje en vez
  // del hub para cualquier otra cuenta) — se oculta también la pestaña
  // entera acá, ya que dejarla visible sin uso real solo genera confusión.
  document.querySelectorAll('.tn-item[data-page="voluntarios"], .mbn-item[data-page="voluntarios"]')
    .forEach(el => { el.style.display = auth.hasAdminRights() ? '' : 'none'; });

  // "Grupos" (alta/gestión de grupos de extensión) es exclusivo de
  // super_admin — un admin de grupo ya tiene el suyo fijo, no hay nada que
  // gestionar acá (ver views/grupos.js).
  document.querySelectorAll('.tn-item[data-page="grupos"], .mbn-item[data-page="grupos"]')
    .forEach(el => { el.style.display = auth.isSuperAdmin() ? '' : 'none'; });

  // Selector de grupo de extensión: exclusivo de super_admin — un admin/
  // coordinador ya tiene su grupo fijo del lado del servidor, no hay nada
  // que elegir.
  ['grupo-switch', 'grupo-switch-m'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = auth.isSuperAdmin() ? '' : 'none';
  });
  if (auth.isSuperAdmin()) _paintGrupoSwitch();

  // El coordinador del área "General" solo consulta el inventario (nunca lo
  // modifica, ver auth.js#canEditInventory()): la pestaña "Ingreso Rápido"
  // del switcher se oculta entera — a diferencia de Egreso Rápido, que sí
  // conserva porque "entregar" no es "modificar el inventario propio" (genera
  // una comanda real, y General puede despachar de cualquier área). El panel
  // en sí (y el FAB móvil que lo abre) ya NO se ocultan por completo: ambos
  // modos comparten el mismo <aside>, así que ocultarlo entero le quitaría
  // también Egreso Rápido a General.
  const canEdit = auth.canEditInventory();
  const switchIngreso = document.getElementById('qa-switch-ingreso');
  const switcher = document.getElementById('qa-switcher');
  if (switchIngreso) switchIngreso.style.display = canEdit ? '' : 'none';
  if (switcher) switcher.style.display = canEdit ? '' : 'none'; // un solo modo posible: no hace falta alternar
  if (!canEdit) _setQaMode('egreso'); // fuerza salida de Ingreso si ya estaba ahí (p.ej. reasignación de área en vivo)
}

// Última cédula para la que ya se sincronizó el nombre del "contador" (pie
// del panel Ingreso Rápido) con la cuenta logueada — evita resincronizar en
// cada re-emisión de auth.onChange de la MISMA cuenta (p.ej. al reautenticar
// con el modal de confirmar contraseña), pero SÍ resincroniza al cambiar de
// cuenta en el mismo dispositivo.
let _contadorSyncCi = null;

// ¿Ya estaba logueado en la última pasada por acá? Distinto de _contadorSyncCi:
// esto detecta la TRANSICIÓN login-wall → app-shell en sí (para volver siempre
// a Conteo), sin importar si la cuenta es la misma o cambió — el modal de
// reautenticación (confirmar contraseña antes de borrar un conteo) no pasa por
// signOut() primero, así que nunca dispara esta transición.
let _wasLoggedIn = false;

export function checkAuth() {
  const loginWall = document.getElementById('login-wall');
  const appShell = document.getElementById('app-shell');

  // Defensivo: una sesión ya guardada cuyo rol/área dejó de tener acceso
  // (p.ej. un coordinador reasignado de área después de loguear) no debe
  // colarse al shell solo porque quedó en localStorage.
  if (auth.isLoggedIn() && !auth.hasPlatformAccess()) auth.signOut();

  if (!auth.isLoggedIn()) {
    _wasLoggedIn = false;
    loginWall.style.display = 'flex';
    appShell.style.display = 'none';
    renderLoginWall(loginWall);
  } else {
    // Cada inicio de sesión arranca siempre en Conteo, sin importar en qué
    // pestaña haya quedado la sesión anterior — antes, cerrar sesión y entrar
    // con otra cuenta en el mismo dispositivo dejaba la pestaña (y el
    // contenido ya renderizado, p.ej. Usuarios o Resumen de la cuenta
    // anterior) tal como había quedado.
    const freshLogin = !_wasLoggedIn;
    _wasLoggedIn = true;

    loginWall.style.display = 'none';
    appShell.style.display = 'block';
    // El panel de agregado rápido se pinta en boot(), ANTES de que el usuario
    // cruce el muro de login: en esa primera sesión auth.name() todavía está
    // vacío, así que el nombre del contador se quedaba en blanco y TODO lo que
    // esa persona contaba subía sin "contado por". Se refresca al abrir sesión
    // — y también cada vez que cambia la CUENTA logueada (antes solo se fijaba
    // la primera vez que el store quedaba vacío, así que en un dispositivo
    // compartido el nombre de la cuenta anterior se quedaba pegado en la
    // esquina inferior izquierda del panel tras un nuevo login).
    if (auth.ci() !== _contadorSyncCi) {
      _contadorSyncCi = auth.ci();
      if (auth.name()) {
        store.setContador(auth.name());
        resetIngresoRapido();
      }
    }
    // Categorías: store.init() intentó cargarlas antes de que existiera
    // sesión (RLS exige `to authenticated`, ver supabase/new-project-
    // schema.sql §11) — casi seguro llegaron vacías. Reintentar ahora que
    // hay un access_token real.
    if (freshLogin) { nav('resumen'); store.loadCategories(); if (auth.canEditInventory()) _setQaMode('ingreso'); }
    applyRBAC();
    // Recalcula qué insumos puede ver esta cuenta (coordinador ↔ su área,
    // ver store.visibleItems()) sin esperar a que el usuario cambie de
    // pestaña manualmente — antes la lista se quedaba con lo último
    // renderizado (p.ej. sin filtrar, de antes del login).
    if (_current === 'conteo')  { renderTop(); renderList(); }
    if (_current === 'resumen') renderResumen(pages.resumen);
  }
}

// Refresca la vista activa tras un cambio del panel de Ingreso Rápido
async function onAdded(id, isNew) {
  updateSyncPill();
  if (_current === 'conteo') { if (isNew) { renderTop(); renderList(); } else refreshItem(id); }
  else if (_current === 'registro') await renderRegistro(pages.registro);
  else if (_current === 'ingresos') await refreshIngresos();
  else if (_current === 'resumen')  renderResumen(pages.resumen);
  // en móvil, cerrar la hoja tras agregar para volver a ver la lista
  if (window.matchMedia('(max-width:820px)').matches) closeSheet();
}

// Refresca la vista activa tras un Egreso Rápido exitoso. A diferencia de
// Ingreso (un solo insumo), un egreso puede cambiar el stock de varios
// ítems a la vez, así que siempre se hace un refresco amplio (no
// refreshItem de uno solo). El panel de egreso ya se cierra a sí mismo.
async function onEgresado() {
  updateSyncPill();
  if (_current === 'conteo')   { renderTop(); renderList(); }
  else if (_current === 'registro') await renderRegistro(pages.registro);
  else if (_current === 'egresos')  await refreshEgresos();
  else if (_current === 'resumen')  renderResumen(pages.resumen);
}


async function updateSyncPill() {
  const set = (pillId, labelId, cls, txt) => {
    const pill = document.getElementById(pillId);
    const lbl = document.getElementById(labelId);
    if (pill) pill.className = `sync-pill ${cls}`;
    if (lbl) lbl.textContent = txt;
  };
  let cls = 'local', txt = 'Solo local', txtM = 'Local';
  if (sync.enabled) {
    const pend = await sync.pendingCount();
    if (sync.online && pend === 0) { cls = 'ok'; txt = txtM = 'Sincronizado'; }
    else if (pend > 0) { cls = 'pending'; txt = txtM = `${pend} sin subir`; }
    else { cls = 'local'; txt = txtM = 'Sin conexión'; }
  }
  set('sync-pill', 'sync-label', cls, txt);
  set('sync-pill-m', 'sync-label-m', cls, txtM);
}

async function boot() {
  // Marca (js/branding.js) — sobrescribe el texto por defecto de index.html
  // para que rebrandear solo requiera tocar ese archivo, no el HTML.
  document.title = APP_TITLE;
  ['brand-bold', 'brand-bold-m'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = APP_NAME_BOLD; });
  ['brand-rest', 'brand-rest-m'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = APP_NAME_REST; });

  // theme-color (color de la barra del navegador/task switcher) sigue a
  // --brand-secondary en vez de quedar hardcodeado en el <meta> — único
  // punto donde SÍ hace falta JS porque el navegador lo lee de un atributo,
  // no de CSS. manifest.json e icon.svg no pueden seguir este mismo truco
  // (ver comentario en index.html) y quedan como la excepción a mano.
  const themeColorMeta = document.getElementById('theme-color-meta');
  if (themeColorMeta) {
    const secondary = getComputedStyle(document.documentElement).getPropertyValue('--brand-secondary').trim();
    if (secondary) themeColorMeta.setAttribute('content', secondary);
  }

  const badgeEl  = document.getElementById('version-badge');
  const badgeElM = document.getElementById('version-badge-m');
  if (badgeEl)  badgeEl.textContent  = APP_VERSION;
  if (badgeElM) badgeElM.textContent = APP_VERSION;

  const clock = () => {
    const now = new Date();
    const t = document.querySelector('.clock-time');
    const d = document.querySelector('.clock-date');
    if (t) t.textContent = now.toLocaleTimeString('es-VE', { hour:'2-digit', minute:'2-digit' });
    if (d) d.textContent = now.toLocaleDateString('es-VE', { weekday:'short', day:'numeric', month:'short' });
  };
  clock(); setInterval(clock, 1000);

  document.querySelectorAll('.tn-item, .mbn-item').forEach(n =>
    n.addEventListener('click', () => nav(n.dataset.page === 'movimientos' ? _movSub : n.dataset.page)));

  document.querySelectorAll('.m-subnav-btn').forEach(b =>
    b.addEventListener('click', () => nav(b.dataset.subpage)));

  ['grupo-switch', 'grupo-switch-m'].forEach(id =>
    document.getElementById(id)?.addEventListener('change', e => _onGrupoChange(e.target.value)));

  // Enlaces "Ver todo" (p.ej. Resumen → Insumos/Comunicados, portado de
  // UCVAcopio/js/router.js) — delegado en document porque estos enlaces
  // viven dentro de vistas que se repintan enteras (resumen.js). La flecha
  // "Ver en Historial" de las tarjetas de Ingresos/Egresos usa el mismo
  // mecanismo, sumando data-tipo/data-date para preseleccionar el filtro y
  // desplazarse hasta el día correspondiente una vez cargado.
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-nav]');
    if (!link) return;
    const target = link.dataset.nav;
    nav(target).then(() => {
      if (target === 'registro' && (link.dataset.tipo || link.dataset.date)) {
        focusRegistro(link.dataset.tipo, link.dataset.date);
      }
    });
  });

  await auth.init();
  auth.onChange(checkAuth); // Si cierra sesión, vuelve al login

  try { await store.init(); }
  catch (e) { console.error('init', e); toast.err('Error al cargar el catálogo.'); }

  // ── Migración v1: limpiar " und" del final de los nombres ──────────────────
  // El seed anterior concatenaba un "und" neutro al nombre ("Arroz 1 kg und").
  // Esta migración lo limpia una sola vez en IndexedDB.
  if (!localStorage.getItem('migr_und_cleaned')) {
    try {
      const UND_SUFFIX = / und$/i;
      const dirty = store.items.filter(it => UND_SUFFIX.test(it.nombre));
      if (dirty.length > 0) {
        const fixed = dirty.map(it => ({ ...it, nombre: it.nombre.replace(UND_SUFFIX, '').trim() }));
        await db.bulkPut(fixed);
        fixed.forEach(it => {
          const idx = store.items.findIndex(x => x.id === it.id);
          if (idx !== -1) store.items[idx] = it;
        });
        console.info(`[migr] Limpiados ${fixed.length} nombres con " und" al final.`);
      }
      localStorage.setItem('migr_und_cleaned', '1');
    } catch (e) { console.warn('migr_und_cleaned falló:', e); }
  }


  // Auto-respaldo del conteo (si el último es viejo y hay algo contado)
  try { await checkpoints.autoBackup(); } catch (e) { console.error('backup', e); }

  // Coordinador (login + panel). onDataChange refresca la vista tras restaurar/resetear.
  initAdmin({ onDataChange: async () => {
    if (_current === 'conteo')   { renderTop(); renderList(); }
    if (_current === 'registro') await renderRegistro(pages.registro);
    if (_current === 'resumen')  renderResumen(pages.resumen);
  }});

  // Comunicados (pestaña puente con AcopioUCV/UCVComandas)
  modal.init();
  initComunicados();

  // Panel de Ingreso/Egreso Rápido (persistente / global) — mismo <aside>,
  // dos paneles internos alternados por el switcher (ver _setQaMode).
  renderIngresoRapido(document.getElementById('ingresorapido'), { onAdded });
  renderEgresoRapido(document.getElementById('qa-panel-egreso'), {
    onSubmitted: onEgresado,
    onClose: () => _setQaMode('ingreso'),
  });

  // Switcher Ingreso ↔ Egreso
  document.querySelectorAll('.qa-switch-btn').forEach(b =>
    b.addEventListener('click', () => _setQaMode(b.dataset.mode)));

  // FAB + backdrop (móvil) — siempre entra mostrando primero el modo que le
  // corresponda por defecto (Ingreso si puede editar, si no Egreso).
  document.getElementById('fab-qa')?.addEventListener('click', () => {
    _setQaMode(auth.canEditInventory() ? 'ingreso' : 'egreso');
    openSheet();
  });
  document.getElementById('qa-backdrop')?.addEventListener('click', closeSheet);

  sync.onChange(async () => {
    if (sync._authFailed) {
      sync._authFailed = false;
      auth.signOut();
      toast.err('Tu sesión expiró. Inicia sesión nuevamente.', true);
      return;
    }

    updateSyncPill();
    // Re-hidratar la memoria con lo que el pull acaba de dejar en IndexedDB
    store.items = await db.getAll();
    store.logs  = await db.logGetAll();

    if (_current === 'conteo')   syncView();
    if (_current === 'ingresos') refreshIngresos();
    if (_current === 'egresos')  refreshEgresos();
    if (_current === 'resumen')  renderResumen(pages.resumen);
  });
  updateSyncPill();
  
  // Conectar el Web Socket de Tiempo Real
  sync.listenRealtime();
  
  // Auto-sincronizar automáticamente cuando el teléfono recupera el internet o vuelve la pestaña a foco
  window.addEventListener('online', () => { sync.listenRealtime(); sync.run(); });
  window.addEventListener('offline', () => sync.stopRealtime());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { sync.run(); checkForUpdate(); }
  });
  
  // Timer de red de seguridad (cada 30s empuja pendientes y hala cambios perdidos por fallos de red)
  if (sync.enabled) {
    setInterval(() => sync.run(), 30_000);
  }
  
  nav('resumen');

  checkAuth();

  // Clic en el pill → sincronizar
  document.querySelectorAll('#sync-pill, #sync-pill-m').forEach(p =>
    p.addEventListener('click', refreshFromCloud));

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    
    // Escuchar cuando el nuevo Service Worker toma el control y forzar recarga
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }

  checkForUpdate();
}

// ── Auto-actualización ───────────────────────────────────────────────────
// Antes de conformarnos con lo que hay en caché, comparamos APP_VERSION
// contra js/version.js pedido directo a la red (sin caché). Si cambió,
// purgamos Service Worker + Cache Storage y recargamos una sola vez —
// evita tener que ir dispositivo por dispositivo borrando caché tras
// cada despliegue. Si no hay red, el fetch falla silencioso y seguimos
// con lo cacheado (mismo criterio local-first del resto de la app).
let _updateCheckInFlight = false;
async function checkForUpdate() {
  if (_updateCheckInFlight) return;
  _updateCheckInFlight = true;
  try {
    const res = await fetch('./js/version.js', { cache: 'no-store' });
    if (!res.ok) return;
    const text = await res.text();
    const match = text.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
    const remote = match && match[1];
    if (!remote || remote === APP_VERSION) return;
    if (sessionStorage.getItem('inventario_update_to') === remote) return;
    sessionStorage.setItem('inventario_update_to', remote);

    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    window.location.reload();
  } catch {
    // sin red o falló el chequeo: seguimos con lo cacheado
  } finally {
    _updateCheckInFlight = false;
  }
}

async function refreshFromCloud() {
  if (!sync.enabled) { toast.info('Nube no configurada — trabajando en local.'); return; }
  // No se exige sesión: la anon key permite subir y bajar todo. Exigir login
  // aquí dejaba a un voluntario sin poder forzar la sincronización manual.

  const pending = await sync.pendingCount();
  const pill = document.querySelectorAll('#sync-pill, #sync-pill-m');
  pill.forEach(p => p.classList.add('pending'));

  try {
    if (pending > 0) toast.info(`Subiendo ${pending} cambio${pending > 1 ? 's' : ''}...`);
    await sync.pullAll(); // pullAll reinicia el lastSync y descarga todo fresco
    store.items = await db.getAll();
    store.logs  = await db.logGetAll();
    if (_current === 'conteo')   { renderTop(); renderList(); }
    if (_current === 'registro') await renderRegistro(pages.registro);
    if (_current === 'resumen')  renderResumen(pages.resumen);
    updateSyncPill();

    const stillPending = await sync.pendingCount();
    if (stillPending > 0) {
      // El motivo real ya está traducido en la banda de error; el toast solo
      // confirma lo único que angustia al voluntario: que no perdió nada.
      const e = sync.lastError;
      toast.err(e ? `${e.titulo}. Tu conteo sigue guardado en el teléfono.`
                  : `${stillPending} cambio${stillPending > 1 ? 's' : ''} sin subir. Están guardados en el teléfono.`);
    } else {
      toast.ok('Todo al día. Sin cambios pendientes.');
    }
  } catch (err) {
    console.error('refreshFromCloud', err);
    const e = sync.lastError;
    toast.err(e ? `${e.titulo}. ${e.texto}` : 'No hay conexión. Tu conteo está guardado en el teléfono.');
    updateSyncPill();
  }
}

boot();
