// ── Login (CI + contraseña) + panel de coordinador/admin ──
// Botón "Coordinador": si hay sesión abre el panel (respaldos); el login ya
// no es Supabase Auth sino person_login (ver auth.js). Solo llegan aquí
// admin y coordinador con acceso a esta plataforma — checkAuth() en app.js
// ya filtró el resto antes de mostrar el app-shell.

import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';
import { DB_SCHEMA }   from '../env-config.js';
import { auth }        from '../auth.js';
import { checkpoints } from '../checkpoints.js';
import { escHtml }     from '../helpers.js';
import { toast }       from '../components/toast.js';

function _headers(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Accept-Profile': DB_SCHEMA,
    'Content-Profile': DB_SCHEMA,
    ...extra,
  };
}

async function _rpc(name, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: _headers(), body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.hint || 'Error de servidor');
  return data;
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

// Acción sensible: en la práctica siempre true acá (solo admin/coordinador
// con acceso llegan al app-shell), se mantiene como chequeo defensivo.
export function requireCoord() {
  return auth.isLoggedIn();
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
        <label>Cédula</label>
        <input id="adm-ci" type="number" inputmode="numeric" autocomplete="username" placeholder="Ej. 12345678" ${auth.enabled ? '' : 'disabled'}>
      </div>
      <div class="adm-field">
        <label>Contraseña</label>
        <input id="adm-pass" type="password" autocomplete="current-password" placeholder="••••••••" ${auth.enabled ? '' : 'disabled'}>
      </div>
      <div class="adm-err" id="adm-err"></div>
      <button class="adm-btn adm-btn-primary" id="adm-login" ${auth.enabled ? '' : 'disabled'}>Entrar al Sistema</button>
      <div class="adm-note">Solo administradores y coordinadores tienen acceso a Inventario.</div>
    </div>`;

  const ci   = container.querySelector('#adm-ci');
  const pass = container.querySelector('#adm-pass');
  const err  = container.querySelector('#adm-err');
  const btn  = container.querySelector('#adm-login');

  setTimeout(() => ci?.focus(), 100);

  const submit = async () => {
    err.textContent = '';
    btn.disabled = true; btn.textContent = 'Entrando…';
    const r = await auth.login(ci.value, pass.value);
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
  ci?.addEventListener('keydown', e => { if (e.key === 'Enter') pass?.focus(); });
}

// ── Panel de usuario (admin y coordinador) ──
async function openPanel() {
  if (!auth.isLoggedIn()) return; // sin sesión, el botón no abre nada (el muro ya se muestra)

  if (auth.isAdmin()) await checkpoints.load();
  const roleLabel = auth.isAdmin() ? 'Administrador' : `Coordinador · ${auth.area() || ''}`;
  const ov = modal(`
    <div class="adm-box adm-box-lg">
      <div class="adm-head">
        <div>
          <div class="adm-title">Panel de ${auth.isAdmin() ? 'administrador' : 'coordinador'}</div>
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
          <div class="adm-field">
            <label>Contraseña actual</label>
            <input type="password" id="adm-pass-actual" required autocomplete="current-password" placeholder="••••••••">
          </div>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <div class="adm-field" style="flex:1; min-width:140px;">
              <label>Contraseña nueva</label>
              <input type="password" id="adm-pass-nueva" required autocomplete="new-password" placeholder="Mínimo 6 caracteres">
            </div>
            <div class="adm-field" style="flex:1; min-width:140px;">
              <label>Repetir contraseña nueva</label>
              <input type="password" id="adm-pass-nueva2" required autocomplete="new-password" placeholder="Repite la contraseña">
            </div>
          </div>
          <div class="adm-err" id="adm-pass-err"></div>
          <button type="submit" class="adm-btn adm-btn-primary" id="adm-pass-submit">Cambiar contraseña</button>
        </form>
      </div>

      ${auth.isAdmin() ? `
      <div class="adm-sec">
        <div class="adm-sec-top">
          <span class="adm-sec-title">Respaldos del conteo</span>
          <button class="adm-mini" id="adm-cp-new">+ Crear respaldo</button>
        </div>
        <div class="adm-cp-list" id="adm-cp-list"></div>
      </div>` : ''}

      <button class="adm-btn" id="adm-logout">Cerrar sesión</button>
    </div>`);

  if (auth.isAdmin()) _paintCpList(ov);
  _cargarPerfil(ov);

  ov.querySelector('#adm-prof-form').addEventListener('submit', _guardarPerfil);
  ov.querySelector('#adm-pass-form').addEventListener('submit', _cambiarPassword);

  ov.querySelector('#adm-cp-new')?.addEventListener('click', async () => {
    await checkpoints.create(auth.name());
    toast.ok('Respaldo creado.');
    _paintCpList(ov);
  });
  ov.querySelector('#adm-logout').addEventListener('click', () => {
    auth.signOut(); toast.info('Sesión cerrada.'); close();
  });
}

// Precarga nombre/apellido (de la sesión) y teléfono (de la BD — no viaja en
// la sesión de person_login) para que el formulario no arranque vacío.
// Vía RPC (get_own_phone, supabase-migrations/21-fix-mi-perfil-rpc-*.sql):
// persons/phones tienen RLS activa igual que el resto del esquema (hallazgo
// 2026-07-28, ver 08-base-de-datos-PENDIENTE.md), un GET REST directo con
// la anon key no garantiza ver la fila.
async function _cargarPerfil(ov) {
  ov.querySelector('#adm-prof-nombre').value = auth.session?.name || '';
  ov.querySelector('#adm-prof-apellido').value = auth.session?.surname || '';
  try {
    const rows = await _rpc('get_own_phone', { p_actor_ci: auth.ci() });
    const phone = rows?.[0];
    if (phone?.company_code && phone?.number) {
      ov.querySelector('#adm-prof-cod').value = phone.company_code;
      ov.querySelector('#adm-prof-telf').value = phone.number;
    }
  } catch { /* el formulario simplemente arranca sin teléfono precargado */ }
}

// Vía RPC (update_own_profile, supabase-migrations/21-fix-mi-perfil-rpc-
// 2026-07-28.sql) — antes escribía REST directo contra persons/phones
// asumiendo RLS deshabilitada ahí (mismo criterio que products); ese
// supuesto resultó falso (RLS está activa en TODAS las tablas de este
// esquema, hallazgo 2026-07-28) así que el PATCH/POST directo no garantizaba
// funcionar. update_own_profile es autoservicio (el actor solo toca su
// propia fila) — distinto de admin_update_user_profile
// (20-area-general-y-edicion-usuarios-2026-07-28.sql), que edita a OTRO
// usuario desde el hub de Usuarios.
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
      p_actor_ci: auth.ci(), p_name: nombre, p_surname: apellido,
      p_phone_company_code: cod, p_phone_number: telf,
    });

    auth.updateProfile({ name: nombre, surname: apellido });
    ov.querySelector('.adm-sub').textContent =
      `${nombre} ${apellido} · ${auth.isAdmin() ? 'Administrador' : `Coordinador · ${auth.area() || ''}`}`;
    toast.ok('Perfil actualizado.');
  } catch (ex) {
    err.textContent = ex.message || 'Error al guardar el perfil.';
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar cambios';
  }
}

// Vía RPC (update_own_password, supabase-migrations/14-...), no REST directo
// como el resto de "Mi perfil": person_credentials tiene RLS activa (a
// diferencia de persons/phones) y exige la contraseña ACTUAL del lado del
// servidor — sin eso, cualquiera que supiera la cédula de otro (no es un
// dato secreto) podría cambiarle la contraseña y quitarle la cuenta.
async function _cambiarPassword(e) {
  e.preventDefault();
  const ov = e.target.closest('.adm-box');
  const btn = ov.querySelector('#adm-pass-submit');
  const err = ov.querySelector('#adm-pass-err');
  err.textContent = '';

  const actual = ov.querySelector('#adm-pass-actual').value;
  const nueva  = ov.querySelector('#adm-pass-nueva').value;
  const nueva2 = ov.querySelector('#adm-pass-nueva2').value;

  if (nueva.length < 6) { err.textContent = 'La contraseña nueva debe tener al menos 6 caracteres.'; return; }
  if (nueva !== nueva2) { err.textContent = 'Las dos contraseñas nuevas no coinciden.'; return; }

  btn.disabled = true; btn.textContent = 'Cambiando…';
  try {
    await _rpc('update_own_password', {
      p_actor_ci: auth.ci(), p_current_password: actual, p_new_password: nueva,
    });
    toast.ok('Contraseña actualizada.');
    ov.querySelector('#adm-pass-form').reset();
  } catch (ex) {
    err.textContent = ex.message || 'No se pudo cambiar la contraseña.';
  } finally {
    btn.disabled = false; btn.textContent = 'Cambiar contraseña';
  }
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
    if (!confirm('¿Restaurar este respaldo? Reemplaza el conteo actual.')) return;
    await checkpoints.restore(b.dataset.restore);
    toast.ok('Respaldo restaurado.');
    _onDataChange?.();
    close();
  }));
  box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('¿Seguro que deseas borrar este respaldo?')) return;
    await checkpoints.remove(b.dataset.del);
    _paintCpList(ov);
  }));
}
