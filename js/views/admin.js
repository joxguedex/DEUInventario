// ── Login (correo + contraseña, Supabase Auth) + panel de coordinador/admin ──
// Botón "Coordinador": si hay sesión abre el panel (respaldos). Solo llegan
// aquí admin y coordinador con acceso a esta plataforma — checkAuth() en
// app.js ya filtró el resto antes de mostrar el app-shell.

import { SUPABASE_URL } from '../config.js';
import { DB_SCHEMA }   from '../env-config.js';
import { auth }        from '../auth.js';
import { store }       from '../store.js';
import { checkpoints } from '../checkpoints.js';
import { escHtml }     from '../helpers.js';
import { toast }       from '../components/toast.js';
import { confirmDialog, promptDialog } from '../components/confirm.js';

function _headers(extra = {}) {
  return auth.authHeaders({
    'Accept-Profile': DB_SCHEMA,
    'Content-Profile': DB_SCHEMA,
    ...extra,
  });
}

async function _rpc(name, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: _headers(), body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.hint || 'Error de servidor');
  return data;
}

// Un admin normal nunca carga store.grupos (solo relevante para super_admin,
// ver store.js#init) — hace falta este fetch puntual para prellenar el
// nombre de SU PROPIO grupo al abrir "Editar mi grupo".
async function _fetchGrupoNombre(id) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/grupos?select=nombre&id=eq.${id}`, { headers: _headers() });
    if (!res.ok) return '';
    const rows = await res.json();
    return rows?.[0]?.nombre || '';
  } catch { return ''; }
}

let _onDataChange = null;   // callback para refrescar la vista activa

export function initAdmin({ onDataChange } = {}) {
  _onDataChange = onDataChange;
  document.getElementById('auth-btn')?.addEventListener('click', openPanel);
  document.getElementById('auth-btn-m')?.addEventListener('click', openPanel);
  auth.onChange(renderAuthButton);
  renderAuthButton();
}

export function renderAuthButton() {
  const isLogged = auth.isLoggedIn();
  const lbl = document.getElementById('auth-label');
  if (lbl) lbl.textContent = isLogged ? (auth.name() || 'Perfil') : 'Iniciar Sesión';
  document.getElementById('auth-btn')?.classList.toggle('on', isLogged);
  document.getElementById('auth-btn-m')?.classList.toggle('on', isLogged);
}

// Usado por ingresorapido.js para mostrar "Eliminar insumo" solo a admin.
export function isAdmin() {
  return auth.isAdmin();
}

// ── Modal genérico ──
function modal(html) {
  let ov = document.getElementById('adm-modal');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'adm-modal';
    ov.className = 'adm-ov';
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
  }
  ov.innerHTML = html;
  ov.classList.add('open');
  ov.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  return ov;
}
function close() { document.getElementById('adm-modal')?.classList.remove('open'); }

// ── Login Wall ──
export function renderLoginWall(container) {
  container.innerHTML = `
    <div class="adm-box">
      <div class="adm-head">
        <div class="adm-title">Iniciar Sesión</div>
      </div>
      ${auth.enabled ? '' : `<div class="adm-warn">La base de datos aún no está conectada. El inicio de sesión se activará al configurarla.</div>`}
      <div class="adm-field">
        <label>Correo electrónico</label>
        <input id="adm-email" type="email" autocomplete="username" placeholder="tucorreo@ejemplo.com" ${auth.enabled ? '' : 'disabled'}>
      </div>
      <div class="adm-field">
        <label>Contraseña</label>
        <input id="adm-pass" type="password" autocomplete="current-password" placeholder="••••••••" ${auth.enabled ? '' : 'disabled'}>
      </div>
      <div class="adm-err" id="adm-err"></div>
      <button class="adm-btn adm-btn-primary" id="adm-login" ${auth.enabled ? '' : 'disabled'}>Entrar al Sistema</button>
    </div>`;

  const email = container.querySelector('#adm-email');
  const pass = container.querySelector('#adm-pass');
  const err  = container.querySelector('#adm-err');
  const btn  = container.querySelector('#adm-login');

  setTimeout(() => email?.focus(), 100);

  const submit = async () => {
    err.textContent = '';
    btn.disabled = true; btn.textContent = 'Entrando…';
    const r = await auth.login(email.value, pass.value);
    if (r.ok) {
      toast.ok('Sesión iniciada.');
      renderAuthButton();
      // El onChange(checkAuth) en app.js ocultará el muro.
    } else {
      err.textContent = r.error;
      btn.disabled = false;
      btn.textContent = 'Entrar al Sistema';
    }
  };
  btn?.addEventListener('click', submit);
  pass?.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  email?.addEventListener('keydown', e => { if (e.key === 'Enter') pass?.focus(); });
}

// ── Panel de usuario (admin y coordinador) ──
// "Mi perfil" (nombre/apellido/teléfono), "Cambiar contraseña" y, para un
// admin de grupo (no super_admin, ver más abajo), "Mi grupo de extensión".
// Los respaldos del conteo YA NO viven acá (fix 2026-08-30): se editaba la
// sesión propia mezclado con una herramienta de recuperación de datos sin
// relación — ahora es un modal aparte, ver openTimeMachine() más abajo,
// abierto solo desde el botón "Máquina del Tiempo" de Ingreso Rápido.
export async function openPanel() {
  if (!auth.isLoggedIn()) return; // sin sesión, el botón no abre nada (el muro ya se muestra)

  const roleLabel = auth.isSuperAdmin() ? 'Super administrador'
    : auth.isAdmin() ? 'Administrador'
    : `Coordinador · ${auth.area() || ''}`;
  const ov = modal(`
    <div class="adm-box adm-box-lg">
      <div class="adm-head">
        <div>
          <div class="adm-title">Panel de ${auth.hasAdminRights() ? 'administrador' : 'coordinador'}</div>
          <div class="adm-sub">${escHtml(auth.name())} · ${escHtml(roleLabel)}</div>
        </div>
        <button class="adm-x" data-close>&times;</button>
      </div>

      <div class="adm-sec">
        <div class="adm-sec-top">
          <span class="adm-sec-title">Mi perfil</span>
        </div>
        <div class="adm-note" style="margin:0 0 10px;">Cédula ${escHtml(String(auth.ci() ?? ''))} (no se puede cambiar).</div>
        <form id="adm-prof-form" style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <div class="adm-field" style="flex:1; min-width:140px;">
              <label>Nombre</label>
              <input type="text" id="adm-prof-nombre" required placeholder="Nombre">
            </div>
            <div class="adm-field" style="flex:1; min-width:140px;">
              <label>Apellido</label>
              <input type="text" id="adm-prof-apellido" required placeholder="Apellido">
            </div>
          </div>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <div class="adm-field" style="width:100px;">
              <label>Cód.</label>
              <select id="adm-prof-cod" style="width:100%; padding:12px; border:1.5px solid var(--bdr); border-radius:var(--r-sm); background:var(--s2);">
                <option value="0412">0412</option>
                <option value="0414">0414</option>
                <option value="0416">0416</option>
                <option value="0422">0422</option>
                <option value="0424">0424</option>
                <option value="0426">0426</option>
              </select>
            </div>
            <div class="adm-field" style="flex:1;">
              <label>Teléfono (7 dígitos)</label>
              <input type="text" id="adm-prof-telf" required pattern="^[0-9]{7}$" placeholder="1234567">
            </div>
          </div>
          <div class="adm-err" id="adm-prof-err"></div>
          <button type="submit" class="adm-btn adm-btn-primary" id="adm-prof-submit">Guardar cambios</button>
        </form>
      </div>

      <div class="adm-sec">
        <div class="adm-sec-top">
          <span class="adm-sec-title">Cambiar contraseña</span>
        </div>
        <form id="adm-pass-form" style="display:flex; flex-direction:column; gap:12px;">
          <div class="adm-field" style="margin:0;">
            <label>Contraseña nueva</label>
            <input type="password" id="adm-pass-nueva" required autocomplete="new-password" placeholder="Mínimo 6 caracteres">
          </div>
          <div class="adm-field" style="margin:0;">
            <label>Repetir contraseña nueva</label>
            <input type="password" id="adm-pass-nueva2" required autocomplete="new-password" placeholder="Repite la contraseña">
          </div>
          <div class="adm-err" id="adm-pass-err"></div>
          <button type="submit" class="adm-btn adm-btn-primary" id="adm-pass-submit">Cambiar contraseña</button>
        </form>
      </div>

      ${auth.isAdmin() ? `
      <div class="adm-sec">
        <div class="adm-sec-top">
          <span class="adm-sec-title">Mi grupo de extensión</span>
        </div>
        <div class="adm-note" style="margin:0 0 10px;">Nombre y categorías vinculadas de tu grupo — cada categoría es el "área" que puede tener un coordinador.</div>
        <button class="adm-btn" id="adm-editar-grupo">Editar mi grupo</button>
      </div>` : ''}

      <button class="adm-btn" id="adm-logout">Cerrar sesión</button>
    </div>`);

  // "Editar mi grupo": exclusivo de admin de grupo — un super_admin no
  // "pertenece" a un único grupo (ve/administra todos, ya tiene su propia
  // pestaña "Grupos" para eso, ver views/grupos.js), así que la opción no
  // aplica acá (fix 2026-08-30).
  if (auth.isAdmin()) {
    ov.querySelector('#adm-editar-grupo')?.addEventListener('click', async () => {
      const grupoId = auth.grupo();
      if (grupoId == null) {
        toast.err('Elegí un grupo de extensión en la barra superior primero.');
        return;
      }
      const nombre = store.grupos.find(g => String(g.id) === String(grupoId))?.nombre
        || await _fetchGrupoNombre(grupoId);
      openEditGrupoModal({ id: grupoId, nombre });
    });
  }
  _cargarPerfil(ov);

  ov.querySelector('#adm-prof-form').addEventListener('submit', _guardarPerfil);
  ov.querySelector('#adm-pass-form').addEventListener('submit', _cambiarPassword);

  ov.querySelector('#adm-logout').addEventListener('click', () => {
    auth.signOut(); toast.info('Sesión cerrada.'); close();
  });
}

// ── Modal "Máquina del Tiempo" (respaldos del conteo) ──
// Separado del panel de "Mi perfil" (openPanel, fix 2026-08-30): antes los
// respaldos vivían mezclados ahí adentro, junto con editar nombre/
// contraseña/grupo — una herramienta de recuperación de datos sin relación
// con la sesión propia. Ahora es su propio modal, alcanzable solo desde el
// botón "Máquina del Tiempo" del pie de Ingreso Rápido (admin/super_admin,
// ver ingresorapido.js#_wireAdminTools).
export async function openTimeMachine() {
  if (!auth.isLoggedIn() || !auth.hasAdminRights()) return;
  await checkpoints.load();

  const ov = modal(`
    <div class="adm-box adm-box-lg">
      <div class="adm-head">
        <div>
          <div class="adm-title">Máquina del tiempo</div>
          <div class="adm-sub">Respaldos del conteo</div>
        </div>
        <button class="adm-x" data-close>&times;</button>
      </div>
      <div class="adm-sec">
        <div class="adm-sec-top">
          <span class="adm-sec-title">Respaldos del conteo</span>
          <button class="adm-mini" id="adm-cp-new">+ Crear respaldo</button>
        </div>
        <div class="adm-cp-list" id="adm-cp-list"></div>
      </div>
    </div>`);

  _paintCpList(ov);
  ov.querySelector('#adm-cp-new')?.addEventListener('click', async () => {
    await checkpoints.create(auth.name());
    toast.ok('Respaldo creado.');
    _paintCpList(ov);
  });
}

// Precarga nombre/apellido/teléfono desde auth.session — ya no hace falta
// una RPC aparte (get_own_phone se retiró): _applySession() en auth.js ya
// resuelve el teléfono junto con el resto del perfil al iniciar sesión.
async function _cargarPerfil(ov) {
  ov.querySelector('#adm-prof-nombre').value = auth.session?.name || '';
  ov.querySelector('#adm-prof-apellido').value = auth.session?.surname || '';
  if (auth.session?.phone_company_code) ov.querySelector('#adm-prof-cod').value = auth.session.phone_company_code;
  if (auth.session?.phone_number) ov.querySelector('#adm-prof-telf').value = auth.session.phone_number;
}

// Vía RPC update_own_profile (autoservicio: el actor sale de auth.uid() del
// lado del servidor, ya no de un p_actor_ci mandado por el cliente — ver
// supabase/new-project-schema.sql §8) — distinto de un eventual "editar a
// OTRO usuario", que vive en la Edge Function (manage-users), no acá.
async function _guardarPerfil(e) {
  e.preventDefault();
  const ov = e.target.closest('.adm-box');
  const btn = ov.querySelector('#adm-prof-submit');
  const err = ov.querySelector('#adm-prof-err');
  err.textContent = '';

  const nombre   = ov.querySelector('#adm-prof-nombre').value.trim();
  const apellido = ov.querySelector('#adm-prof-apellido').value.trim();
  const cod      = ov.querySelector('#adm-prof-cod').value;
  const telf     = ov.querySelector('#adm-prof-telf').value.trim();

  if (!nombre || !apellido) { err.textContent = 'Nombre y apellido son obligatorios.'; return; }
  if (!/^[0-9]{7}$/.test(telf)) { err.textContent = 'El teléfono debe tener 7 dígitos.'; return; }

  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    await _rpc('update_own_profile', {
      p_name: nombre, p_surname: apellido,
      p_phone_company_code: cod, p_phone_number: telf,
    });

    auth.updateProfile({ name: nombre, surname: apellido, phone_company_code: cod, phone_number: telf });
    ov.querySelector('.adm-sub').textContent =
      `${nombre} ${apellido} · ${auth.isAdmin() ? 'Administrador' : `Coordinador · ${auth.area() || ''}`}`;
    toast.ok('Perfil actualizado.');
  } catch (ex) {
    err.textContent = ex.message || 'Error al guardar el perfil.';
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar cambios';
  }
}

// Vía Supabase Auth (auth.updateUser en auth.js#updatePassword) — ya no hay
// RPC update_own_password ni campo "contraseña actual": una sesión válida
// ya demuestra quién sos, autenticarse de nuevo para cambiar la contraseña
// sería redundante (a diferencia del modelo viejo sin JWT, donde la RPC era
// el único punto de verificación real).
async function _cambiarPassword(e) {
  e.preventDefault();
  const ov = e.target.closest('.adm-box');
  const btn = ov.querySelector('#adm-pass-submit');
  const err = ov.querySelector('#adm-pass-err');
  err.textContent = '';

  const nueva  = ov.querySelector('#adm-pass-nueva').value;
  const nueva2 = ov.querySelector('#adm-pass-nueva2').value;

  if (nueva.length < 6) { err.textContent = 'La contraseña nueva debe tener al menos 6 caracteres.'; return; }
  if (nueva !== nueva2) { err.textContent = 'Las dos contraseñas nuevas no coinciden.'; return; }

  btn.disabled = true; btn.textContent = 'Cambiando…';
  try {
    await auth.updatePassword(nueva);
    toast.ok('Contraseña actualizada.');
    ov.querySelector('#adm-pass-form').reset();
  } catch (ex) {
    err.textContent = ex.message || 'No se pudo cambiar la contraseña.';
  } finally {
    btn.disabled = false; btn.textContent = 'Cambiar contraseña';
  }
}

// ── Editar grupo (nombre + categorías vinculadas) — reemplaza el antiguo
// "Gestionar" de views/grupos.js y la sección "Categorías de insumos" de
// este mismo panel. Un admin normal puede editar SU PROPIO grupo (ver
// "Editar mi grupo" arriba); super_admin puede editar cualquiera (ver
// views/grupos.js, botón "Editar" en cada tarjeta). Categorías: catálogo
// COMPARTIDO entre grupos (revisión "productos multigrupo", 2026-08-25) —
// vincular busca-y-reutiliza (store.createCategory), desvincular solo
// bloquea si hay conteos vivos EN ESTE grupo (con opción de forzar el
// borrado lógico de esos conteos), nunca borra la categoría real mientras
// algún otro grupo la tenga vinculada.
export function openEditGrupoModal(grupo, { onChange } = {}) {
  const ov = modal(`
    <div class="adm-box adm-box-lg">
      <div class="adm-head">
        <div>
          <div class="adm-title">Editar grupo</div>
          <div class="adm-sub" id="eg-sub">${escHtml(grupo.nombre || '')}</div>
        </div>
        <button class="adm-x" data-close>&times;</button>
      </div>

      <div class="adm-field">
        <label>Nombre del grupo</label>
        <input id="eg-nombre" type="text" maxlength="100" value="${escHtml(grupo.nombre || '')}">
      </div>
      <div class="adm-err" id="eg-nombre-err"></div>
      <button class="adm-btn adm-btn-primary" id="eg-nombre-save" style="margin-bottom:18px;">Guardar nombre</button>

      <div class="adm-sec-top">
        <span class="adm-sec-title">Categorías vinculadas</span>
      </div>
      <div class="adm-note" style="margin:0 0 10px;">El "área" que puede tener un coordinador de este grupo. Desvincular no borra la categoría real (sigue disponible para otros grupos que la usen) — solo bloquea si tu grupo todavía tiene insumos con conteo en ella.</div>
      <div class="adm-cp-list" id="eg-cat-list"><div class="adm-cp-empty">Cargando…</div></div>

      <div class="adm-field" style="margin-top:14px;">
        <label>Vincular categoría (nueva o existente)</label>
        <input id="eg-cat-input" type="text" autocomplete="off" placeholder="Ej. Alimentos" maxlength="100">
      </div>
      <div class="ren-sugg" id="eg-cat-sugg"></div>
      <div class="adm-err" id="eg-cat-err"></div>
      <button class="adm-btn" id="eg-cat-add">+ Vincular / crear</button>

      ${auth.isSuperAdmin() ? `
      <div class="adm-sec-top" style="margin-top:22px;">
        <span class="adm-sec-title" style="color:var(--red);">Zona de peligro</span>
      </div>
      <div class="adm-note" style="margin:0 0 10px;">Elimina el grupo por completo — su inventario, categorías vinculadas, usuarios, movimientos, comandas y comunicados. Esta acción no se puede deshacer.</div>
      <button class="adm-btn" id="eg-delete" style="border-color:var(--red); color:var(--red);">Eliminar grupo</button>` : ''}
    </div>`);

  const nombreInp = ov.querySelector('#eg-nombre');
  const nombreErr = ov.querySelector('#eg-nombre-err');
  ov.querySelector('#eg-nombre-save').addEventListener('click', async () => {
    nombreErr.textContent = '';
    const val = nombreInp.value.trim();
    if (!val) { nombreErr.textContent = 'El nombre es obligatorio.'; return; }
    try {
      await store.renameGrupo(grupo.id, val);
      grupo.nombre = val;
      ov.querySelector('#eg-sub').textContent = val;
      toast.ok('Grupo renombrado.');
      onChange?.();
    } catch (ex) {
      nombreErr.textContent = ex.message || 'No se pudo renombrar el grupo.';
    }
  });

  const catInp = ov.querySelector('#eg-cat-input');
  const catSugg = ov.querySelector('#eg-cat-sugg');
  const catErr = ov.querySelector('#eg-cat-err');

  async function _paintCatList() {
    const box = ov.querySelector('#eg-cat-list');
    if (!box) return;
    await store.loadAllCategoryNames();
    const cats = await store.categoriesForGrupo(grupo.id);
    if (!cats.length) { box.innerHTML = `<div class="adm-cp-empty">Sin categorías vinculadas todavía — agrega una abajo.</div>`; return; }
    box.innerHTML = cats.map(c => `
      <div class="adm-cp" data-id="${c.id}">
        <div class="adm-cp-info">
          <div class="adm-cp-date">${escHtml(c.nombre)}</div>
        </div>
        <button class="adm-mini" data-rename="${c.id}">Renombrar</button>
        <button class="adm-mini adm-mini-x" data-unlink="${c.id}">×</button>
      </div>`).join('');

    box.querySelectorAll('[data-rename]').forEach(b => b.addEventListener('click', async () => {
      const c = cats.find(x => String(x.id) === b.dataset.rename);
      const nuevo = await promptDialog({
        title: 'Renombrar categoría', label: 'Nuevo nombre (afecta a todos los grupos que la usan)',
        value: c?.nombre || '', confirmText: 'Renombrar',
      });
      if (nuevo == null) return;
      const val = nuevo.trim();
      if (!val || val === c.nombre) return;
      try {
        await store.renameCategory(c.id, val);
        toast.ok('Categoría renombrada.');
        _paintCatList();
      } catch (ex) {
        toast.err(ex.message || 'No se pudo renombrar la categoría.');
      }
    }));

    box.querySelectorAll('[data-unlink]').forEach(b => b.addEventListener('click', async () => {
      const c = cats.find(x => String(x.id) === b.dataset.unlink);
      const ok = await confirmDialog({
        title: 'Desvincular categoría',
        body: `¿Desvincular "${escHtml(c?.nombre)}" de este grupo? Si tu grupo tiene coordinadores en esta categoría, quedan sin acceso de inmediato.`,
        confirmText: 'Desvincular', danger: true,
      });
      if (!ok) return;
      try {
        await store.deleteCategory(c.id, { grupoId: grupo.id });
        toast.ok('Categoría desvinculada.');
        _paintCatList();
      } catch (ex) {
        // El servidor bloquea si hay conteos vivos — ofrece forzar el
        // borrado lógico de esos conteos en vez de solo mostrar el error.
        const force = await confirmDialog({
          title: 'Hay insumos con conteo',
          body: `${escHtml(ex.message || '')} ¿Eliminar (borrado lógico, reversible) esos conteos y desvincular igual?`,
          confirmText: 'Eliminar y desvincular', danger: true,
        });
        if (!force) return;
        try {
          await store.deleteCategory(c.id, { grupoId: grupo.id, force: true });
          toast.ok('Conteos eliminados y categoría desvinculada.');
          _paintCatList();
        } catch (ex2) {
          toast.err(ex2.message || 'No se pudo desvincular la categoría.');
        }
      }
    }));
  }

  function _paintCatSugg(q) {
    const matches = store.searchCategoryNames(q);
    catSugg.innerHTML = matches.map(c => `
      <button type="button" class="ren-sugg-item" data-nombre="${escHtml(c.nombre)}">
        <span class="ren-sugg-name">${escHtml(c.nombre)}</span>
      </button>`).join('');
    catSugg.querySelectorAll('.ren-sugg-item').forEach(b => {
      b.onclick = () => { catInp.value = b.dataset.nombre; catSugg.innerHTML = ''; };
    });
  }
  let t;
  catInp.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => _paintCatSugg(catInp.value.trim()), 110);
  });

  ov.querySelector('#eg-cat-add').addEventListener('click', async () => {
    catErr.textContent = '';
    const val = catInp.value.trim();
    if (!val) { catErr.textContent = 'Escribe un nombre.'; return; }
    try {
      await store.createCategory(val, grupo.id);
      catInp.value = ''; catSugg.innerHTML = '';
      toast.ok('Categoría vinculada.');
      _paintCatList();
    } catch (ex) {
      catErr.textContent = ex.message || 'No se pudo vincular la categoría.';
    }
  });

  _paintCatList();

  // Eliminar grupo (super_admin-only, ver store.js#deleteGrupo). Igual
  // criterio que desvincular categoría arriba: primero SIN forzar (el
  // servidor bloquea si hay datos reales y devuelve el detalle), y si
  // bloquea, se ofrece forzar el borrado en cascada con ese detalle a la
  // vista en vez de un mensaje genérico.
  ov.querySelector('#eg-delete')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Eliminar grupo',
      body: `¿Eliminar "${escHtml(grupo.nombre || '')}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar', danger: true,
    });
    if (!ok) return;
    try {
      await store.deleteGrupo(grupo.id);
      toast.ok('Grupo eliminado.');
      onChange?.();
      close();
    } catch (ex) {
      const force = await confirmDialog({
        title: 'El grupo tiene datos asociados',
        body: `${escHtml(ex.message || '')} ¿Eliminar TODO igual (insumos, usuarios, movimientos, comandas y comunicados de este grupo)?`,
        confirmText: 'Eliminar todo', danger: true,
      });
      if (!force) return;
      try {
        await store.deleteGrupo(grupo.id, { force: true });
        toast.ok('Grupo y todos sus datos eliminados.');
        onChange?.();
        close();
      } catch (ex2) {
        toast.err(ex2.message || 'No se pudo eliminar el grupo.');
      }
    }
  });
}

function _paintCpList(ov) {
  const box = ov.querySelector('#adm-cp-list');
  if (!checkpoints.list.length) { box.innerHTML = `<div class="adm-cp-empty">Aún no hay respaldos.</div>`; return; }
  box.innerHTML = checkpoints.list.map(cp => {
    const d = new Date(cp.created_at);
    const fecha = d.toLocaleString('es-VE', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    return `<div class="adm-cp">
      <div class="adm-cp-info">
        <div class="adm-cp-date">${fecha}</div>
        <div class="adm-cp-meta">${cp.resumen.contados}/${cp.resumen.total} insumos · ${cp.resumen.unidades.toLocaleString('es-VE')} und · ${escHtml(cp.creado_por)}</div>
      </div>
      <button class="adm-mini" data-restore="${cp.id}">Restaurar</button>
      <button class="adm-mini adm-mini-x" data-del="${cp.id}">×</button>
    </div>`;
  }).join('');

  box.querySelectorAll('[data-restore]').forEach(b => b.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Restaurar respaldo',
      body: '¿Restaurar este respaldo? Reemplaza el conteo actual.',
      confirmText: 'Restaurar', danger: true,
    });
    if (!ok) return;
    await checkpoints.restore(b.dataset.restore);
    toast.ok('Respaldo restaurado.');
    _onDataChange?.();
    close();
  }));
  box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Borrar respaldo',
      body: '¿Seguro que deseas borrar este respaldo?',
      confirmText: 'Borrar', danger: true,
    });
    if (!ok) return;
    await checkpoints.remove(b.dataset.del);
    _paintCpList(ov);
  }));
}
