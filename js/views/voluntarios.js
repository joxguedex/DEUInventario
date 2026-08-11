// ── Gestión de accesos (admin-only) ───────────────────────
// Reescritura completa para Supabase Auth: ya no existen create_user/
// update_user_role/delete_user/list_users/admin_update_user_profile/
// admin_reset_password (RPCs de person_credentials, tabla que dejó de
// existir — ver supabase/new-project-schema.sql). El modelo nuevo separa
// dos cosas que antes eran un solo paso:
//   1. Datos de la PERSONA en sí (nombre/apellido/teléfono/cédula) —
//      create_person/admin_update_person, RPCs normales, sin necesitar la
//      Admin API (son columnas de `persons`, cubiertas por RLS).
//   2. Otorgar/editar/revocar el ACCESO de una persona (crear su cuenta de
//      Auth, fijar rol/área/correo, resetear contraseña) — exige la Admin
//      API (service_role key), así que vive en la Edge Function
//      (supabase/functions/manage-users), nunca en una RPC alcanzable con
//      la sola anon/authenticated key.
//
// Esta pestaña es exclusiva de admin — "otorgar acceso" es la operación más
// sensible de todo el sistema (crea una cuenta con rol real), coherente con
// que el resto de la gestión de categorías/productos también quedó
// admin-only (ver views/admin.js). La pestaña "Usuarios" del nav ya se
// oculta entera para cualquier otra cuenta (ver app.js#applyRBAC), pero
// este mensaje se conserva como respaldo por si se llega acá de otra forma.

import { SUPABASE_URL } from '../config.js';
import { DB_SCHEMA } from '../env-config.js';
import { toast } from '../components/toast.js';
import { auth } from '../auth.js';
import { store } from '../store.js';
import { escHtml } from '../helpers.js';
import { confirmDialog } from '../components/confirm.js';

const PHONE_PREFIXES = ['0412', '0414', '0416', '0422', '0424', '0426'];

function _areaOptionsHTML() {
  const categorias = [...store.categories].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return `
    <option value="general">General (solo consulta + despacho de cualquier área)</option>
    <optgroup label="Coordinación por categoría (Despachos)">
      ${categorias.map(c => `<option value="${c.id}">${escHtml(c.nombre)}</option>`).join('')}
    </optgroup>`;
}

function _rpcHeaders(extra = {}) {
  return auth.authHeaders({ 'Content-Profile': DB_SCHEMA, ...extra });
}

async function _rpc(name, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: _rpcHeaders(), body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.hint || 'Error de servidor');
  return data;
}

// La Edge Function es la única pieza que puede crear/editar/revocar una
// cuenta de Auth (necesita la Admin API, ver supabase/functions/manage-
// users) — nunca alcanzable con la anon/authenticated key sola.
async function _edgeFn(action, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-users`, {
    method: 'POST', headers: auth.authHeaders(), body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Error de servidor');
  return data;
}

const ROLE_LABEL = { admin: 'Administrador', coordinador: 'Coordinador' };
function _areaLabel(area) {
  if (area === 'general') return 'General';
  const c = store.categories.find(x => String(x.id) === String(area));
  return c ? c.nombre : (area || '—');
}

let _lastUsers = [];

export function renderVoluntarios(container) {
  if (!auth.isAdmin()) {
    container.innerHTML = `
      <div class="reg-wrap"><div class="reg-empty">
        <div class="reg-empty-t">Solo para administradores</div>
        <div class="reg-empty-s">La gestión de accesos es exclusiva del administrador del sistema.</div>
      </div></div>`;
    return;
  }

  container.innerHTML = `
    <div class="reg-wrap">
      <div class="cnt-topcard">
        <div class="ctc-progress-head"><span class="ctc-progress-title">Otorgar acceso</span></div>
        <div class="adm-note" style="margin:6px 0 14px;">Crea la persona y su inicio de sesión en un solo paso. El rol siempre es Coordinador — un admin nuevo se crea directo contra la base, nunca desde acá.</div>
        <form id="vol-form" class="adm-cp-list" style="gap: 12px;">
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <div class="adm-field" style="flex:1; min-width:140px;">
              <label>Cédula</label>
              <input type="number" id="vol-ci" required placeholder="Ej. 20123456">
            </div>
            <div class="adm-field" style="flex:1; min-width:140px;">
              <label>Nombre</label>
              <input type="text" id="vol-nombre" required placeholder="Nombre">
            </div>
            <div class="adm-field" style="flex:1; min-width:140px;">
              <label>Apellido</label>
              <input type="text" id="vol-apellido" required placeholder="Apellido">
            </div>
          </div>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <div class="adm-field" style="width:100px;">
              <label>Cód.</label>
              <select id="vol-cod" style="width:100%; padding:12px; border:1.5px solid var(--bdr); border-radius:var(--r-sm); background:var(--s2);">
                ${PHONE_PREFIXES.map(p => `<option value="${p}">${p}</option>`).join('')}
              </select>
            </div>
            <div class="adm-field" style="flex:1;">
              <label>Teléfono (7 dígitos)</label>
              <input type="text" id="vol-telf" required pattern="^[0-9]{7}$" placeholder="1234567">
            </div>
          </div>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <div class="adm-field" style="flex:1; min-width:180px;">
              <label>Correo electrónico</label>
              <input type="email" id="vol-email" required placeholder="correo@ejemplo.com">
            </div>
            <div class="adm-field" style="flex:1; min-width:140px;">
              <label>Contraseña</label>
              <input type="password" id="vol-pass" required minlength="6" placeholder="Mínimo 6 caracteres">
            </div>
          </div>
          <div class="adm-field">
            <label>Área</label>
            <select id="vol-area" style="width:100%; padding:12px; border:1.5px solid var(--bdr); border-radius:var(--r-sm); background:var(--s2);">
              ${_areaOptionsHTML()}
            </select>
          </div>
          <button type="submit" class="adm-btn adm-btn-primary" id="vol-submit">Crear y otorgar acceso</button>
        </form>
      </div>

      <div class="cnt-topcard" style="margin-top:20px;">
        <div class="ctc-progress-head"><span class="ctc-progress-title">Usuarios con acceso</span></div>
        <div class="reg-list" id="vol-list" style="margin-top:14px;">
          <div class="reg-empty"><span class="reg-empty-t">Cargando usuarios...</span></div>
        </div>
      </div>
    </div>

    <div id="vol-edit-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:999; justify-content:center; align-items:center;">
      <div style="background:var(--bg); padding:20px; border-radius:8px; width:90%; max-width:420px; border:1px solid var(--bdr); max-height:90vh; overflow-y:auto;">
        <h3 style="margin-top:0;">Editar usuario</h3>
        <form id="vol-edit-form" style="display:flex; flex-direction:column; gap:12px;">
          <input type="hidden" id="vol-edit-ci">
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <div class="adm-field" style="flex:1; min-width:140px;">
              <label>Cédula</label>
              <input type="number" id="vol-edit-cedula" required placeholder="Ej. 20123456">
            </div>
            <div class="adm-field" style="flex:1; min-width:140px;">
              <label>Nombre</label>
              <input type="text" id="vol-edit-nombre" required placeholder="Nombre">
            </div>
            <div class="adm-field" style="flex:1; min-width:140px;">
              <label>Apellido</label>
              <input type="text" id="vol-edit-apellido" required placeholder="Apellido">
            </div>
          </div>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <div class="adm-field" style="width:100px;">
              <label>Cód.</label>
              <select id="vol-edit-cod" style="width:100%; padding:12px; border:1.5px solid var(--bdr); border-radius:var(--r-sm); background:var(--s2);">
                ${PHONE_PREFIXES.map(p => `<option value="${p}">${p}</option>`).join('')}
              </select>
            </div>
            <div class="adm-field" style="flex:1;">
              <label>Teléfono (7 dígitos)</label>
              <input type="text" id="vol-edit-telf" required pattern="^[0-9]{7}$" placeholder="1234567">
            </div>
          </div>
          <div class="adm-field">
            <label>Correo electrónico</label>
            <input type="email" id="vol-edit-email" required placeholder="correo@ejemplo.com">
          </div>
          <div class="adm-field">
            <label>Área</label>
            <select id="vol-edit-area" style="width:100%; padding:12px; border:1.5px solid var(--bdr); border-radius:var(--r-sm); background:var(--s2);">
              ${_areaOptionsHTML()}
            </select>
          </div>
          <div class="adm-field">
            <label>Nueva contraseña (opcional)</label>
            <input type="password" id="vol-edit-pass" minlength="6" placeholder="Dejar en blanco para no cambiarla">
          </div>
          <div style="display:flex; gap:10px; margin-top:4px;">
            <button type="button" class="adm-btn" id="vol-edit-cancel" style="flex:1;">Cancelar</button>
            <button type="submit" class="adm-btn adm-btn-primary" id="vol-edit-submit" style="flex:1;">Guardar</button>
          </div>
        </form>
      </div>
    </div>`;

  container.querySelector('#vol-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = container.querySelector('#vol-submit');
    btn.disabled = true; btn.textContent = 'Creando…';
    try {
      const ci = parseInt(container.querySelector('#vol-ci').value, 10);
      const nombre = container.querySelector('#vol-nombre').value.trim();
      const apellido = container.querySelector('#vol-apellido').value.trim();
      const phoneCode = container.querySelector('#vol-cod').value;
      const phoneNum = container.querySelector('#vol-telf').value.trim();
      const email = container.querySelector('#vol-email').value.trim();
      const password = container.querySelector('#vol-pass').value;
      const area = container.querySelector('#vol-area').value;

      // Paso 1: la persona (RPC normal). Si ya existe (p.ej. la creó un
      // coordinador desde Egreso Rápido), create_person la actualiza — no
      // hace falta distinguir alta/edición acá.
      await _rpc('create_person', {
        p_ci: ci, p_name: nombre, p_surname: apellido,
        p_phone_company_code: phoneCode, p_phone_number: phoneNum,
      });

      // Paso 2: el acceso en sí (Edge Function, Admin API).
      await _edgeFn('grant_login', { ci, email, password, area });

      toast.ok('Usuario creado y con acceso.');
      container.querySelector('#vol-form').reset();
      await loadVolunteers(container);
    } catch (err) {
      toast.err(err.message || 'Ocurrió un error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Crear y otorgar acceso';
    }
  });

  container.querySelector('#vol-edit-cancel').addEventListener('click', () => {
    container.querySelector('#vol-edit-modal').style.display = 'none';
  });

  container.querySelector('#vol-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = container.querySelector('#vol-edit-submit');
    btn.disabled = true; btn.textContent = 'Guardando…';
    try {
      const ci = parseInt(container.querySelector('#vol-edit-ci').value, 10);
      const nuevaCi = parseInt(container.querySelector('#vol-edit-cedula').value, 10);
      const nombre = container.querySelector('#vol-edit-nombre').value.trim();
      const apellido = container.querySelector('#vol-edit-apellido').value.trim();
      const phoneCode = container.querySelector('#vol-edit-cod').value;
      const phoneNum = container.querySelector('#vol-edit-telf').value.trim();
      const email = container.querySelector('#vol-edit-email').value.trim();
      const area = container.querySelector('#vol-edit-area').value;
      const nuevaPass = container.querySelector('#vol-edit-pass').value;

      // Paso 1: datos de la persona (RPC normal — nombre/apellido/teléfono/
      // cédula son columnas de `persons`, no necesitan la Admin API).
      await _rpc('admin_update_person', {
        p_ci: ci, p_new_ci: nuevaCi, p_name: nombre, p_surname: apellido,
        p_phone_company_code: phoneCode, p_phone_number: phoneNum,
      });

      // Paso 2: lo que sí vive en auth.users / necesita la Admin API — a
      // partir de acá se usa la cédula NUEVA (admin_update_person ya migró
      // la fila si cambió).
      await _edgeFn('update_email', { ci: nuevaCi, email });
      await _edgeFn('update_area', { ci: nuevaCi, area });
      if (nuevaPass) await _edgeFn('reset_password', { ci: nuevaCi, new_password: nuevaPass });

      toast.ok('Usuario actualizado.');
      container.querySelector('#vol-edit-modal').style.display = 'none';
      await loadVolunteers(container);
    } catch (err) {
      toast.err(err.message || 'Error al actualizar');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar';
    }
  });

  window.editVolunteer = function (ci) {
    const v = _lastUsers.find(u => u.ci === ci);
    if (!v) return;
    container.querySelector('#vol-edit-ci').value = v.ci;
    container.querySelector('#vol-edit-cedula').value = v.ci;
    container.querySelector('#vol-edit-nombre').value = v.name || '';
    container.querySelector('#vol-edit-apellido').value = v.surname || '';
    container.querySelector('#vol-edit-cod').value = v.phone_company_code || PHONE_PREFIXES[0];
    container.querySelector('#vol-edit-telf').value = v.phone_number || '';
    container.querySelector('#vol-edit-email').value = v.email || '';
    container.querySelector('#vol-edit-area').value = v.area || 'general';
    container.querySelector('#vol-edit-pass').value = '';
    container.querySelector('#vol-edit-modal').style.display = 'flex';
  };

  window.revokeVolunteer = async function (ci, label) {
    const ok = await confirmDialog({
      title: 'Revocar acceso',
      body: `¿Revocar el acceso de ${escHtml(label)}? Pierde la sesión de inmediato. La persona y su historial no se borran — se le puede otorgar acceso de nuevo más adelante.`,
      confirmText: 'Revocar', danger: true,
    });
    if (!ok) return;
    try {
      await _edgeFn('revoke_access', { ci });
      toast.ok('Acceso revocado.');
      await loadVolunteers(container);
    } catch (err) {
      toast.err(err.message || 'Error al revocar el acceso');
    }
  };

  // Activar/desactivar: a diferencia de "Revocar", no toca rol/área — solo
  // bloquea/desbloquea el login (baneo nativo de Supabase Auth, ver
  // manage-users#setActive). Pensado para bajas temporales, sin tener que
  // reconfigurar el área al reactivar.
  window.toggleActiveVolunteer = async function (ci, activarAhora, label) {
    const accion = activarAhora ? 'activar' : 'desactivar';
    const ok = await confirmDialog({
      title: activarAhora ? 'Activar usuario' : 'Desactivar usuario',
      body: `¿${activarAhora ? 'Activar' : 'Desactivar'} a ${escHtml(label)}?${activarAhora ? '' : ' Pierde la sesión de inmediato.'}`,
      confirmText: activarAhora ? 'Activar' : 'Desactivar', danger: !activarAhora,
    });
    if (!ok) return;
    try {
      await _edgeFn('set_active', { ci, active: activarAhora });
      toast.ok(`Usuario ${activarAhora ? 'activado' : 'desactivado'}.`);
      await loadVolunteers(container);
    } catch (err) {
      toast.err(err.message || `Error al ${accion}`);
    }
  };

  loadVolunteers(container);
}

async function loadVolunteers(container) {
  const listEl = container.querySelector('#vol-list');
  try {
    const data = await _rpc('list_users_with_access', {});
    _lastUsers = data;

    if (!data.length) {
      listEl.innerHTML = `<div class="reg-empty"><span class="reg-empty-t">No hay coordinadores con acceso todavía</span></div>`;
      return;
    }

    listEl.innerHTML = data.map(v => {
      const nombreEsc = (v.name || '').replace(/'/g, "\\'") + ' ' + (v.surname || '').replace(/'/g, "\\'");
      return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 16px; margin-bottom:10px; background:var(--s1,#fff); border:1px solid var(--bdr); border-radius:12px; gap:12px; ${v.active === false ? 'opacity:.6' : ''}">
        <div style="flex:1; min-width:0;">
          <div style="font-weight:700; font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${escHtml(v.name)} ${escHtml(v.surname)}
            <span style="font-size:11px; color:var(--t4); font-weight:400; margin-left:6px;">CI: ${v.ci} · ${escHtml(v.email || '')}</span>
          </div>
          <div style="margin-top:6px; display:flex; gap:5px; flex-wrap:wrap; align-items:center;">
            <span style="padding:2px 9px; border-radius:20px; font-weight:600; font-size:11px; background:var(--s2); border:1px solid var(--bdr);">${ROLE_LABEL[v.role] || v.role}</span>
            <span style="padding:2px 9px; border-radius:20px; font-weight:600; font-size:11px; background:var(--s2); border:1px solid var(--bdr);">${escHtml(_areaLabel(v.area))}</span>
            <span style="padding:2px 9px; border-radius:20px; font-weight:600; font-size:11px; ${v.active === false ? 'background:var(--red-bg);color:var(--red)' : 'background:var(--grn-bg,#ECFDF5);color:var(--green)'}">${v.active === false ? 'Inactivo' : 'Activo'}</span>
          </div>
        </div>
        <div style="display:flex; gap:6px; flex-shrink:0;">
          <button style="padding:7px 14px; font-size:12px; font-weight:600; border-radius:8px; background:var(--s2); border:1px solid var(--bdr); cursor:pointer; color:inherit; white-space:nowrap;" onclick="window.editVolunteer(${v.ci})">Editar</button>
          <button style="padding:7px 14px; font-size:12px; font-weight:600; border-radius:8px; background:var(--s2); border:1px solid var(--bdr); cursor:pointer; color:inherit; white-space:nowrap;" onclick="window.toggleActiveVolunteer(${v.ci}, ${v.active === false}, '${nombreEsc}')">${v.active === false ? 'Activar' : 'Desactivar'}</button>
          <button style="padding:7px 14px; font-size:12px; font-weight:600; border-radius:8px; background:var(--red-bg); border:1px solid #FCA5A5; color:var(--red); cursor:pointer; white-space:nowrap;" onclick="window.revokeVolunteer(${v.ci}, '${nombreEsc}')">Revocar</button>
        </div>
      </div>
    `;
    }).join('');
  } catch (err) {
    listEl.innerHTML = `<div class="reg-empty"><span class="reg-empty-t" style="color:var(--red);">${escHtml(err.message || 'Error al cargar usuarios')}</span></div>`;
  }
}
