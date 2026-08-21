# Pendiente: activar el schema `sibex` en Supabase

Checklist para terminar de mover SIBEX UCV a su propio schema de Postgres
(`sibex`, separado de `public`, dentro del **mismo** proyecto Supabase que
ya tenés — `js/config.js` no cambia, solo el schema).

Ya está listo en el repo (nada de esto hace falta tocarlo):
- `supabase/sibex-schema-install.sql` — el SQL completo a correr.
- `js/env-config.js` — `DB_SCHEMA` ya dice `"sibex"`.
- `supabase/functions/manage-users/index.ts` — ya lee `DB_SCHEMA` (env var)
  en vez de asumir `public`.

Lo que falta es todo del lado de Supabase/Vercel — no lo puedo ejecutar yo.

## 1. Correr el SQL

Panel de Supabase → **SQL Editor** → pegar entero
`supabase/sibex-schema-install.sql` → Run.

⚠️ No es el mismo archivo que `2026-08-13-grupos-extension.sql` — ese era
solo el delta para el proyecto viejo sobre `public`, no aplica acá.

## 2. Exponer el schema en la API

Dashboard → **Settings → API → Exposed schemas** → agregar `sibex` a la
lista (por default solo están `public`/`graphql_public`). Sin este paso
todo fetch del cliente devuelve error aunque el SQL haya corrido bien.

## 3. Redeployar la Edge Function con el schema correcto

```
supabase secrets set DB_SCHEMA=sibex
supabase functions deploy manage-users
```

## 4. Bootstrap del primer usuario (super_admin)

El schema `sibex` arranca vacío — no hay ningún usuario todavía, hay que
crear el primero a mano (mismo criterio que ya usa este sistema para el
primer admin: "se crea directo contra la base, fuera de la app"):

1. Dashboard → **Authentication → Users → Add user** — crear la cuenta con
   tu correo y una contraseña (marcar el usuario como confirmado).
2. SQL Editor, reemplazando el correo:
   ```sql
   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}'::jsonb
   where email = 'TU-CORREO-AQUI';
   ```
3. Entrar a la app con ese correo/contraseña — deberías ver el selector de
   grupo en la barra superior (señal de que `role:'super_admin'` llegó
   bien).
4. Desde el botón de cuenta → panel → **"Grupos de extensión"**, crear el
   primer grupo. Elegirlo en el selector de la barra superior y desde ahí
   crear sus categorías y su primer coordinador/administrador (pestaña
   Usuarios).

## 5. Si hay deploy en Vercel

Agregar la env var `DB_SCHEMA=sibex` en la configuración del proyecto de
Vercel (Settings → Environment Variables) — `build.js` la lee en cada
build para regenerar `js/env-config.js`; sin esto, el deploy de producción
seguiría apuntando a `public`.

## 6. Verificación final

- [ ] Login con la cuenta super_admin funciona y muestra el selector de
      grupo.
- [ ] Crear un grupo nuevo desde el panel.
- [ ] Elegirlo en el selector, crear una categoría y un insumo de prueba.
- [ ] Crear un usuario `Administrador del grupo` desde Usuarios, cerrar
      sesión, loguear con esa cuenta nueva y confirmar que ve **solo** ese
      grupo (sin selector de grupo, porque no es super_admin).
