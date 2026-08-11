// ══════════════════════════════════════════════════════════════════════════
//  GBSInventario · Edge Function: manage-users
//
//  Única pieza que necesita la Supabase Admin API (service_role key) — todo
//  lo demás vive en RPCs normales (supabase/new-project-schema.sql). Existe
//  porque:
//    1. Crear/borrar una cuenta de Auth y fijar su app_metadata (rol/área)
//       NO es alcanzable desde una RPC SECURITY DEFINER corriente — requiere
//       la Admin API, que exige el service_role key. Ese key JAMÁS puede
//       llegar al navegador (se salta RLS por completo) — por eso vive acá,
//       como secreto de esta función, nunca en js/config.js.
//    2. auth.signUp() del lado del cliente (con la anon key) inicia sesión
//       como el usuario nuevo en el navegador de quien lo crea — inservible
//       para "un admin da de alta a un coordinador sin dejar de ser admin".
//
//  El frontend la llama con supabase.functions.invoke('manage-users', {...})
//  — el SDK manda automáticamente el JWT de la sesión del que llama en el
//  header Authorization, así que esta función siempre sabe quién la invocó
//  sin que el cliente pueda mentir al respecto.
//
//  Despliegue:
//    supabase functions deploy manage-users
//    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<la service_role key>
//    (SUPABASE_URL y SUPABASE_ANON_KEY ya existen como env vars automáticas
//    en todo proyecto Supabase, no hace falta fijarlas a mano)
// ══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Cliente con privilegios de servicio — el único capaz de usar la Admin API
// (auth.admin.*) y de saltarse RLS. Nunca se expone al llamador.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Valida que quien llama tenga una sesión real y sea admin — usando el JWT
// que mandó el cliente (nunca confiar en un campo del body tipo "soy admin").
async function requireAdmin(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Falta la sesión (Authorization header).' }, 401);

  // Cliente "como el usuario" (anon key + su JWT) solo para resolver quién es
  // — nunca se usa este cliente para escribir nada.
  const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data, error } = await asCaller.auth.getUser();
  if (error || !data?.user) return json({ error: 'Sesión inválida o expirada.' }, 401);

  const role = (data.user.app_metadata as Record<string, unknown> | null)?.role;
  if (role !== 'admin') return json({ error: 'Solo un administrador puede hacer esto.' }, 403);

  return { userId: data.user.id };
}

// area debe ser 'general' o el id de una categoría existente — mismo
// criterio que valida create_user/update_user_role en el esquema viejo,
// ahora contra la tabla `categories` en vez de un enum fijo.
async function validArea(area: string): Promise<boolean> {
  if (area === 'general') return true;
  const { data } = await admin.from('categories').select('id').eq('id', area).maybeSingle();
  return !!data;
}

function isEmail(s: unknown): s is string {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Body inválido' }, 400); }

  const action = body.action;
  try {
    switch (action) {
      case 'grant_login':      return await grantLogin(body);
      case 'update_area':      return await updateArea(body);
      case 'revoke_access':    return await revokeAccess(body);
      case 'revoke_by_area':   return await revokeByArea(body);
      case 'reset_password':   return await resetPassword(body);
      case 'set_active':       return await setActive(body);
      default:
        return json({ error: `Acción desconocida: ${String(action)}` }, 400);
    }
  } catch (err) {
    console.error(`manage-users[${String(action)}]`, err);
    return json({ error: err instanceof Error ? err.message : 'Error interno' }, 500);
  }
});

// ── grant_login — crea el inicio de sesión de una `persons` ya existente ──
// { ci, email, password, area }  — el rol siempre es 'coordinador': esta
// función jamás otorga 'admin' (excepción explícita pedida — un admin nuevo
// se crea directo contra la base, fuera de la app, igual que el primer
// admin del sistema).
async function grantLogin(body: Record<string, unknown>) {
  const ci = Number(body.ci);
  const email = body.email;
  const password = body.password;
  const area = String(body.area ?? '');

  if (!ci || ci <= 0) return json({ error: 'Cédula inválida.' }, 400);
  if (!isEmail(email)) return json({ error: 'Correo inválido.' }, 400);
  if (typeof password !== 'string' || password.length < 6) return json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
  if (!(await validArea(area))) return json({ error: 'Área inválida: debe ser "general" o una categoría existente.' }, 400);

  const { data: person, error: pErr } = await admin
    .from('persons').select('ci, auth_user_id').eq('ci', ci).maybeSingle();
  if (pErr) throw pErr;
  if (!person) return json({ error: `No existe ninguna persona con cédula ${ci}. Créala primero con create_person.` }, 404);

  const appMeta = { role: 'coordinador', area };

  if (person.auth_user_id) {
    // Ya tenía una cuenta (p.ej. le habían revocado el acceso antes) — se
    // reactiva en vez de crear una segunda cuenta para la misma persona.
    const { error } = await admin.auth.admin.updateUserById(person.auth_user_id, {
      email, password, app_metadata: appMeta, email_confirm: true,
    });
    if (error) throw error;
    return json({ ok: true, auth_user_id: person.auth_user_id, reactivated: true });
  }

  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, app_metadata: appMeta,
  });
  if (cErr) throw cErr;

  const { error: linkErr } = await admin
    .from('persons').update({ auth_user_id: created.user.id }).eq('ci', ci);
  if (linkErr) throw linkErr;

  return json({ ok: true, auth_user_id: created.user.id, reactivated: false });
}

// ── update_area — reasigna el área de un coordinador ya con login ────────
async function updateArea(body: Record<string, unknown>) {
  const ci = Number(body.ci);
  const area = String(body.area ?? '');
  if (!ci) return json({ error: 'Cédula inválida.' }, 400);
  if (!(await validArea(area))) return json({ error: 'Área inválida.' }, 400);

  const authUserId = await _authUserIdFor(ci);
  if (!authUserId) return json({ error: 'Esa persona no tiene inicio de sesión.' }, 404);

  const { data: u } = await admin.auth.admin.getUserById(authUserId);
  const role = (u?.user?.app_metadata as Record<string, unknown> | undefined)?.role ?? 'coordinador';
  if (role === 'admin') return json({ error: 'No se puede editar a un admin desde acá.' }, 403);

  const { error } = await admin.auth.admin.updateUserById(authUserId, {
    app_metadata: { role, area },
  });
  if (error) throw error;
  return json({ ok: true });
}

// ── revoke_access — "rebaja a persona sin acceso al sistema" ─────────────
// No borra la persona ni su cuenta de Auth (podría reactivarse más tarde con
// grant_login/update_area) — solo limpia rol/área y fuerza el cierre de
// sesión (auth.admin.signOut, scope 'global') para que el JWT ya emitido no
// siga sirviendo hasta su expiración natural (~1h). Esto es lo que
// delete_category() en SQL NO puede hacer por sí sola (no tiene acceso a la
// Admin API) — el admin debería llamar acá para cada coordinador afectado
// antes o después de borrar la categoría, si necesita revocación inmediata.
async function revokeAccess(body: Record<string, unknown>) {
  const ci = Number(body.ci);
  if (!ci) return json({ error: 'Cédula inválida.' }, 400);

  const authUserId = await _authUserIdFor(ci);
  if (!authUserId) return json({ ok: true, note: 'Ya no tenía inicio de sesión.' });

  const { data: u } = await admin.auth.admin.getUserById(authUserId);
  if ((u?.user?.app_metadata as Record<string, unknown> | undefined)?.role === 'admin') {
    return json({ error: 'No se puede revocar a un admin desde acá.' }, 403);
  }

  const { error } = await admin.auth.admin.updateUserById(authUserId, { app_metadata: { role: null, area: null } });
  if (error) throw error;
  await admin.auth.admin.signOut(authUserId, 'global').catch(() => {});
  return json({ ok: true });
}

// ── set_active — activar/desactivar (equivalente al "activar/desactivar
// voluntarios" de UCVAcopio, generalizado a cualquier usuario con acceso).
// A diferencia de revoke_access, esto NO toca rol/área — es reversible sin
// tener que volver a configurar nada: usa el baneo nativo de Supabase Auth
// (banned_until), que bloquea el login por sí solo (no depende de que el
// frontend chequee un flag). Desactivar además cierra la sesión activa, por
// la misma razón que revoke_access.
async function setActive(body: Record<string, unknown>) {
  const ci = Number(body.ci);
  const active = !!body.active;
  if (!ci) return json({ error: 'Cédula inválida.' }, 400);

  const authUserId = await _authUserIdFor(ci);
  if (!authUserId) return json({ error: 'Esa persona no tiene inicio de sesión.' }, 404);

  const { data: u } = await admin.auth.admin.getUserById(authUserId);
  if ((u?.user?.app_metadata as Record<string, unknown> | undefined)?.role === 'admin') {
    return json({ error: 'No se puede activar/desactivar a un admin desde acá.' }, 403);
  }

  const { error } = await admin.auth.admin.updateUserById(authUserId, {
    ban_duration: active ? 'none' : '876000h', // ~100 años — "hasta que se reactive a mano"
  });
  if (error) throw error;
  if (!active) await admin.auth.admin.signOut(authUserId, 'global').catch(() => {});
  return json({ ok: true });
}

// ── revoke_by_area — variante en lote, usada por la UI de "Categorías"
// justo antes de borrar una (delete_category ya hace la democión en SQL,
// pero sin invalidar sesiones activas — esto cierra esa brecha).
async function revokeByArea(body: Record<string, unknown>) {
  const area = String(body.area ?? '');
  if (!area) return json({ error: 'Falta el área.' }, 400);

  const { data: rows, error } = await admin
    .from('persons').select('ci, auth_user_id')
    .not('auth_user_id', 'is', null);
  if (error) throw error;

  let afectados = 0;
  for (const row of rows ?? []) {
    const { data: u } = await admin.auth.admin.getUserById(row.auth_user_id as string);
    const meta = u?.user?.app_metadata as Record<string, unknown> | undefined;
    if (meta?.area !== area || meta?.role === 'admin') continue;
    await admin.auth.admin.updateUserById(row.auth_user_id as string, { app_metadata: { role: null, area: null } });
    await admin.auth.admin.signOut(row.auth_user_id as string, 'global').catch(() => {});
    afectados++;
  }
  return json({ ok: true, afectados });
}

// ── reset_password — contraseña de OTRO usuario, sin pedir la actual ─────
// (mismo criterio que admin_reset_password del esquema viejo: el actor ya
// demostró ser admin, eso basta — a diferencia de "cambiar mi propia
// contraseña", que si exige la actual, ver update_own_password en SQL).
async function resetPassword(body: Record<string, unknown>) {
  const ci = Number(body.ci);
  const newPassword = body.new_password;
  if (!ci) return json({ error: 'Cédula inválida.' }, 400);
  if (typeof newPassword !== 'string' || newPassword.length < 6) return json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);

  const authUserId = await _authUserIdFor(ci);
  if (!authUserId) return json({ error: 'Esa persona no tiene inicio de sesión.' }, 404);

  const { data: u } = await admin.auth.admin.getUserById(authUserId);
  if ((u?.user?.app_metadata as Record<string, unknown> | undefined)?.role === 'admin') {
    return json({ error: 'No se puede resetear la contraseña de un admin desde acá.' }, 403);
  }

  const { error } = await admin.auth.admin.updateUserById(authUserId, { password: newPassword });
  if (error) throw error;
  return json({ ok: true });
}

async function _authUserIdFor(ci: number): Promise<string | null> {
  const { data } = await admin.from('persons').select('auth_user_id').eq('ci', ci).maybeSingle();
  return (data?.auth_user_id as string | undefined) ?? null;
}
