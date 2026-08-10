// ── Hub de gestión de usuarios (admin + coordinador) ──────
// Reescritura completa (02-inventario.md §3): el modelo viejo (status/turno/
// departamento sobre `persons`, Supabase Auth con email sintético `${ci}@ucv.ve`)
// deja de existir. Ahora gestiona person_credentials (rol/área) de TODO el
// sistema vía las RPC create_user/update_user_role/delete_user/list_users
// (new_schema_archive) — mismas RPC que usan UCVAcopio/UCVComandas.

import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';
import { DB_SCHEMA } from '../env-config.js';
import { toast } from '../components/toast.js';
import { auth } from '../auth.js';
import { CATS, catLabel } from '../helpers.js';

const AREAS_FIJAS = ['recepcion', 'sala situacional', 'general'];

// Áreas de coordinación por categoría de insumos (Despachos, ver
// documentation/04-vistas-ui.md "Despachos"): deben coincidir exacto con
// `products.type` para que list_despachos_pendientes resuelva el alcance del
// coordinador — de ahí que ya no sea texto libre. Las 13 categorías vigentes
// (helpers.js#CATS) son, todas, áreas de despacho válidas — a diferencia del
// enum viejo, ya no existe una categoría catch-all tipo "otros" que excluir.
const AREAS_CATEGORIA = Object.keys(CATS);

// Un mismo <select> para las 2 áreas fijas + "General" + una por cada
// categoría despachable. `selected` puede ser un valor legado que ya no es
// válido (un texto libre de antes de esta restricción) — en ese caso se
// agrega como opción temporal para no reasignarlo en silencio si se guarda
// sin tocarlo.
function _areaOptionsHTML(selected) {
  const base = `
    <option value="recepcion">Recepción (Acopio)</option>
    <option value="sala situacional">Sala situacional (Comandas)</option>
    <option value="general">General (solo consulta + despacho de cualquier área)</option>
    <optgroup label="Coordinación por categoría (Despachos)">
      ${AREAS_CATEGORIA.map(c => `<option value="${c}">${catLabel(c)}</option>`).join('')}
    </optgroup>`;
  if (selected && !AREAS_FIJAS.includes(selected) && !AREAS_CATEGORIA.includes(selected)) {
    return `<option value="${selected}">${selected} (valor anterior — elige uno nuevo)</option>` + base;
  }
  return base;
}

const PHONE_PREFIXES = ['0412', '0414', '0416', '0422', '0424', '0426'];
function _phoneCodeOptionsHTML(selected) {
  return PHONE_PREFIXES.map(p => `<option value="${p}" ${p === selected ? 'selected' : ''}>${p}</option>`).join('');
}

function _headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Content-Profile': DB_SCHEMA,
  };
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

let loaded = false;
let loadedAsAdmin = null; // rol con el que se construyó el DOM actual — si cambia (login/logout sin recargar), hay que reconstruir

export function renderVoluntarios(container) {
  const isAdmin = auth.isAdmin();
  if (!loaded || loadedAsAdmin !== isAdmin) {
    loadedAsAdmin = isAdmin;
    container.innerHTML = `
      <div class="reg-wrap">
        <div class="cnt-topcard">
          <div class="ctc-progress-head">
            <span class="ctc-progress-title">${isAdmin ? 'Gestión de Usuarios' : 'Mis Voluntarios'}</span>
          </div>
          <form id="vol-form" class="adm-cp-list" style="gap: 12px; margin-top: 14px;">
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
                <input type="text" id="vol-telf" required pattern="^[0-9]{7}$" placeholder="1234567">
              </div>
              <div class="adm-field" style="flex:1;">
                <label>Contraseña</label>
                <input type="password" id="vol-pass" required placeholder="Contraseña">
              </div>
            </div>
            ${isAdmin ? `
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <div class="adm-field" style="flex:1;">
                <label>Rol</label>
                <select id="vol-role" style="width:100%; padding:12px; border:1.5px solid var(--bdr); border-radius:var(--r-sm); background:var(--s2);">
                  <option value="voluntario">Voluntario</option>
                  <option value="coordinador">Coordinador</option>
                </select>
              </div>
              <div class="adm-field" style="flex:1;">
                <label>Área</label>
                <select id="vol-area" style="width:100%; padding:12px; border:1.5px solid var(--bdr); border-radius:var(--r-sm); background:var(--s2);">
                  ${_areaOptionsHTML()}
                </select>
              </div>
            </div>` : `
            <div class="adm-note" style="margin:0;">Se crea como voluntario de tu misma área (${auth.area() || '—'}).</div>
            `}
            <button type="submit" class="adm-btn adm-btn-primary" id="vol-submit">Registrar Usuario</button>
          </form>
        </div>

        <div class="reg-list" id="vol-list" style="margin-top:20px;">
          <div class="reg-empty"><span class="reg-empty-t">Cargando usuarios...</span></div>
        </div>
      </div>

      <!-- Edit Modal (solo admin: nombre/apellido/teléfono/rol/área/contraseña) -->
      <div id="vol-edit-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:999; justify-content:center; align-items:center;">
        <div style="background:var(--bg); padding:20px; border-radius:8px; width:90%; max-width:420px; border:1px solid var(--bdr); max-height:90vh; overflow-y:auto;">
          <h3 style="margin-top:0;">Editar usuario</h3>
          <div style="margin-bottom:12px; font-size:12px; color:var(--t4);" id="vol-edit-name"></div>
          <form id="vol-edit-form" style="display:flex; flex-direction:column; gap:12px;">
            <input type="hidden" id="vol-edit-ci">
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
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
                  ${_phoneCodeOptionsHTML()}
                </select>
              </div>
              <div class="adm-field" style="flex:1;">
                <label>Teléfono (7 dígitos)</label>
                <input type="text" id="vol-edit-telf" required pattern="^[0-9]{7}$" placeholder="1234567">
              </div>
            </div>
            <div class="adm-field">
              <label>Rol</label>
              <select id="vol-edit-role" style="width:100%; padding:12px; border:1.5px solid var(--bdr); border-radius:var(--r-sm); background:var(--s2);">
                <option value="voluntario">Voluntario</option>
                <option value="coordinador">Coordinador</option>
              </select>
            </div>
            <div class="adm-field">
              <label>Área</label>
              <select id="vol-edit-area" style="width:100%; padding:12px; border:1.5px solid var(--bdr); border-radius:var(--r-sm); background:var(--s2);">
              </select>
            </div>
            <div class="adm-field">
              <label>Nueva contraseña (opcional)</label>
              <input type="password" id="vol-edit-pass" placeholder="Dejar en blanco para no cambiarla" autocomplete="new-password">
            </div>
            <div style="display:flex; gap:10px; margin-top:4px;">
              <button type="button" class="adm-btn" id="vol-edit-cancel" style="flex:1;">Cancelar</button>
              <button type="submit" class="adm-btn adm-btn-primary" id="vol-edit-submit" style="flex:1;">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('vol-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('vol-submit');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      try {
        const ci = parseInt(document.getElementById('vol-ci').value, 10);
        const name = document.getElementById('vol-nombre').value.trim();
        const surname = document.getElementById('vol-apellido').value.trim();
        const password = document.getElementById('vol-pass').value;
        const phoneCode = document.getElementById('vol-cod').value;
        const phoneNum = document.getElementById('vol-telf').value.trim();

        let role = 'voluntario', area = auth.area();
        if (auth.isAdmin()) { // re-chequeo en vivo: no confiar en el `isAdmin` capturado al construir el formulario
          role = document.getElementById('vol-role').value;
          area = document.getElementById('vol-area').value;
          if (!area) throw new Error('Indica el área.');
        }

        await _rpc('create_user', {
          p_actor_ci: auth.ci(), p_ci: ci, p_password: password,
          p_name: name, p_surname: surname,
          p_role: role, p_area: area,
          p_phone_company_code: phoneCode, p_phone_number: phoneNum,
        });

        toast.ok('Usuario creado.');
        document.getElementById('vol-form').reset();
        await loadVolunteers();
      } catch (err) {
        toast.err(err.message || 'Ocurrió un error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Registrar Usuario';
      }
    });

    document.getElementById('vol-edit-cancel').addEventListener('click', () => {
      document.getElementById('vol-edit-modal').style.display = 'none';
    });

    document.getElementById('vol-edit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!auth.isAdmin()) return; // solo admin edita usuarios — el botón que abre este modal ya está oculto para coordinador, esto es respaldo
      const btn = document.getElementById('vol-edit-submit');
      btn.disabled = true;
      btn.textContent = 'Guardando...';
      try {
        const ci = parseInt(document.getElementById('vol-edit-ci').value, 10);
        const role = document.getElementById('vol-edit-role').value;
        const area = document.getElementById('vol-edit-area').value;
        const nombre = document.getElementById('vol-edit-nombre').value.trim();
        const apellido = document.getElementById('vol-edit-apellido').value.trim();
        const phoneCode = document.getElementById('vol-edit-cod').value;
        const phoneNum = document.getElementById('vol-edit-telf').value.trim();
        const nuevaPass = document.getElementById('vol-edit-pass').value;

        if (!nombre || !apellido) throw new Error('Nombre y apellido son obligatorios.');
        if (!/^[0-9]{7}$/.test(phoneNum)) throw new Error('El teléfono debe tener 7 dígitos.');
        if (nuevaPass && nuevaPass.length < 6) throw new Error('La contraseña nueva debe tener al menos 6 caracteres.');

        // 3 RPC independientes (rol/área, perfil, contraseña) — cada una es su
        // propio punto de escritura en el servidor (person_credentials vs.
        // persons/phones), mismo criterio que create_user/update_user_role.
        await _rpc('update_user_role', { p_actor_ci: auth.ci(), p_target_ci: ci, p_role: role, p_area: area });
        await _rpc('admin_update_user_profile', {
          p_actor_ci: auth.ci(), p_target_ci: ci,
          p_name: nombre, p_surname: apellido,
          p_phone_company_code: phoneCode, p_phone_number: phoneNum,
        });
        if (nuevaPass) {
          await _rpc('admin_reset_password', { p_actor_ci: auth.ci(), p_target_ci: ci, p_new_password: nuevaPass });
        }

        toast.ok('Usuario actualizado.');
        document.getElementById('vol-edit-modal').style.display = 'none';
        await loadVolunteers();
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
      document.getElementById('vol-edit-ci').value = v.ci;
      document.getElementById('vol-edit-name').textContent = `CI: ${v.ci}`;
      document.getElementById('vol-edit-nombre').value = v.name || '';
      document.getElementById('vol-edit-apellido').value = v.surname || '';
      document.getElementById('vol-edit-cod').value = v.phone_company_code || '0412';
      document.getElementById('vol-edit-telf').value = v.phone_number || '';
      document.getElementById('vol-edit-pass').value = '';
      document.getElementById('vol-edit-role').value = v.role;
      document.getElementById('vol-edit-area').innerHTML = _areaOptionsHTML(v.area);
      document.getElementById('vol-edit-area').value = v.area;
      document.getElementById('vol-edit-modal').style.display = 'flex';
    };

    window.deleteVolunteer = async function (ci, label) {
      if (!confirm(`¿Eliminar a ${label}? Pierde acceso al sistema de inmediato.`)) return;
      try {
        await _rpc('delete_user', { p_actor_ci: auth.ci(), p_target_ci: ci });
        toast.ok('Usuario eliminado.');
        await loadVolunteers();
      } catch (err) {
        toast.err(err.message || 'Error al eliminar');
      }
    };

    loaded = true;
  }

  loadVolunteers();
}

const ROLE_LABEL = { coordinador: 'Coordinador', voluntario: 'Voluntario' };

// Última respuesta de list_users, para que editVolunteer(ci) precargue
// nombre/apellido/teléfono sin otra ida y vuelta al servidor.
let _lastUsers = [];

async function loadVolunteers() {
  const listEl = document.getElementById('vol-list');
  const isAdmin = auth.isAdmin();
  try {
    const data = await _rpc('list_users', { p_actor_ci: auth.ci() });
    _lastUsers = data;

    if (!data.length) {
      listEl.innerHTML = `<div class="reg-empty"><span class="reg-empty-t">No hay usuarios${isAdmin ? '' : ' en tu área'} todavía</span></div>`;
      return;
    }

    listEl.innerHTML = data.map(v => `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px;
        margin-bottom: 10px;
        background: var(--s1, #fff);
        border: 1px solid var(--bdr);
        border-radius: 12px;
        gap: 12px;
      ">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${v.name} ${v.surname}
            <span style="font-size: 11px; color: var(--t4); font-weight: 400; margin-left: 6px;">CI: ${v.ci}</span>
          </div>
          <div style="margin-top: 6px; display: flex; gap: 5px; flex-wrap: wrap; align-items: center;">
            <span style="padding: 2px 9px; border-radius: 20px; font-weight: 600; font-size: 11px; background: var(--s2); border: 1px solid var(--bdr);">${ROLE_LABEL[v.role] || v.role}</span>
            ${v.area ? `<span style="padding: 2px 9px; border-radius: 20px; font-weight: 600; font-size: 11px; background: var(--s2); border: 1px solid var(--bdr);">${v.area}</span>` : ''}
          </div>
        </div>
        <div style="display:flex; gap:6px; flex-shrink:0;">
          ${isAdmin ? `
          <button
            style="padding: 7px 14px; font-size: 12px; font-weight: 600; border-radius: 8px; background: var(--s2); border: 1px solid var(--bdr); cursor: pointer; color: inherit; white-space: nowrap;"
            onclick="window.editVolunteer(${v.ci})"
          >Editar</button>` : ''}
          <button
            style="padding: 7px 14px; font-size: 12px; font-weight: 600; border-radius: 8px; background: var(--red-bg); border: 1px solid #FCA5A5; color: var(--red); cursor: pointer; white-space: nowrap;"
            onclick="window.deleteVolunteer(${v.ci}, '${v.name.replace(/'/g, "\\'")} ${v.surname.replace(/'/g, "\\'")}')"
          >Eliminar</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    listEl.innerHTML = `<div class="reg-empty"><span class="reg-empty-t" style="color:var(--red);">${err.message || 'Error al cargar usuarios'}</span></div>`;
  }
}
