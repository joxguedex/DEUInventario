// ── Revisar y subir MI conteo ─────────────────────────────
// Compara lo que este teléfono tiene contado contra lo que hay en la
// nube y sube SOLO las diferencias de los insumos que yo conté.
//
// Por qué existe: la sincronización normal sube deltas por una cola. Si
// esa cola se pierde (el navegador desaloja el almacenamiento, una
// subida se descartó por un error del servidor), el teléfono queda con
// el número bueno y la nube con uno viejo, y no hay nada encolado que
// lo arregle. Recontar todo no es opción con 1674 insumos.
//
// Las dos reglas que la hacen segura:
//   1. Un insumo que YO no conté no se toca jamás. Si otro voluntario ya
//      lo contó, su número queda intacto.
//   2. Si la nube va ADELANTE de mi número, viene desmarcado y avisado:
//      casi siempre significa que alguien más contó ese insumo después,
//      y subir mi número lo bajaría.

import { store } from '../store.js';
import { sync }  from '../sync.js';
import { escHtml } from '../helpers.js';
import { toast } from '../components/toast.js';

let _onDone = null;

export function initRevision({ onDone } = {}) { _onDone = onDone; }

function _modal(html) {
  let ov = document.getElementById('rev-modal');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'rev-modal';
    ov.className = 'adm-ov';
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) _close(); });
  }
  ov.innerHTML = html;
  ov.classList.add('open');
  ov.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', _close));
  return ov;
}
function _close() { document.getElementById('rev-modal')?.classList.remove('open'); }

function _cabecera(sub) {
  return `<div class="adm-head">
      <div>
        <div class="adm-title">Revisar mi conteo</div>
        <div class="adm-sub">${escHtml(sub)}</div>
      </div>
      <button class="adm-x" data-close>&times;</button>
    </div>`;
}

export async function abrirRevision() {
  if (!sync.enabled) { toast.info('La nube no está configurada — trabajando solo en local.'); return; }

  _modal(`<div class="adm-box adm-box-lg">
      ${_cabecera('Comparando con la nube…')}
      <div class="rev-load">Buscando diferencias entre tu teléfono y la nube…</div>
    </div>`);

  let nube;
  try {
    nube = await sync.fetchCloudState();
  } catch {
    const e = sync.lastError || { titulo: 'No se pudo comparar', texto: 'Revisa tu conexión e inténtalo de nuevo.' };
    _modal(`<div class="adm-box adm-box-lg">
        ${_cabecera('No se pudo comparar')}
        <div class="rev-err">
          <div class="rev-err-t">${escHtml(e.titulo)}</div>
          <div class="rev-err-x">${escHtml(e.texto)}</div>
        </div>
        <button class="adm-btn" data-close>Cerrar</button>
      </div>`);
    return;
  }

  // Solo lo que YO conté en este teléfono. Lo demás no se mira siquiera.
  const mios = store.items.filter(i => i.contado && !i.deleted_at);
  const iguales = [], subir = [], nubeAdelante = [];

  for (const it of mios) {
    const remoto = nube.get(it.id);
    // Insumo creado aquí que todavía no existe allá: se sube completo.
    const enNube = remoto ? remoto.qnty : 0;
    const dif = (it.cantidad || 0) - enNube;
    if (dif === 0) { iguales.push(it); continue; }
    const fila = { it, mio: it.cantidad || 0, enNube, dif };
    (dif > 0 ? subir : nubeAdelante).push(fila);
  }

  subir.sort((a, b) => b.dif - a.dif);
  nubeAdelante.sort((a, b) => a.dif - b.dif);

  if (!subir.length && !nubeAdelante.length) {
    _modal(`<div class="adm-box adm-box-lg">
        ${_cabecera('Todo coincide')}
        <div class="rev-ok">
          <div class="rev-ok-ico">✓</div>
          <div class="rev-ok-t">Tu conteo ya está completo en la nube</div>
          <div class="rev-ok-x">Los ${iguales.length} insumos que contaste en este teléfono
            tienen la misma cantidad allá. No hay nada que subir.</div>
        </div>
        <button class="adm-btn" data-close>Cerrar</button>
      </div>`);
    return;
  }

  const filaHTML = (f, marcado, aviso) => `
    <label class="rev-row${aviso ? ' rev-row-warn' : ''}">
      <input type="checkbox" data-id="${escHtml(f.it.id)}" data-dif="${f.dif}" ${marcado ? 'checked' : ''}>
      <span class="rev-nom">${escHtml(f.it.nombre)}</span>
      <span class="rev-nums">
        <span class="rev-mio">tú: <b>${f.mio}</b></span>
        <span class="rev-arrow">→</span>
        <span class="rev-nube">nube: <b>${f.enNube}</b></span>
      </span>
    </label>`;

  _modal(`<div class="adm-box adm-box-lg">
      ${_cabecera(`${iguales.length} ya coinciden · ${subir.length + nubeAdelante.length} con diferencia`)}

      ${subir.length ? `
      <div class="rev-sec">
        <div class="rev-sec-t">Falta subir <span class="rev-badge">${subir.length}</span></div>
        <div class="rev-sec-x">Contaste más de lo que la nube tiene registrado. Al subir,
          la nube queda igual que tu teléfono.</div>
        <div class="rev-list">${subir.map(f => filaHTML(f, true, false)).join('')}</div>
      </div>` : ''}

      ${nubeAdelante.length ? `
      <div class="rev-sec">
        <div class="rev-sec-t rev-sec-warn">Cuidado <span class="rev-badge rev-badge-warn">${nubeAdelante.length}</span></div>
        <div class="rev-sec-x">Aquí la nube tiene <b>más</b> que tu teléfono. Lo más probable
          es que otro voluntario haya contado estos insumos después que tú. Si los marcas,
          <b>bajarás</b> la cantidad al número de tu teléfono. Solo márcalos si estás
          seguro de que tu conteo es el bueno.</div>
        <div class="rev-list">${nubeAdelante.map(f => filaHTML(f, false, true)).join('')}</div>
      </div>` : ''}

      <div class="rev-foot">
        <button class="adm-btn adm-btn-primary" id="rev-go">Subir seleccionados</button>
        <button class="adm-btn" data-close>Cancelar</button>
      </div>
      <div class="adm-note">Los insumos que tú no contaste no se tocan.</div>
    </div>`);

  const ov = document.getElementById('rev-modal');
  const btn = ov.querySelector('#rev-go');
  const marcar = () => {
    const n = ov.querySelectorAll('input[type=checkbox]:checked').length;
    btn.textContent = n ? `Subir ${n} insumo${n > 1 ? 's' : ''}` : 'Nada seleccionado';
    btn.disabled = !n;
  };
  ov.querySelectorAll('input[type=checkbox]').forEach(c => c.addEventListener('change', marcar));
  marcar();

  btn.addEventListener('click', async () => {
    const sel = [...ov.querySelectorAll('input[type=checkbox]:checked')]
      .map(c => ({ id: c.dataset.id, dif: Number(c.dataset.dif) }));
    if (!sel.length) return;

    btn.disabled = true; btn.textContent = 'Subiendo…';
    for (const s of sel) await store.subirDiferencia(s.id, s.dif);

    await sync.run();
    const quedan = await sync.pendingCount();

    if (quedan === 0) {
      toast.ok(`Listo: ${sel.length} insumo${sel.length > 1 ? 's' : ''} al día en la nube.`);
      _close();
    } else {
      const e = sync.lastError;
      _modal(`<div class="adm-box adm-box-lg">
          ${_cabecera('Quedó pendiente')}
          <div class="rev-err">
            <div class="rev-err-t">${escHtml(e?.titulo || 'No se pudo subir todo ahora')}</div>
            <div class="rev-err-x">${escHtml(e?.texto ||
              'Tu conteo está guardado en el teléfono y se subirá solo cuando vuelva la señal.')}</div>
          </div>
          <button class="adm-btn" data-close>Entendido</button>
        </div>`);
    }
    _onDone?.();
  });
}
