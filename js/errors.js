// ── Errores en lenguaje humano ────────────────────────────
// Los voluntarios cuentan desde el teléfono, muchas veces con mala
// señal y sin nadie técnico al lado. Un "HTTP 404" o un "PGRST202"
// no les dice si perdieron el trabajo o no — que es lo único que
// realmente quieren saber.
//
// Cada mensaje responde tres cosas, en este orden:
//   1. qué pasó, sin jerga
//   2. si su conteo está a salvo   ← lo más importante
//   3. qué hacer ahora
// ------------------------------------------------------------

// Todo lo que se encola sobrevive en el teléfono (IndexedDB), así que
// en casi ningún caso el voluntario pierde su trabajo. Decírselo baja
// el pánico y evita que recuenten todo "por si acaso".
const A_SALVO = 'Tu conteo está guardado en el teléfono y se subirá solo.';

export function explicarHTTP(status, cuerpo = '') {
  const detalle = _detalle(cuerpo);

  if (status === 0) {
    return { titulo: 'Sin conexión a internet',
             texto: `No se pudo hablar con el servidor. ${A_SALVO}`,
             grave: false };
  }
  if (status === 401) {
    return { titulo: 'Tu sesión venció',
             texto: `Cierra sesión y vuelve a entrar con tu correo. ${A_SALVO}`,
             grave: true };
  }
  if (status === 403) {
    // Distinto de 401: la sesión sigue siendo válida, es un permiso o una
    // política de la base de datos rechazando la operación — cerrar sesión
    // acá no arregla nada (ver js/sync.js, ya no dispara auth.signOut()).
    return { titulo: 'Sin permiso para esta acción',
             texto: `Tu cuenta no tiene permiso para hacer esto — no es un problema de tu sesión. ${A_SALVO} Avísale a un administrador.`,
             grave: true };
  }
  if (status === 404) {
    return { titulo: 'Falta una actualización en el servidor',
             texto: `El sistema pidió algo que la base de datos todavía no tiene. ` +
                    `No es culpa tuya y no perdiste nada: ${A_SALVO.toLowerCase()} ` +
                    `Avísale al coordinador.`,
             grave: true };
  }
  if (status === 408 || status === 504) {
    return { titulo: 'El servidor tardó demasiado',
             texto: `La señal está lenta. ${A_SALVO}`,
             grave: false };
  }
  if (status === 429) {
    return { titulo: 'Demasiados envíos seguidos',
             texto: `El servidor pidió esperar un momento. ${A_SALVO}`,
             grave: false };
  }
  if (status === 409) {
    return { titulo: 'Ese insumo ya existía',
             texto: 'Alguien creó un insumo con el mismo nombre y presentación. ' +
                    'Búscalo en la lista y cuenta sobre el que ya está.',
             grave: false };
  }
  if (status >= 500) {
    return { titulo: 'El servidor está caído',
             texto: `No es tu teléfono. ${A_SALVO} Vuelve a intentar en unos minutos.`,
             grave: false };
  }
  if (status >= 400) {
    // 400/422: dato que el servidor rechazó. Aquí sí hay que mostrar el
    // detalle, porque suele ser accionable (nombre vacío, cantidad rara).
    return { titulo: 'El servidor rechazó este dato',
             texto: detalle
               ? `Tu conteo fue descartado de la cola. Motivo: ${detalle} Por favor revisa e ingresa el dato nuevamente.`
               : 'Tu conteo fue descartado de la cola. Revisa lo que escribiste e inténtalo de nuevo.',
             grave: true };
  }
  return { titulo: 'Algo salió mal',
           texto: `${A_SALVO} Si sigue pasando, avísale al coordinador.`,
           grave: false };
}

// Falla de red cruda (fetch que ni siquiera llegó a responder).
export function explicarRed() {
  return explicarHTTP(0);
}

// Traduce lo poco aprovechable del cuerpo de PostgREST. Nunca devuelve
// códigos ni nombres de tabla: si no hay nada legible, devuelve ''.
function _detalle(cuerpo) {
  if (!cuerpo) return '';
  let msg = '';
  try {
    const j = typeof cuerpo === 'string' ? JSON.parse(cuerpo) : cuerpo;
    msg = j?.message || j?.msg || j?.error_description || '';
  } catch { msg = ''; }
  if (!msg) return '';

  // Mensajes propios de la BD que sí valen la pena traducir
  if (/no existe/i.test(msg) && /producto/i.test(msg)) {
    return 'Ese insumo ya no está en el catálogo (lo pudieron unir con otro).';
  }
  if (/duplicate key|already exists/i.test(msg)) {
    return 'Ya existe un insumo igual.';
  }
  if (/violates check constraint|check constraint/i.test(msg)) {
    return 'La cantidad o el nombre no son válidos.';
  }
  if (/row-level security|permission denied/i.test(msg)) {
    return 'Tu usuario no tiene permiso para esta acción.';
  }
  // Cualquier cosa con pinta de jerga (códigos, nombres técnicos) se descarta
  if (/[A-Z]{4,}\d|PGRST|function|schema|relation|column/i.test(msg)) return '';
  return msg;
}

// Frase corta para el toast (una sola línea).
export function frase(status, cuerpo = '') {
  const e = explicarHTTP(status, cuerpo);
  return `${e.titulo}. ${e.texto}`;
}
