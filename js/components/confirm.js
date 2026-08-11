// ── Modal de confirmación/prompt reutilizable ──────────────
// Reemplaza confirm()/prompt() nativos del navegador en todo el sistema —
// mismo lenguaje visual (adm-ov/adm-box) que los demás modales de la app,
// como componente único y compartido en vez de reimplementar el overlay en
// cada vista. Basado en Promises: `await confirmDialog(...)` se resuelve
// cuando el usuario responde (true/false), igual que confirm() pero sin
// bloquear el hilo ni verse como un cuadro del sistema operativo.
//
// `title`/`body` se insertan como HTML tal cual — igual que el resto de los
// modales de esta app, quien llama es responsable de escapar cualquier dato
// interpolado (ver helpers.js#escHtml).

import { escHtml } from '../helpers.js';

let _ov = null;

function _ensureOv() {
  if (_ov) return _ov;
  _ov = document.createElement('div');
  _ov.id = 'confirm-modal';
  // z-index más alto que .adm-ov (100): un confirm puede dispararse desde
  // DENTRO de otro modal ya abierto (p.ej. "Eliminar" en Editar insumo) y
  // siempre debe quedar por encima de él, sin importar cuál se creó primero.
  _ov.className = 'adm-ov confirm-ov';
  document.body.appendChild(_ov);
  return _ov;
}

export function confirmDialog({ title = '¿Confirmar?', body = '', confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false } = {}) {
  return new Promise(resolve => {
    const ov = _ensureOv();
    ov.innerHTML = `
      <div class="adm-box">
        <div class="adm-head"><div class="adm-title">${title}</div></div>
        ${body ? `<div class="adm-note" style="margin-top:0;margin-bottom:16px">${body}</div>` : ''}
        <div class="adm-actions-row">
          <button class="adm-btn" id="confirm-cancel">${escHtml(cancelText)}</button>
          <button class="adm-btn ${danger ? 'adm-btn-danger' : 'adm-btn-primary'}" id="confirm-ok">${escHtml(confirmText)}</button>
        </div>
      </div>`;
    ov.classList.add('open');

    const finish = result => {
      ov.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onKey = e => { if (e.key === 'Escape') finish(false); };
    document.addEventListener('keydown', onKey);
    ov.onclick = e => { if (e.target === ov) finish(false); };
    ov.querySelector('#confirm-cancel').onclick = () => finish(false);
    const okBtn = ov.querySelector('#confirm-ok');
    okBtn.onclick = () => finish(true);
    okBtn.focus();
  });
}

export function promptDialog({ title = '', label = '', value = '', confirmText = 'Guardar', cancelText = 'Cancelar' } = {}) {
  return new Promise(resolve => {
    const ov = _ensureOv();
    ov.innerHTML = `
      <div class="adm-box">
        <div class="adm-head"><div class="adm-title">${title}</div></div>
        <div class="adm-field">
          ${label ? `<label>${label}</label>` : ''}
          <input id="prompt-input" type="text" value="${escHtml(value)}" autocomplete="off">
        </div>
        <div class="adm-actions-row">
          <button class="adm-btn" id="prompt-cancel">${escHtml(cancelText)}</button>
          <button class="adm-btn adm-btn-primary" id="prompt-ok">${escHtml(confirmText)}</button>
        </div>
      </div>`;
    ov.classList.add('open');
    const inp = ov.querySelector('#prompt-input');

    const finish = result => {
      ov.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onKey = e => {
      if (e.key === 'Escape') finish(null);
      // Solo si el foco está en el input: si está en "Cancelar", Enter debe
      // activar ESE botón (comportamiento nativo), no enviar el valor.
      if (e.key === 'Enter' && document.activeElement === inp) finish(inp.value);
    };
    document.addEventListener('keydown', onKey);
    ov.onclick = e => { if (e.target === ov) finish(null); };
    ov.querySelector('#prompt-cancel').onclick = () => finish(null);
    ov.querySelector('#prompt-ok').onclick = () => finish(inp.value);
    setTimeout(() => { inp.focus(); inp.select(); }, 50);
  });
}
