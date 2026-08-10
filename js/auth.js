// ── Autenticación por CI + contraseña (RPC person_login) ──
// Login unificado con UCVAcopio/UCVComandas: sin Supabase Auth, sin JWT.
// La RPC person_login (new_schema_archive) valida el hash bcrypt del lado
// del servidor y devuelve {ci, role, area, name, surname} directo — nunca
// hay access_token/refresh_token que renovar (ver 00-plan-general.md §2).

import { SUPABASE_URL, SUPABASE_KEY, SYNC_ENABLED } from './config.js';
import { DB_SCHEMA } from './env-config.js';

const SKEY = 'ucv-inv-session';

// Roles/áreas con acceso real a esta plataforma (00-plan-general.md §4):
// admin siempre; coordinador solo si su área NO es una de las otras dos
// plataformas (recepcion=Acopio, "sala situacional"=Comandas). Voluntario
// nunca tiene acceso a Inventario, sin importar su área.
const DENIED_COORD_AREAS = new Set(['recepcion', 'sala situacional']);

export const auth = {
  enabled: SYNC_ENABLED,
  session: null,          // { ci, role, area, name, surname }
  _listeners: [],

  onChange(fn) { this._listeners.push(fn); },
  _emit() { this._listeners.forEach(fn => { try { fn(); } catch {} }); },

  init() {
    try { this.session = JSON.parse(localStorage.getItem(SKEY) || 'null'); }
    catch { this.session = null; }
  },

  isLoggedIn() { return !!this.session; },
  ci()        { return this.session?.ci ?? null; },
  role()      { return this.session?.role || ''; },
  area()      { return this.session?.area || null; },
  name()      { return this.session ? `${this.session.name || ''} ${this.session.surname || ''}`.trim() : ''; },

  isAdmin()       { return this.role() === 'admin'; },
  isCoordinador() { return this.role() === 'coordinador'; },
  // Coordinador del área especial "General": sin ítems propios (no es una
  // categoría de insumos), consulta el catálogo completo pero no puede
  // modificarlo — ver store.js#visibleItems() y auth.js#canEditInventory().
  isGeneral()     { return this.isCoordinador() && this.area() === 'general'; },
  // ¿Puede sumar/restar/crear/eliminar insumos? admin siempre; coordinador
  // de cualquier área REAL (una categoría de insumos), pero no el de "General"
  // (solo consulta + despacho, ver documentation/05-autenticacion.md).
  canEditInventory() { return this.isAdmin() || (this.isCoordinador() && !this.isGeneral()); },

  // ¿Tiene acceso a la plataforma con la sesión actual? admin siempre;
  // coordinador solo si su área no pertenece a Acopio/Comandas.
  hasPlatformAccess() {
    if (!this.session) return false;
    if (this.isAdmin()) return true;
    if (this.isCoordinador()) return !DENIED_COORD_AREAS.has(this.area());
    return false; // voluntario: sin acceso, cualquier área
  },

  async login(ci, password) {
    if (!SYNC_ENABLED) return { ok: false, error: 'Conecta la base de datos primero.' };
    ci = parseInt(ci, 10);
    if (!ci || !password) return { ok: false, error: 'Escribe cédula y contraseña.' };
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/person_login`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Content-Profile': DB_SCHEMA,
        },
        body: JSON.stringify({ p_ci: ci, p_password: password }),
      });
      if (!res.ok) return { ok: false, error: 'Sin conexión con el servidor.' };
      const rows = await res.json().catch(() => []);
      if (!Array.isArray(rows) || !rows.length) {
        return { ok: false, error: 'Cédula o contraseña incorrecta.' };
      }
      const row = rows[0];
      if (row.role !== 'admin' && row.role !== 'coordinador') {
        // voluntario: credenciales válidas, pero esta plataforma no es para su rol.
        return { ok: false, error: 'No tienes acceso a esta plataforma.' };
      }
      if (row.role === 'coordinador' && DENIED_COORD_AREAS.has(row.area)) {
        return { ok: false, error: 'No tienes acceso a esta plataforma.' };
      }
      this.session = { ci: row.ci, role: row.role, area: row.area, name: row.name, surname: row.surname };
      localStorage.setItem(SKEY, JSON.stringify(this.session));
      this._emit();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Sin conexión con el servidor.' };
    }
  },

  signOut() {
    this.session = null;
    localStorage.removeItem(SKEY);
    this._emit();
  },

  // Refresca nombre/apellido de la sesión ya iniciada tras editar el perfil
  // (js/views/admin.js) — evita forzar un re-login solo para que el botón de
  // cuenta y la atribución de "contado por" reflejen el nombre nuevo.
  updateProfile({ name, surname }) {
    if (!this.session) return;
    this.session = { ...this.session, name, surname };
    localStorage.setItem(SKEY, JSON.stringify(this.session));
    this._emit();
  },
};
