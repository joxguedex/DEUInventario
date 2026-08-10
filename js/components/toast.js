// ── Toast minimalista ─────────────────────────────────────
let _wrap = null;
function _ensure() {
  if (_wrap) return _wrap;
  _wrap = document.createElement('div');
  _wrap.className = 'toast-wrap';
  document.body.appendChild(_wrap);
  return _wrap;
}
function _show(msg, kind, sticky = false) {
  const w = _ensure();
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  
  const span = document.createElement('span');
  span.textContent = msg;
  el.appendChild(span);
  
  if (sticky) {
    el.classList.add('sticky');
    const btn = document.createElement('button');
    btn.className = 'toast-close';
    btn.innerHTML = '✕';
    btn.onclick = () => {
      el.classList.remove('in');
      setTimeout(() => el.remove(), 250);
    };
    el.appendChild(btn);
  }
  
  w.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  
  if (!sticky) {
    setTimeout(() => {
      if (el.parentElement) {
        el.classList.remove('in');
        setTimeout(() => el.remove(), 250);
      }
    }, 2600);
  }
}
export const toast = {
  ok:  (m, sticky = false) => _show(m, 'ok', sticky),
  err: (m, sticky = false) => _show(m, 'err', sticky),
  info:(m, sticky = false) => _show(m, 'info', sticky),
};
