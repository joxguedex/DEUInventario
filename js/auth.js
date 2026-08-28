// ── Autenticación real vía Supabase Auth ──────────────────
// Reemplaza el login propio (RPC person_login, sin JWT, sesión en
// localStorage forjable desde la consola) por sesiones reales de Supabase
// Auth — auth.uid()/auth.jwt() del lado del servidor (RLS y las RPCs de
// supabase/new-project-schema.sql) dependen de que exista un JWT real, no
// alcanza con la anon key. Rol/área viven en session.user.app_metadata —
// SOLO la Admin API los puede escribir (ver supabase/functions/manage-
// users), nunca el propio usuario ni una RPC alcanzable con la anon key.
//
// Login por CORREO (no cédula): decisión explícita — la cédula sigue siendo
// la clave primaria de `persons` y dato importante del sistema, pero deja
// de ser parte del inicio de sesión. ci/nombre/apellido/teléfono no viven
// en el JWT: se resuelven aparte contra `persons` (auth_user_id → ci) justo
// después de autenticar.

import { SUPABASE_URL, SUPABASE_KEY, SYNC_ENABLED } from './config.js';
import { DB_SCHEMA } from './env-config.js';

const PROFILE_CACHE_KEY = 'gbs-inv-profile-cache';

// Un solo cliente Supabase compartido por toda la app (sync.js lo reusa para
// Realtime, ver sync.js#listenRealtime) — dos instancias independientes
// significarían dos GoTrue por separado gestionando la misma sesión.
export const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY) || null;

function _loadProfileCache() {
  try { return JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY)) || null; }
  catch { return null; }
}
function _saveProfileCache(p) {
  try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p)); } catch {}
}

export const auth = {
  enabled: SYNC_ENABLED && !!supabaseClient,
  session: null,   // { userId, accessToken, email, role, area, ci, name, surname, phone_company_code, phone_number }
  _listeners: [],

  onChange(fn) { this._listeners.push(fn); },
  _emit() { this._listeners.forEach(fn => { try { fn(); } catch {} }); },

  async init() {
    if (!this.enabled) return;
    const { data } = await supabaseClient.auth.getSession();
    await this._applySession(data?.session ?? null);

    // Cubre login/logout/expiración Y el refresh automático de token de
    // Supabase (cada ~55min) — sin esto, authHeaders() seguiría mandando un
    // access_token vencido tras un rato de sesión abierta.
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      await this._applySession(session);
      this._emit();
    });
  },

  // Resuelve ci/nombre/apellido/teléfono contra `persons` (RLS: cualquier
  // sesión autenticada puede leer, ver supabase/new-project-schema.sql
  // §11.4) — no viven en el JWT. Si falla (sin red justo al arrancar), usa
  // el último perfil conocido en localStorage — mismo criterio local-first
  // del resto de la app.
  async _applySession(session) {
    if (!session) { this.session = null; return; }

    const role = session.user.app_metadata?.role || '';
    const area = session.user.app_metadata?.area ?? null;
    const grupoIdRaw = session.user.app_metadata?.grupo_id;
    const grupoId = grupoIdRaw == null ? null : Number(grupoIdRaw);
    let profile = null;

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/persons?auth_user_id=eq.${session.user.id}&select=ci,name,surname,phones(company_code,number)`,
        { headers: {
          apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}`,
          'Accept-Profile': DB_SCHEMA,
        } }
      );
      if (res.ok) {
        const rows = await res.json();
        const p = Array.isArray(rows) ? rows[0] : null;
        if (p) {
          const phone = Array.isArray(p.phones) ? p.phones[0] : p.phones;
          profile = {
            ci: p.ci, name: p.name || '', surname: p.surname || '',
            phone_company_code: phone?.company_code || '', phone_number: phone?.number || '',
          };
          _saveProfileCache(profile);
        }
      }
    } catch { /* sin red: cae al cache de abajo */ }

    if (!profile) profile = _loadProfileCache() || { ci: null, name: '', surname: '', phone_company_code: '', phone_number: '' };

    this.session = {
      userId: session.user.id,
      accessToken: session.access_token,
      email: session.user.email,
      role, area, grupoId,
      ...profile,
    };
  },

  isLoggedIn() { return !!this.session; },
  ci()        { return this.session?.ci ?? null; },
  role()      { return this.session?.role || ''; },
  area()      { return this.session?.area ?? null; },   // id de categoría (string), o 'general'
  // Grupo de extensión de la sesión — null para super_admin (no tiene uno
  // propio, ve todos) y para cualquier sesión sin grupo asignado.
  grupo()     { return this.session?.grupoId ?? null; },
  name()      { return this.session ? `${this.session.name || ''} ${this.session.surname || ''}`.trim() : ''; },

  // isAdmin() es a propósito DISTINTO de isSuperAdmin() acá (a diferencia
  // del is_admin() de SQL, que los junta para simplificar RLS) — el cliente
  // necesita distinguir las dos UIs: un admin de grupo no ve el panel/
  // switcher de Grupos, un super_admin sí. hasAdminRights() es el atajo
  // para los sitios que antes gateaban con isAdmin() pensando en "cualquier
  // admin" (nav "Usuarios", canEditInventory(), hasPlatformAccess()).
  isAdmin()       { return this.role() === 'admin'; },
  isSuperAdmin()  { return this.role() === 'super_admin'; },
  hasAdminRights() { return this.isAdmin() || this.isSuperAdmin(); },
  isCoordinador() { return this.role() === 'coordinador'; },
  // Coordinador del área especial "general": sin categoría propia, ve y
  // administra el catálogo completo de su grupo (todas las categorías, no
  // solo una) — ver store.js#visibleItems(). Hasta el fix 2026-08-28 era
  // de solo consulta+despacho; dejó de serlo porque "Área" ahora se oculta
  // al crear usuarios (ver views/voluntarios.js) y todos se crean con esta
  // área por defecto — de seguir siendo de solo lectura, un usuario nuevo
  // no podría hacer nada con el inventario. can_access_category() en el
  // servidor (sibex.can_access_category) ya le daba acceso completo a
  // "general" desde antes; esto solo alinea el gate del cliente con eso.
  isGeneral()     { return this.isCoordinador() && this.area() === 'general'; },
  canEditInventory() { return this.hasAdminRights() || this.isCoordinador(); },

  // Cualquier sesión con rol admin/coordinador/super_admin tiene acceso —
  // ese rol solo lo fija la Edge Function (manage-users) o, para
  // super_admin, un bootstrap manual contra la base, nunca el propio
  // usuario ni el cliente.
  hasPlatformAccess() { return this.hasAdminRights() || this.isCoordinador(); },

  // Headers para requests REST/RPC directos (fetch) del resto de la app —
  // manda el access_token real de la sesión (para que auth.uid()/auth.jwt()
  // resuelvan del lado del servidor) y cae a la anon key si no hay sesión
  // (p.ej. antes de loguear — la mayoría de las tablas igual rechazarán ese
  // caso, RLS exige `to authenticated`, pero evita mandar un Authorization
  // vacío/inválido).
  authHeaders(extra = {}) {
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${this.session?.accessToken || SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  },

  async login(email, password) {
    email = (email || '').trim();
    if (!email || !password) return { ok: false, error: 'Escribe correo y contraseña.' };

    if (!this.enabled) return { ok: false, error: 'Conecta la base de datos primero.' };

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error || !data?.session) return { ok: false, error: 'Correo o contraseña incorrectos.' };

    await this._applySession(data.session);
    if (!this.hasPlatformAccess()) {
      // Login de Supabase válido, pero sin rol asignado (persona sin acceso
      // — p.ej. rebajada al borrarse su categoría, ver delete_category en
      // SQL) o rol voluntario (nunca tiene acceso a esta plataforma, ver
      // supabase/functions/manage-users#grantLogin). No lo dejamos "medio
      // adentro": se cierra la sesión de Supabase también.
      await supabaseClient.auth.signOut();
      this.session = null;
      return { ok: false, error: 'No tienes acceso a esta plataforma.' };
    }
    this._emit();
    return { ok: true };
  },

  async signOut() {
    await supabaseClient?.auth.signOut();
    this.session = null;
    this._emit();
  },

  // Cambiar la propia contraseña — a diferencia del viejo update_own_password
  // (RPC, exigía la contraseña actual a mano), auth.updateUser() solo
  // funciona con una sesión válida ya autenticada: esa sesión YA demuestra
  // quién es, no hace falta pedir la contraseña vigente de nuevo.
  async updatePassword(newPassword) {
    if (!this.session) throw new Error('Sin sesión activa.');
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message || 'No se pudo cambiar la contraseña.');
  },

  // Refresca el perfil en memoria + cache tras editar "Mi perfil"
  // (update_own_profile RPC) — evita forzar un re-login solo para que el
  // botón de cuenta y la atribución de "contado por" reflejen los datos
  // nuevos.
  updateProfile({ name, surname, phone_company_code, phone_number }) {
    if (!this.session) return;
    this.session = {
      ...this.session,
      name: name ?? this.session.name,
      surname: surname ?? this.session.surname,
      phone_company_code: phone_company_code ?? this.session.phone_company_code,
      phone_number: phone_number ?? this.session.phone_number,
    };
    _saveProfileCache({
      ci: this.session.ci, name: this.session.name, surname: this.session.surname,
      phone_company_code: this.session.phone_company_code, phone_number: this.session.phone_number,
    });
    this._emit();
  },
};
