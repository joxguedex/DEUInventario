// ── Grupos de extensión (super_admin-only) ────────────────────────────────
// Antes vivía como una sección más adentro del panel de cuenta (ver
// views/admin.js), mezclada con "Mi perfil"/"Cambiar contraseña" — quedaba
// difícil de encontrar para dar de alta una organización entera. Ahora es su
// propia pestaña de nav, exclusiva de super_admin (ver app.js#applyRBAC).
// create_grupo/update_grupo viven en supabase/new-project-schema.sql §8b.

import { store } from '../store.js';
import { auth } from '../auth.js';
import { escHtml } from '../helpers.js';
import { toast } from '../components/toast.js';
import { promptDialog } from '../components/confirm.js';

// onChange: repinta el selector de grupo del topnav (ver app.js#_paintGrupoSwitch).
// onManage(id): "Gestionar" — el llamador decide qué significa eso (hoy,
// elegir ese grupo arriba y saltar a la pestaña Usuarios).
export function renderGrupos(container, { onChange, onManage } = {}) {
  if (!auth.isSuperAdmin()) {
    container.innerHTML = `
      <div class="reg-wrap"><div class="reg-empty">
        <div class="reg-empty-t">Solo para super administradores</div>
        <div class="reg-empty-s">La gestión de grupos de extensión es exclusiva de super administradores.</div>
      </div></div>`;
    return;
  }

  container.innerHTML = `
    <div class="reg-wrap">
      <div class="cnt-topcard">
        <div class="ctc-progress-head"><span class="ctc-progress-title">Grupos de extensión</span></div>
        <div class="adm-note" style="margin:6px 0 14px;">Cada grupo lleva su propio inventario, usuarios, categorías y comunicados, sin ver el de los demás. Elegí "Gestionar" para pasar a administrar sus usuarios y categorías.</div>
        <div class="adm-cp-list" id="grp-list">
          <div class="adm-cp-empty">Cargando grupos...</div>
        </div>
        <form id="grp-form" style="display:flex; gap:8px; margin-top:14px;">
          <input class="adm-field" style="flex:1; margin:0;" id="grp-nombre" placeholder="Nombre del grupo nuevo" maxlength="100">
          <button type="submit" class="adm-mini">+ Crear grupo</button>
        </form>
      </div>
    </div>`;

  _wire(container, { onChange, onManage });
}

async function _wire(container, { onChange, onManage }) {
  await store.loadGrupos();
  _paintList(container, { onChange, onManage });

  container.querySelector('#grp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inp = container.querySelector('#grp-nombre');
    const nombre = inp.value.trim();
    if (!nombre) return;
    try {
      await store.createGrupo(nombre);
      inp.value = '';
      _paintList(container, { onChange, onManage });
      onChange?.();
      toast.ok('Grupo creado.');
    } catch (ex) {
      toast.err(ex.message || 'No se pudo crear el grupo.');
    }
  });
}

function _paintList(container, { onChange, onManage }) {
  const box = container.querySelector('#grp-list');
  if (!box) return;
  if (!store.grupos.length) { box.innerHTML = `<div class="adm-cp-empty">Sin grupos todavía — crea el primero abajo.</div>`; return; }

  const grupos = [...store.grupos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const activo = store.viewingGrupoId;
  box.innerHTML = grupos.map(g => `
    <div class="adm-cp" data-id="${g.id}">
      <div class="adm-cp-info">
        <div class="adm-cp-date">${escHtml(g.nombre)}${String(g.id) === String(activo) ? ' <span style="color:var(--amber);">· en gestión</span>' : ''}</div>
      </div>
      <div style="display:flex; gap:8px; flex-shrink:0;">
        <button class="adm-mini" data-manage-grupo="${g.id}">Gestionar</button>
        <button class="adm-mini" data-rename-grupo="${g.id}">Renombrar</button>
      </div>
    </div>`).join('');

  box.querySelectorAll('[data-manage-grupo]').forEach(b => b.addEventListener('click', () => {
    onManage?.(Number(b.dataset.manageGrupo));
  }));

  box.querySelectorAll('[data-rename-grupo]').forEach(b => b.addEventListener('click', async () => {
    const g = store.grupos.find(x => String(x.id) === b.dataset.renameGrupo);
    const nuevo = await promptDialog({
      title: 'Renombrar grupo de extensión',
      label: 'Nuevo nombre',
      value: g?.nombre || '',
      confirmText: 'Renombrar',
    });
    if (nuevo == null) return;
    const val = nuevo.trim();
    if (!val || val === g.nombre) return;
    try {
      await store.renameGrupo(g.id, val);
      _paintList(container, { onChange, onManage });
      onChange?.();
      toast.ok('Grupo renombrado.');
    } catch (ex) {
      toast.err(ex.message || 'No se pudo renombrar el grupo.');
    }
  }));
}
