// ── Modal manager ─────────────────────────────────────────

class ModalManager {
  open(id)  { document.getElementById(id)?.classList.add('open'); }
  close(id) { document.getElementById(id)?.classList.remove('open'); }

  closeAll() {
    document.querySelectorAll('.modal-ov.open').forEach(m => m.classList.remove('open'));
  }

  init() {
    // Cerrar al hacer clic en el overlay
    document.querySelectorAll('.modal-ov').forEach(ov => {
      ov.addEventListener('click', e => { if (e.target === ov) this.closeAll(); });
    });
    // Cerrar con Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeAll();
    });
    // Cerrar con data-close="id-modal" en cualquier botón
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-close]');
      if (btn) this.close(btn.dataset.close);
    });
  }
}

export const modal = new ModalManager();
