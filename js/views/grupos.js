// ── Grupos de extensión (super_admin-only) ────────────────────────────────
// Antes vivía como una sección más adentro del panel de cuenta (ver
// views/admin.js), mezclada con "Mi perfil"/"Cambiar contraseña" — quedaba
// difícil de encontrar para dar de alta una organización entera. Ahora es su
// propia pestaña de nav, exclusiva de super_admin (ver app.js#applyRBAC).
// create_grupo/update_grupo viven en supabase/new-project-schema.sql §8b.

import { store } from '../store.js';
import { auth } from '../auth.js';
import { escHtml, catColor } from '../helpers.js';
import { toast } from '../components/toast.js';
import { openEditGrupoModal } from './admin.js';

// onChange: repinta el selector de grupo del topnav (ver app.js#_paintGrupoSwitch).
export function renderGrupos(container, { onChange } = {}) {
  if (!auth.isSuperAdmin()) {
    container.innerHTML = `
      <div class="reg-wrap"><div class="reg-empty">
        <div class="reg-empty-t">Solo para super administradores</div>
        <div class="reg-empty-s">La gestión de grupos de extensión es exclusiva de super administradores.</div>
      </div></div>`;
    return;
  }

  container.innerHTML = `
    <div class="reg-wrap" style="max-width:820px;">
      <div class="sec-header">
        <div>
          <div class="sec-eyebrow">Super administrador</div>
          <div class="sec-title">Grupos de extensión</div>
          <div class="sec-sub">Cada grupo lleva su propio inventario, usuarios, categorías y comunicados, sin ver el de los demás.</div>
        </div>
      </div>

      <div class="stats-cards" style="grid-template-columns:repeat(2,1fr); margin-bottom:18px;">
        <div class="stat-card stat-card-total"><div class="stat-card-num" id="grp-stat-total">–</div><div class="stat-card-lbl">grupos totales</div></div>
        <div class="stat-card stat-card-ok"><div class="stat-card-num" id="grp-stat-activo" style="font-size:1.1rem;">–</div><div class="stat-card-lbl">en gestión ahora</div></div>
      </div>

      <div class="stats-panel">
        <div class="stats-panel-title">Todos los grupos</div>
        <div class="grp-list" id="grp-list">
          <div class="reg-empty"><span class="reg-empty-t">Cargando grupos...</span></div>
        </div>
      </div>

      <div class="grp-create">
        <div class="stats-panel-title" style="margin-bottom:0;">+ Crear grupo nuevo</div>
        <form id="grp-form" class="grp-create-row">
          <div class="adm-field">
            <input id="grp-nombre" placeholder="Nombre del grupo (ej. Facultad de Medicina)" maxlength="100">
          </div>
          <button type="submit" class="btn btn-amber">+ Crear grupo</button>
        </form>
      </div>
    </div>`;

  _wire(container, { onChange });
}

function _initial(nombre) {
  return (nombre || '?').trim().charAt(0).toUpperCase() || '?';
}

async function _wire(container, { onChange }) {
  await store.loadGrupos();
  _paintList(container, { onChange });

  container.querySelector('#grp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inp = container.querySelector('#grp-nombre');
    const nombre = inp.value.trim();
    if (!nombre) return;
    try {
      await store.createGrupo(nombre);
      inp.value = '';
      _paintList(container, { onChange });
      onChange?.();
      toast.ok('Grupo creado.');
    } catch (ex) {
      toast.err(ex.message || 'No se pudo crear el grupo.');
    }
  });
}

function _paintList(container, { onChange }) {
  const box = container.querySelector('#grp-list');
  const statTotal = container.querySelector('#grp-stat-total');
  const statActivo = container.querySelector('#grp-stat-activo');
  if (!box) return;

  const activo = store.viewingGrupoId;
  const grupos = [...store.grupos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  if (statTotal) statTotal.textContent = grupos.length.toLocaleString('es-VE');
  if (statActivo) {
    const g = grupos.find(x => String(x.id) === String(activo));
    statActivo.textContent = g ? g.nombre : 'Todos';
  }

  if (!grupos.length) {
    box.innerHTML = `<div class="reg-empty">
      <div class="reg-empty-t">Sin grupos todavía</div>
      <div class="reg-empty-s">Creá el primero con el formulario de abajo — cada organización que use este sistema necesita el suyo.</div>
    </div>`;
    return;
  }

  box.innerHTML = grupos.map(g => {
    const isActive = String(g.id) === String(activo);
    return `
    <div class="grp-card${isActive ? ' active' : ''}" data-id="${g.id}">
      <div class="grp-ico" style="background:${catColor(g.id)}">${escHtml(_initial(g.nombre))}</div>
      <div class="grp-main">
        <div class="grp-name">${escHtml(g.nombre)}</div>
        ${isActive ? `<div class="grp-badge"><span class="grp-badge-dot"></span>En gestión ahora</div>` : ''}
      </div>
      <div class="grp-actions">
        <button class="btn btn-amber" data-edit-grupo="${g.id}">Editar</button>
      </div>
    </div>`;
  }).join('');

  box.querySelectorAll('[data-edit-grupo]').forEach(b => b.addEventListener('click', () => {
    const g = store.grupos.find(x => String(x.id) === b.dataset.editGrupo);
    if (!g) return;
    openEditGrupoModal(g, {
      onChange: () => { _paintList(container, { onChange }); onChange?.(); },
    });
  }));
}
