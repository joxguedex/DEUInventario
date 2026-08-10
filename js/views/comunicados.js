// ── Comunicados — vista + controlador ─────────────────────
// Puente compartido con UCVAcopio/UCVComandas (misma tabla `comms`,
// new_schema_archive) — ver store.js. Cualquier usuario con acceso a esta
// plataforma (admin/coordinador, ver auth.js) puede publicar; solo un admin
// puede marcar un comunicado como resuelto.

import { store } from '../store.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { auth } from '../auth.js';
import { uid, escHtml, timeAgo, catLabel } from '../helpers.js';

// ── Autor automático + alcance (2026-07-28) ───────────────
// "Publicado por" ya no es texto libre: se arma solo de la sesión activa. Un
// admin no tiene área (siempre null) — de ahí el caso especial. Un
// coordinador de Inventario tiene como área una de las 13 categorías de
// insumos, o 'general' (coordinador sin categoría propia, ver
// documentation/05-autenticacion.md) — ninguna llega nunca con
// 'recepcion'/'sala situacional' (esas áreas quedan denegadas en esta
// plataforma, ver auth.js#DENIED_COORD_AREAS), así que catLabel() alcanza
// para todos los casos reales salvo 'general', que no está en CATS.
function _areaLabel() {
  if (auth.isAdmin()) return 'Administrador';
  const area = auth.area();
  if (area === 'general') return 'General';
  return catLabel(area);
}

function _computeAutor() {
  return `${auth.name() || 'Anónimo'} - ${_areaLabel()}`;
}

// Alcance por defecto para quien NO es admin: siempre 'toldos' — ningún
// coordinador con acceso real a esta plataforma tiene área
// 'recepcion'/'sala situacional' (platform-denied, ver auth.js), así que
// nunca hay forma de terminar en otro alcance por accidente. Solo un admin
// puede elegir 'general' (ver #cs, oculto para el resto).
function _defaultAlcance() {
  return 'toldos';
}

function _svg(paths, w = 14) {
  return `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;flex-shrink:0">${paths}</svg>`;
}
const ICO = {
  alerta: _svg(`<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`),
  clock:  _svg(`<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`),
  info:   _svg(`<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`),
  bellLg: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
};

let currentFilter = 'todos';

function tlItem(c) {
  const tc  = c.urgencia === 'critico' ? 'tag-red' : c.urgencia === 'urgente' ? 'tag-amber' : 'tag-blue';
  const tl  = c.urgencia === 'critico' ? `${ICO.alerta} Crítico`
            : c.urgencia === 'urgente' ? `${ICO.clock} Urgente`
            : `${ICO.info} Info`;
  const resolved  = !c.activo ? '<span class="tag tag-gray" style="margin-left:4px">Resuelto</span>' : '';
  const actionBtn = c.activo && auth.isAdmin()
    ? `<button class="btn btn-ghost btn-sm" data-action="resolve-comm" data-id="${escHtml(c.id)}">Marcar resuelto</button>`
    : '';
  return `<div class="tl-item ${c.urgencia}">
    <div class="tl-dot"></div>
    <div class="tl-card" style="${!c.activo ? 'opacity:0.65' : ''}">
      <div class="tl-top">
        <span class="tag ${tc}">${tl}</span>
        ${resolved}
        <span class="tl-title">${escHtml(c.titulo)}</span>
        <span class="tl-time">${timeAgo(c.fecha)}</span>
      </div>
      <div class="tl-body">${escHtml(c.cuerpo)}</div>
      <div class="tl-foot">
        <span class="tl-author">— ${escHtml(c.autor)}</span>
        ${actionBtn}
      </div>
    </div>
  </div>`;
}

export function renderComunicados(filter = currentFilter) {
  currentFilter = filter;
  const STATUS_ORDER = { critico: 0, urgente: 1, info: 2 };

  let list;
  if (filter === 'resueltos') {
    list = store.communications.filter(c => !c.activo);
  } else {
    list = store.communications.filter(c => c.activo && (filter === 'todos' || c.urgencia === filter));
  }

  const sorted = [...list].sort((a, b) => {
    if (filter === 'resueltos') return new Date(b.fecha) - new Date(a.fecha);
    const oa = STATUS_ORDER[a.urgencia] ?? 9;
    const ob = STATUS_ORDER[b.urgencia] ?? 9;
    return oa !== ob ? oa - ob : new Date(b.fecha) - new Date(a.fecha);
  });

  const emptyMsg = filter === 'resueltos' ? 'No hay comunicados resueltos aún' : 'No hay comunicados';
  const emptyTxt = filter === 'resueltos'
    ? 'Los avisos marcados como resueltos aparecerán aquí'
    : 'Publica uno con el botón de arriba';

  const listEl = document.getElementById('comm-list');
  if (!listEl) return;
  listEl.innerHTML = sorted.length
    ? `<div class="timeline">${sorted.map(c => tlItem(c)).join('')}</div>`
    : `<div class="empty">
        <div class="empty-ico">${ICO.bellLg}</div>
        <div class="empty-title">${emptyMsg}</div>
        <div class="empty-txt">${emptyTxt}</div>
      </div>`;
}

// ── Acciones ──────────────────────────────────────────────

async function resolveComm(id) {
  const c = store.communications.find(x => x.id === id); if (!c) return;
  try {
    await store.saveCommunication({ ...c, activo: false });
    renderComunicados();
    toast.ok('Comunicado marcado como resuelto');
  } catch (err) { toast.err(err.message); }
}

// Prepara el modal cada vez que se abre: autor recalculado (por si cambió de
// cuenta en el mismo dispositivo) y el selector de alcance solo visible para
// admin — el resto nunca elige, su alcance sale de _defaultAlcance().
function _openNewCommModal() {
  const autorEl = document.getElementById('ca');
  if (autorEl) autorEl.value = _computeAutor();
  const row = document.getElementById('cs-row');
  const sel = document.getElementById('cs');
  if (row) row.style.display = auth.isAdmin() ? '' : 'none';
  if (sel) sel.value = 'general';
  modal.open('m-comm');
}

// ── Init ──────────────────────────────────────────────────

let _initialized = false;

export function initComunicados() {
  refreshComunicados();

  if (_initialized) return;
  _initialized = true;

  setInterval(refreshComunicados, 25000);

  document.getElementById('btn-add-comm')?.addEventListener('click', _openNewCommModal);

  document.getElementById('comm-filters')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]'); if (!btn) return;
    document.querySelectorAll('#comm-filters .fbtn').forEach(b => b.className = 'fbtn');
    btn.classList.add(`fa-${btn.dataset.filter}`);
    renderComunicados(btn.dataset.filter);
  });

  document.getElementById('comm-list')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="resolve-comm"]'); if (!btn) return;
    resolveComm(btn.dataset.id);
  });

  document.querySelector('#m-comm [data-action="save-comm"]')?.addEventListener('click', async () => {
    try {
      const alcance = auth.isAdmin()
        ? (document.getElementById('cs')?.value || 'general')
        : _defaultAlcance();
      await store.saveCommunication({
        id:      uid(),
        titulo:  document.getElementById('ct').value.trim(),
        urgencia:document.getElementById('cu').value,
        cuerpo:  document.getElementById('cb').value.trim(),
        autor:   _computeAutor(),
        activo:  true,
        alcance,
        fecha:   Date.now(),
      });
      modal.close('m-comm');
      ['ct', 'cb'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      renderComunicados();
      toast.ok('Comunicado publicado');
    } catch (err) { toast.err(err.message); }
  });
}

function _updateBadge() {
  const n = store.activeCommunications.length;
  ['nb-comms', 'nb-comms-mobile'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = n > 99 ? '99+' : String(n);
    el.style.display = n > 0 ? '' : 'none';
  });
}

// ── Notificación de comunicados nuevos (sondeo cada 25s) ──────────────
// Mismo patrón que views/despachos.js: `_seenIds` arranca `null` (primera
// lectura tras cargar la página establece la línea base sin avisar del
// backlog completo); lo que aparece DESPUÉS dispara un toast. El fetch ya
// viene filtrado por alcance (general/toldos), así que un comunicado de otro
// sistema nunca llega hasta acá.
let _seenIds = null;

function _checkNuevos() {
  const activos = store.communications.filter(c => c.activo);
  const ids = new Set(activos.map(c => c.id));
  if (_seenIds !== null) {
    const nuevos = activos.filter(c => !_seenIds.has(c.id));
    if (nuevos.length === 1) toast.info(`Nuevo comunicado: ${nuevos[0].titulo}`);
    else if (nuevos.length > 1) toast.info(`${nuevos.length} comunicados nuevos.`);
  }
  _seenIds = ids;
}

export function refreshComunicados() {
  store.loadCommunications()
    .then(() => { _checkNuevos(); renderComunicados(); _updateBadge(); })
    .catch(err => {
      console.error('[comunicados] load', err);
      toast.err('No se pudieron cargar los comunicados — revisa tu conexión');
    });
}
