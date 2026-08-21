-- ══════════════════════════════════════════════════════════════════════════
--  SIBEX UCV · Esquema completo, dentro del schema de Postgres `sibex`
--  (NO `public`) — generado automáticamente a partir de
--  supabase/new-project-schema.sql reemplazando cada referencia `public.`
--  por `sibex.` (mismo contenido, mismo orden de secciones — ver ese
--  archivo para el detalle documentado de cada una).
--
--  Pensado para un schema nuevo, vacío, dentro de un proyecto Supabase que
--  YA tiene otro sistema corriendo en `public` (o en otro schema) — así
--  quedan separados sin pisarse. Ejecutar ESTE archivo entero en el SQL
--  Editor (reemplaza al fresh-install normal, no hace falta correr también
--  new-project-schema.sql).
--
--  Pasos ADEMÁS de correr este SQL (ninguno de los dos es automático):
--    1. Dashboard → Settings → API → "Exposed schemas": agregar `sibex`
--       (por default solo `public`/`graphql_public` son alcanzables por la
--       API REST — sin esto, todo fetch del cliente devuelve error aunque
--       el SQL esté perfecto).
--    2. `js/env-config.js`: cambiar `DB_SCHEMA` a `"sibex"` (en local, a
--       mano; en Vercel, vía la env var `DB_SCHEMA`, ver build.js).
--    3. `supabase/functions/manage-users/index.ts`: el cliente `admin` debe
--       apuntar al schema `sibex` explícitamente (`db: { schema: 'sibex' }`
--       en `createClient()`) — por default apunta a `public`.
-- ══════════════════════════════════════════════════════════════════════════

create schema if not exists sibex;


-- ══════════════════════════════════════════════════════════════════════════
--  1. ENUMS
-- ══════════════════════════════════════════════════════════════════════════

-- Categorías de producto: YA NO es un enum fijo (las 13 categorías del
-- esquema viejo eran específicas del centro de acopio UCV). GBSInventario es
-- una plantilla reutilizable por distintas organizaciones — las categorías
-- son una tabla (`categories`, sección 2) que cada admin puebla a su gusto,
-- creable/editable/eliminable desde la app. El "área" de un coordinador
-- (`auth.users.app_metadata->>'area'`) pasa a ser el `id` de una categoría
-- (texto, p.ej. '7') o el literal 'general' — ver sección 8.
create type sibex.movement_direction as enum ('in', 'out');
create type sibex.request_status as enum ('open', 'fulfilled', 'cancelled');

-- Rol de plataforma. 'voluntario' se conserva por fidelidad de dominio
-- (una `persons` puede seguir clasificándose así vía `person_categoria`),
-- pero bajo el modelo nuevo NINGUNA cuenta de Auth se crea con este rol —
-- ver la nota en la sección de Auth más abajo.
create type sibex.person_role as enum ('admin', 'coordinador', 'voluntario');

create type sibex.person_categoria as enum (
  'Voluntario', 'Medico', 'Rescatista', 'Conductor', 'Externo', 'Afectado'
);

create type sibex.comanda_status as enum (
  'pending', 'processing', 'extracted', 'verified', 'exported', 'error',
  'por_despachar', 'despachada', 'completada', 'fallida'
);
create type sibex.comanda_origen as enum (
  'ocr', 'manual', 'rapida', 'manual_antigua', 'personal'
);
create type sibex.comanda_imagen_tipo as enum ('ocr', 'entrega', 'otra');

create type sibex.ubicacion_tipo as enum (
  'albergue_refugio', 'general_institucional', 'centro_acopio',
  'ong_organizacion_civil', 'otro'
);
create type sibex.ubicacion_estado as enum (
  'confirmada', 'por_confirmar', 'en_camino', 'no_seguro', 'inhabilitado', 'cerrado'
);
create type sibex.tipo_albergue as enum (
  'oficial_institucional', 'comunitario_autogestionado', 'otro'
);
create type sibex.tipo_espacio as enum (
  'espacios_estructurados', 'espacios_publicos_organizados',
  'via_publica_intemperie', 'otro'
);
create type sibex.nivel_vulnerabilidad as enum ('baja', 'media', 'alta', 'critica');

create type sibex.conductor_tipo_vehiculo as enum (
  'moto', 'camioneta', 'camion', 'carro', 'pick_up'
);
create type sibex.dia_semana as enum (
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'
);
create type sibex.bloque_horario as enum (
  'bloque_9_12', 'bloque_12_15', 'bloque_15_18', 'bloque_18_21', 'bloque_21_24'
);
create type sibex.zona_transporte as enum ('caracas', 'la_guaira', 'miranda');


-- ══════════════════════════════════════════════════════════════════════════
--  2. NÚCLEO — catálogo, inventario, movimientos, personas
-- ══════════════════════════════════════════════════════════════════════════

-- Categorías de insumos — configurables por el admin (ver nota de la
-- sección 1). Crear una habilita designar coordinadores de esa categoría
-- (su "área"); borrarla los rebaja automáticamente a personas sin acceso
-- (sección 8, delete_category()). El nombre SÍ es editable libremente: el
-- `id` (inmutable) es lo que se guarda como área, nunca el nombre.
-- Grupo de extensión: tenant de más alto nivel — cada uno lleva su propio
-- inventario/usuarios/comunicados/directorio, sin ver el de los demás. Solo
-- `super_admin` los ve/gestiona todos; `admin`/`coordinador` quedan
-- acotados al suyo (app_metadata.grupo_id, ver sección 8).
create table sibex.grupos (
  id          bigint generated always as identity primary key,
  nombre      text not null unique check (char_length(trim(nombre)) > 0 and char_length(nombre) <= 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table sibex.categories (
  id          bigint generated always as identity primary key,
  nombre      text not null check (char_length(trim(nombre)) > 0 and char_length(nombre) <= 100),
  grupo_id    bigint not null references sibex.grupos (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (grupo_id, nombre)
);
create index categories_grupo_id_idx on sibex.categories (grupo_id);

create table sibex.products (
  id           bigint generated always as identity primary key,
  name         text not null check (char_length(trim(name)) > 0 and char_length(name) <= 200),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  metadata     jsonb not null default '{}'::jsonb,
  umbral       integer not null default 10 check (umbral >= 0),
  -- Límite superior de stock: nulo/0 = "sin límite superior" (mismo
  -- criterio que umbral=0 = "no necesario" reponer). Cuando está fijado y
  -- la cantidad lo supera, el insumo pasa a estado "exceso" (ver
  -- js/helpers.js#iStatus) — informativo, no crítico, por eso azul y no rojo.
  umbral_max   integer check (umbral_max is null or umbral_max >= 0),
  client_id    text not null unique,
  deleted_at   timestamptz,
  unidad       text not null default 'und',
  -- Nullable: un producto SOFT-borrado (deleted_at) puede quedar sin
  -- categoría cuando esta se elimina (ver delete_category, sección 8b) —
  -- ya no cuenta para el chequeo "hay productos en esta categoría" ni
  -- bloquea el DELETE, así que el FK cede en vez de restringir.
  category_id  bigint references sibex.categories (id) on delete set null,
  -- Denormalizado desde categories.grupo_id (trigger sync_product_grupo,
  -- sección 7) — hace falta como columna propia (no solo derivable vía
  -- category_id) porque la unique de abajo necesita compararlo sin joins.
  -- Nullable: un producto soft-borrado puede quedar sin categoría (ver
  -- delete_category), y por lo tanto sin grupo determinable.
  grupo_id     bigint references sibex.grupos (id),
  constraint products_grupo_name_unidad_key unique (grupo_id, name, unidad),
  constraint products_umbral_range_chk check (umbral_max is null or umbral_max > umbral)
);
create index products_category_id_idx on sibex.products (category_id);
create index products_grupo_id_idx on sibex.products (grupo_id);

create table sibex.inventory (
  product_id       bigint primary key references sibex.products (id) on delete cascade,
  qnty             integer not null default 0 check (qnty >= 0),
  last_counted_at  timestamptz,
  last_counted_by  text
);

create table sibex.phones (
  id            bigint generated always as identity primary key,
  company_code  text not null check (company_code ~ '^(0412|0414|0416|0422|0424|0426|02[0-9]{2})$'),
  number        text not null check (number ~ '^[0-9]{7}$'),
  unique (company_code, number)
);

create table sibex.persons (
  ci            bigint primary key check (ci > 0),
  name          text not null check (char_length(trim(name)) > 0 and char_length(name) <= 200),
  surname       text not null check (char_length(trim(surname)) > 0 and char_length(surname) <= 200),
  phone_id      bigint not null references sibex.phones (id),
  categoria     sibex.person_categoria,
  -- NULL = persona sin inicio de sesión. Se llena vía link_person_login()
  -- (llamada por la Edge Function tras crear el usuario en auth.users).
  auth_user_id  uuid unique references auth.users (id) on delete set null,
  -- Directorio separado por grupo (decisión explícita) — evita que un
  -- coordinador de un grupo vea nombres/teléfonos de personas de otro.
  grupo_id      bigint not null references sibex.grupos (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index persons_auth_user_id_idx on sibex.persons (auth_user_id);
create index persons_grupo_id_idx on sibex.persons (grupo_id);

create table sibex.movements (
  id            bigint generated always as identity primary key,
  direction     sibex.movement_direction not null default 'in',
  destination   text check (destination is null or char_length(destination) <= 200),
  received_by   bigint references sibex.persons (ci) on delete set null,
  delivered_by  bigint references sibex.persons (ci) on delete set null,
  occurred_at   timestamptz not null default now(),
  note          text check (note is null or char_length(note) <= 2000),
  client_op_id  text unique
);

create table sibex.movement_items (
  id           bigint generated always as identity primary key,
  movement_id  bigint not null references sibex.movements (id) on delete cascade,
  product_id   bigint not null references sibex.products (id) on delete restrict,
  qnty         integer not null check (qnty > 0)
);

create table sibex.requests (
  id                bigint generated always as identity primary key,
  product_id        bigint not null references sibex.products (id) on delete cascade,
  requester_id      bigint references sibex.persons (ci) on delete set null,
  qnty              integer not null check (qnty > 0),
  qnty_outstanding  integer not null check (qnty_outstanding >= 0),
  status            sibex.request_status not null default 'open',
  requested_at      timestamptz not null default now(),
  note              text check (note is null or char_length(note) <= 2000)
);

create table sibex.checkpoints (
  id          text primary key,
  creado_por  text not null,
  data        jsonb not null,
  created_at  timestamptz default now()
);

create table sibex.comms (
  id          text primary key,
  titulo      text not null check (char_length(trim(titulo)) > 0),
  urgencia    text not null check (urgencia in ('info', 'urgente', 'critico')),
  cuerpo      text not null check (char_length(trim(cuerpo)) > 0),
  autor       text not null default 'Anónimo',
  activo      boolean not null default true,
  fecha       bigint not null,
  -- Comunicados separados por grupo (decisión explícita).
  grupo_id    bigint not null references sibex.grupos (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index comms_updated_at_idx on sibex.comms (updated_at);
create index comms_activo_idx on sibex.comms (activo, urgencia);
create index comms_grupo_id_idx on sibex.comms (grupo_id);

-- 1:1 opcional. Antes ligada a person_credentials(ci); repuntada a
-- persons(ci) porque person_credentials desaparece con este script.
create table sibex.person_status (
  ci          bigint primary key references sibex.persons (ci) on delete cascade,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════════════════
--  3. DOMINIO COMANDAS (hoy poblado por el backend Python de UCVComandas —
--     se replica la estructura por fidelidad; queda inerte hasta que
--     GBSInventario tenga su propio flujo de solicitudes/entregas)
-- ══════════════════════════════════════════════════════════════════════════

create table sibex.comandas_viejas (
  id                      integer generated always as identity primary key,
  nombre_centro           varchar(255),
  direccion               text,
  solicitante             varchar(255),
  solicitante_cedula      varchar(50),
  solicitante_telefono    varchar(50),
  estudiante_resp         varchar(255),
  estudiante_resp_cedula  varchar(50),
  estudiante_resp_telefono varchar(50),
  conductor               varchar(255),
  conductor_cedula        varchar(50),
  conductor_telefono      varchar(50),
  placa_vehiculo          varchar(50),
  tipo_vehiculo           varchar(100),
  firma_receptor          boolean default false,
  ocr_raw_response        text,
  ocr_error               text,
  ocr_model               varchar(50),
  confianza_campos        jsonb
);

create table sibex.conductores (
  ci          bigint primary key references sibex.persons (ci) on delete cascade,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create table sibex.comandas (
  id                              integer generated always as identity primary key,
  comanda_vieja_id                integer references sibex.comandas_viejas (id) on delete set null,
  solicitante_ci                  bigint references sibex.persons (ci) on delete set null,
  estudiante_resp_ci              bigint references sibex.persons (ci) on delete set null,
  conductor_ci                    bigint references sibex.conductores (ci) on delete set null,
  ubicacion_id                    bigint,  -- FK agregada en la sección 4 (ubicaciones se define después)
  direccion                       text,
  fecha                           date,
  beneficiarios_hombres           integer check (beneficiarios_hombres is null or beneficiarios_hombres >= 0),
  beneficiarios_mujeres           integer check (beneficiarios_mujeres is null or beneficiarios_mujeres >= 0),
  beneficiarios_ninos             integer check (beneficiarios_ninos is null or beneficiarios_ninos >= 0),
  beneficiarios_adultos_mayores   integer check (beneficiarios_adultos_mayores is null or beneficiarios_adultos_mayores >= 0),
  beneficiarios_familias          integer check (beneficiarios_familias is null or beneficiarios_familias >= 0),
  beneficiarios_perros            integer check (beneficiarios_perros is null or beneficiarios_perros >= 0),
  beneficiarios_gatos             integer check (beneficiarios_gatos is null or beneficiarios_gatos >= 0),
  beneficiarios_total             integer check (beneficiarios_total is null or beneficiarios_total >= 0),
  prioridad                       varchar(100),
  hora_salida                     time,
  hora_llegada                    time,
  autorizado_por                  varchar(255),
  notas                           text,
  status                          sibex.comanda_status not null default 'pending',
  origen                          sibex.comanda_origen not null,
  responsable_entrega_ci          bigint references sibex.persons (ci) on delete set null,
  aprobado_por_ci                 bigint references sibex.persons (ci) on delete set null,
  aprobado_por                    varchar(200),
  created_by_ci                   bigint references sibex.persons (ci) on delete set null,
  created_by                      varchar(200),
  last_edited_by_ci               bigint references sibex.persons (ci) on delete set null,
  last_edited_by                  varchar(200),
  locked_by                       varchar(64),
  locked_at                       timestamptz,
  created_at                      timestamptz default now(),
  updated_at                      timestamptz,
  processed_at                    timestamptz,
  exported_at                     timestamptz,
  deleted_at                      timestamptz,
  client_op_id                    text unique,
  movement_id                     bigint references sibex.movements (id) on delete set null
);
create index comandas_deleted_at_idx on sibex.comandas (deleted_at);
create index comandas_status_idx on sibex.comandas (status);

create table sibex.comanda_items (
  id                integer generated always as identity primary key,
  comanda_id        integer not null references sibex.comandas (id) on delete cascade,
  producto          varchar(500) not null,
  cantidad          numeric(12, 3),
  unidad            varchar(50),
  confianza         varchar(10),
  confianza_pct     integer,
  producto_id       bigint references sibex.products (id),
  movement_item_id  bigint references sibex.movement_items (id) on delete set null,
  despachado        boolean not null default false,
  despachado_por_ci bigint references sibex.persons (ci) on delete set null,
  despachado_por    varchar(200),
  despachado_at     timestamptz
);
create index comanda_items_comanda_id_idx on sibex.comanda_items (comanda_id);
create index comanda_items_producto_id_idx on sibex.comanda_items (producto_id);

create table sibex.comanda_imagenes (
  id             integer generated always as identity primary key,
  comanda_id     integer not null references sibex.comandas (id) on delete cascade,
  filename       varchar(255) not null,
  url            varchar(500) not null,
  tipo           sibex.comanda_imagen_tipo not null default 'otra',
  created_by_ci  bigint references sibex.persons (ci) on delete set null,
  created_by     varchar(200),
  created_at     timestamptz default now()
);
create index comanda_imagenes_comanda_id_idx on sibex.comanda_imagenes (comanda_id);

create table sibex.product_aliases (
  id          integer generated always as identity primary key,
  product_id  integer not null references sibex.products (id),
  alias       varchar(500) not null unique,
  created_at  timestamptz default now()
);
create index product_aliases_product_id_idx on sibex.product_aliases (product_id);


-- ══════════════════════════════════════════════════════════════════════════
--  4. DOMINIO UBICACIONES
-- ══════════════════════════════════════════════════════════════════════════

create table sibex.municipios (
  id      smallint generated always as identity primary key,
  nombre  text not null unique check (char_length(trim(nombre)) > 0 and char_length(nombre) <= 150)
);

create table sibex.parroquias (
  id            smallint generated always as identity primary key,
  nombre        text not null check (char_length(trim(nombre)) > 0 and char_length(nombre) <= 150),
  municipio_id  smallint not null references sibex.municipios (id) on delete restrict
);

create table sibex.rutas_ejes (
  id      smallint generated always as identity primary key,
  nombre  text not null unique check (char_length(trim(nombre)) > 0 and char_length(nombre) <= 300)
);

create table sibex.ubicaciones (
  id                              bigint generated always as identity primary key,
  codigo                          text check (codigo is null or char_length(codigo) <= 20),
  nombre                          text not null check (char_length(trim(nombre)) > 0 and char_length(nombre) <= 300),
  es_generica                     boolean not null default false,
  -- Origen por defecto de un Egreso Rápido (sección 9b, create_comanda_rapida).
  -- Reemplaza el nombre hardcodeado "UCV Centro de Acopio" del sistema viejo:
  -- cada organización marca UNA ubicación genérica propia con este flag.
  es_default_egreso               boolean not null default false,
  tipo                            sibex.ubicacion_tipo not null default 'otro',
  estado                          sibex.ubicacion_estado not null default 'por_confirmar',
  municipio_id                    smallint references sibex.municipios (id) on delete set null,
  parroquia_id                    smallint references sibex.parroquias (id) on delete set null,
  ruta_eje_id                     smallint references sibex.rutas_ejes (id) on delete set null,
  ubicacion_exacta                text check (ubicacion_exacta is null or char_length(ubicacion_exacta) <= 500),
  referencia_gps                  text check (referencia_gps is null or char_length(referencia_gps) <= 300),
  dias_sin_atencion_maximo        integer,
  tipo_albergue                   sibex.tipo_albergue,
  tipo_espacio                    sibex.tipo_espacio,
  vulnerabilidad                  sibex.nivel_vulnerabilidad,
  verificador_ci                  bigint references sibex.persons (ci) on delete set null,
  verificador                     text check (verificador is null or char_length(verificador) <= 200),
  verificador_asignado_en         timestamptz,
  beneficiarios_hombres           integer check (beneficiarios_hombres is null or beneficiarios_hombres >= 0),
  beneficiarios_mujeres           integer check (beneficiarios_mujeres is null or beneficiarios_mujeres >= 0),
  beneficiarios_ninos             integer check (beneficiarios_ninos is null or beneficiarios_ninos >= 0),
  beneficiarios_adultos_mayores   integer check (beneficiarios_adultos_mayores is null or beneficiarios_adultos_mayores >= 0),
  beneficiarios_familias          integer check (beneficiarios_familias is null or beneficiarios_familias >= 0),
  beneficiarios_total             integer check (beneficiarios_total is null or beneficiarios_total >= 0),
  desglose_poblacion              text,
  requerimientos                  text,
  atencion_requerida               text,
  capacidad_logistica              text,
  capacidades_atencion             text,
  confirmado_por                   text check (confirmado_por is null or char_length(confirmado_por) <= 200),
  observaciones                    text,
  transporte_notas                 text,
  created_at                       timestamptz not null default now(),
  updated_at                       timestamptz not null default now(),
  deleted_at                       timestamptz
);
create index ubicaciones_deleted_at_idx on sibex.ubicaciones (deleted_at);
-- A lo sumo una ubicación puede ser el destino por defecto de Egreso Rápido.
create unique index ubicaciones_unica_default_egreso_idx on sibex.ubicaciones (es_default_egreso) where es_default_egreso;

alter table sibex.comandas
  add constraint comandas_ubicacion_fkey foreign key (ubicacion_id)
  references sibex.ubicaciones (id) on delete set null;

create table sibex.ubicacion_contactos (
  id            bigint generated always as identity primary key,
  ubicacion_id  bigint not null references sibex.ubicaciones (id) on delete cascade,
  nombre        text not null check (char_length(trim(nombre)) > 0 and char_length(nombre) <= 200),
  telefono      text check (telefono is null or char_length(telefono) <= 100),
  rol           text check (rol is null or char_length(rol) <= 200),
  created_at    timestamptz not null default now()
);

create table sibex.ubicacion_imagenes (
  id             bigint generated always as identity primary key,
  ubicacion_id   bigint not null references sibex.ubicaciones (id) on delete cascade,
  filename       text not null check (char_length(filename) <= 255),
  url            text not null,
  created_by_ci  bigint references sibex.persons (ci) on delete set null,
  created_by     text,
  created_at     timestamptz not null default now()
);

-- Presente en el dump de referencia (schema.txt) pero sin modelo activo en
-- el backend actual — se replica igual por fidelidad ("espejo completo").
create table sibex.ubicacion_snapshots (
  id               bigint generated always as identity primary key,
  ubicacion_id     bigint not null references sibex.ubicaciones (id) on delete cascade,
  registrado_por   bigint references sibex.persons (ci) on delete set null,
  estado           sibex.ubicacion_estado,
  num_personas     integer check (num_personas is null or num_personas >= 0),
  num_familias     integer check (num_familias is null or num_familias >= 0),
  num_ninos        integer check (num_ninos is null or num_ninos >= 0),
  requerimientos   text,
  notas            text,
  registrado_en    timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════════════════
--  5. DOMINIO CONDUCTORES (complementa conductores, creada en la sección 3
--     por ser referenciada desde comandas)
-- ══════════════════════════════════════════════════════════════════════════

create table sibex.conductor_vehiculos (
  id            integer generated always as identity primary key,
  conductor_ci  bigint not null references sibex.conductores (ci) on delete cascade,
  tipo_vehiculo sibex.conductor_tipo_vehiculo not null,
  placa         varchar(20) not null,
  created_at    timestamptz not null default now()
);
create index conductor_vehiculos_conductor_ci_idx on sibex.conductor_vehiculos (conductor_ci);

create table sibex.conductor_dias (
  id            integer generated always as identity primary key,
  conductor_ci  bigint not null references sibex.conductores (ci) on delete cascade,
  dia           sibex.dia_semana not null,
  unique (conductor_ci, dia)
);
create index conductor_dias_conductor_ci_idx on sibex.conductor_dias (conductor_ci);

create table sibex.conductor_horarios (
  id            integer generated always as identity primary key,
  conductor_ci  bigint not null references sibex.conductores (ci) on delete cascade,
  bloque        sibex.bloque_horario not null,
  unique (conductor_ci, bloque)
);
create index conductor_horarios_conductor_ci_idx on sibex.conductor_horarios (conductor_ci);

create table sibex.conductor_zonas (
  id            integer generated always as identity primary key,
  conductor_ci  bigint not null references sibex.conductores (ci) on delete cascade,
  zona          sibex.zona_transporte not null,
  unique (conductor_ci, zona)
);
create index conductor_zonas_conductor_ci_idx on sibex.conductor_zonas (conductor_ci);


-- ══════════════════════════════════════════════════════════════════════════
--  6. PERSONAS COMPLEMENTARIAS (ucevistas/afectados/facultades/carreras)
-- ══════════════════════════════════════════════════════════════════════════

create table sibex.facultades (
  id      bigint generated always as identity primary key,
  nombre  varchar(200) not null unique
);

create table sibex.carreras (
  id            bigint generated always as identity primary key,
  facultad_id   bigint not null references sibex.facultades (id) on delete restrict,
  nombre        varchar(200) not null,
  unique (facultad_id, nombre)
);

create table sibex.ucevistas (
  ci            bigint primary key references sibex.persons (ci) on delete cascade,
  facultad_id   bigint references sibex.facultades (id) on delete set null,
  carrera_id    bigint references sibex.carreras (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

create table sibex.afectados (
  ci                      bigint primary key references sibex.persons (ci) on delete cascade,
  informacion_adicional   text,
  created_at              timestamptz default now(),
  updated_at              timestamptz
);


-- ══════════════════════════════════════════════════════════════════════════
--  7. TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════

-- 7.1 — updated_at genérico, aplicado a toda tabla que tenga esa columna.
create or replace function sibex.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in
    select c.relname from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'sibex' and a.attname = 'updated_at' and c.relkind = 'r' and not a.attisdropped
  loop
    execute format(
      'create trigger trg_%s_updated_at before update on sibex.%I for each row execute function sibex.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- 7.2 — cada producto nuevo arranca con su fila de inventory en 0.
-- SECURITY DEFINER: products SÍ acepta INSERT/UPDATE directo del cliente
-- (sync.js sube productos por REST sin pasar por una RPC), pero inventory
-- NO tiene ninguna política que permita INSERT directo a nadie (§12 — todas
-- sus escrituras van por RPCs SECURITY DEFINER). Sin este atributo, el
-- INSERT de este trigger se evalúa con los permisos del usuario que creó el
-- producto y la política de inventory lo rechaza con 403 (ver
-- supabase/2026-08-10-fix-create-inventory-row-rls.sql).
create or replace function sibex.create_inventory_row() returns trigger
language plpgsql security definer set search_path = sibex as $$
begin
  insert into sibex.inventory (product_id) values (new.id)
  on conflict (product_id) do nothing;
  return new;
end;
$$;
create trigger trg_products_create_inventory
  after insert on sibex.products
  for each row execute function sibex.create_inventory_row();

-- 7.2b — products.grupo_id se mantiene sincronizado con la categoría del
-- producto (denormalizado, ver comentario en la tabla) — el cliente nunca
-- necesita enviarlo, solo category_id como ya hacía.
create or replace function sibex.sync_product_grupo() returns trigger
language plpgsql as $$
begin
  new.grupo_id := (select grupo_id from sibex.categories where id = new.category_id);
  return new;
end;
$$;
create trigger trg_products_sync_grupo
  before insert or update of category_id on sibex.products
  for each row execute function sibex.sync_product_grupo();

-- 7.3 — ajusta inventory.qnty al insertar una línea de movimiento, y paga
-- requests abiertas (oldest-first) cuando el movimiento es de entrada.
create or replace function sibex.apply_movement_item() returns trigger
language plpgsql as $$
declare
  dir     sibex.movement_direction;
  budget  integer;
  r       record;
begin
  select direction into dir from sibex.movements where id = new.movement_id;

  if dir = 'in' then
    update sibex.inventory set qnty = qnty + new.qnty where product_id = new.product_id;

    budget := new.qnty;
    for r in
      select id, qnty_outstanding from sibex.requests
       where product_id = new.product_id and status = 'open'
       order by requested_at, id
    loop
      exit when budget <= 0;
      if r.qnty_outstanding <= budget then
        update sibex.requests set qnty_outstanding = 0, status = 'fulfilled' where id = r.id;
        budget := budget - r.qnty_outstanding;
      else
        update sibex.requests set qnty_outstanding = qnty_outstanding - budget where id = r.id;
        budget := 0;
      end if;
    end loop;
  else
    update sibex.inventory set qnty = qnty - new.qnty where product_id = new.product_id;
  end if;

  return new;
end;
$$;
create trigger trg_movement_items_apply
  after insert on sibex.movement_items
  for each row execute function sibex.apply_movement_item();

-- 7.4 — revierte/ajusta inventory.qnty al corregir o borrar una línea ya
-- aplicada (usado por "corregir/borrar" en la Bitácora).
create or replace function sibex.apply_movement_item_changes() returns trigger
language plpgsql as $$
declare dir sibex.movement_direction;
begin
  if tg_op = 'DELETE' then
    select direction into dir from sibex.movements where id = old.movement_id;
    if dir = 'in' then
      update sibex.inventory set qnty = qnty - old.qnty where product_id = old.product_id;
    else
      update sibex.inventory set qnty = qnty + old.qnty where product_id = old.product_id;
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if new.qnty <> old.qnty then
      select direction into dir from sibex.movements where id = new.movement_id;
      if dir = 'in' then
        update sibex.inventory set qnty = qnty + (new.qnty - old.qnty) where product_id = new.product_id;
      else
        update sibex.inventory set qnty = qnty - (new.qnty - old.qnty) where product_id = new.product_id;
      end if;
    end if;
    return new;
  end if;

  return null;
end;
$$;
create trigger trg_movement_items_update_delete
  after update or delete on sibex.movement_items
  for each row execute function sibex.apply_movement_item_changes();

-- 7.5 — exige que todo movement tenga al menos una línea (deferred: permite
-- insertar movement + movement_items en la misma transacción).
create or replace function sibex.movement_has_items() returns trigger
language plpgsql as $$
begin
  if not exists (select 1 from sibex.movement_items where movement_id = new.id) then
    raise exception 'Movement % must have at least one item', new.id;
  end if;
  return null;
end;
$$;
create constraint trigger trg_movement_has_items
  after insert on sibex.movements
  deferrable initially deferred
  for each row execute function sibex.movement_has_items();

-- 7.6 — una request nueva arranca con todo el monto pendiente.
create or replace function sibex.init_request_outstanding() returns trigger
language plpgsql as $$
begin
  if new.qnty_outstanding is null then
    new.qnty_outstanding := new.qnty;
  end if;
  return new;
end;
$$;
create trigger trg_requests_init
  before insert on sibex.requests
  for each row execute function sibex.init_request_outstanding();

-- 7.7 — borra el teléfono de una persona al eliminarla.
create or replace function sibex.delete_person_phone() returns trigger
language plpgsql as $$
begin
  delete from sibex.phones where id = old.phone_id;
  return old;
end;
$$;
create trigger trg_persons_delete_phone
  after delete on sibex.persons
  for each row execute function sibex.delete_person_phone();


-- ══════════════════════════════════════════════════════════════════════════
--  8. AUTENTICACIÓN — helpers de rol/área a partir del JWT de Supabase Auth
-- ══════════════════════════════════════════════════════════════════════════

-- Rol/área viven en auth.users.raw_app_meta_data — solo lo puede escribir
-- la Admin API (service_role), nunca el propio usuario (a diferencia de
-- user_metadata). Estas funciones leen el JWT ya verificado de la sesión
-- actual, no hacen falta joins ni relecturas de tabla.
create or replace function sibex.current_role() returns text
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

create or replace function sibex.current_area() returns text
language sql stable as $$
  select auth.jwt() -> 'app_metadata' ->> 'area'
$$;

-- Grupo de extensión del actor actual — null para super_admin (no tiene
-- uno propio, ve todos) y para cualquier sesión sin grupo asignado.
create or replace function sibex.current_grupo_id() returns bigint
language sql stable as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'grupo_id', '')::bigint
$$;

create or replace function sibex.is_super_admin() returns boolean
language sql stable as $$
  select sibex.current_role() = 'super_admin'
$$;

-- is_admin() incluye super_admin: todo lo que hoy usa is_admin() como gate
-- de ROL sigue funcionando para super_admin sin tocarlo — el límite real de
-- a qué FILAS llega queda en can_access_grupo()/can_access_category() y en
-- las policies/RPCs que además comparan grupo_id.
create or replace function sibex.is_admin() returns boolean
language sql stable as $$
  select sibex.current_role() in ('admin', 'super_admin')
$$;

-- ¿Puede el actor actual tocar datos de este grupo? super_admin: siempre.
-- admin/coordinador: solo el suyo propio.
create or replace function sibex.can_access_grupo(p_grupo_id bigint) returns boolean
language sql stable as $$
  select sibex.is_super_admin() or sibex.current_grupo_id() = p_grupo_id
$$;

create or replace function sibex.is_coordinador() returns boolean
language sql stable as $$
  select sibex.current_role() = 'coordinador'
$$;

-- ci de la persona detrás de la sesión actual, resuelto vía persons.auth_user_id.
create or replace function sibex.current_person_ci() returns bigint
language sql stable security definer set search_path = sibex as $$
  select ci from sibex.persons where auth_user_id = auth.uid()
$$;

-- El área de un coordinador ES el id de una categoría (texto), o el literal
-- 'general' (sin categoría propia — ve/despacha todo, nunca edita, ver
-- 05-autenticacion.md del sistema viejo). NULL si el área no está fijada
-- (p.ej. admin, que no tiene categoría propia) o si el valor es 'general'.
create or replace function sibex.current_category_id() returns bigint
language sql stable as $$
  select nullif(sibex.current_area(), 'general')::bigint
$$;

-- ¿Puede el actor actual tocar productos/movimientos de esta categoría?
-- super_admin: siempre. admin/coordinador de 'general': siempre dentro de
-- SU grupo (consulta/despacha todo, nunca su propio inventario).
-- coordinador de categoría real: solo la suya, y solo dentro de su grupo.
-- Un solo cambio acá se propaga a TODA policy/RPC que ya llama
-- can_access_category() (products, inventory, movements, movement_items,
-- requests, comandas, comanda_items, merge_product, apply_count, etc.) sin
-- tener que tocarlas una por una.
create or replace function sibex.can_access_category(p_category_id bigint) returns boolean
language sql stable as $$
  select sibex.is_super_admin()
      or (
        sibex.can_access_grupo((select grupo_id from sibex.categories where id = p_category_id))
        and (
          sibex.current_role() = 'admin'
          or sibex.current_area() = 'general'
          or p_category_id = sibex.current_category_id()
        )
      )
$$;

-- Construye el "note" atribuible de un movement: "Nombre Apellido - Área -
-- Tipo" (Tipo = Recepción/Conteo/Egreso). Área = nombre real de la
-- categoría del actor, 'General' si su área es 'general', o 'Administrador'
-- si es admin (nunca tiene categoría propia). Centralizado acá porque lo
-- usan apply_count (Recepción/Conteo, según quién llame) y
-- create_comanda_rapida (siempre Egreso) — la Bitácora y la pestaña
-- Ingresos filtran/agrupan leyendo este mismo formato, ver
-- supabase/functions y js/views/registro.js / js/views/ingresos.js.
create or replace function sibex.actor_note(p_tipo text) returns text
language plpgsql stable security definer set search_path = sibex as $$
declare v_ci bigint; v_nombre text; v_area_label text;
begin
  v_ci := sibex.current_person_ci();
  select (name || ' ' || surname) into v_nombre from sibex.persons where ci = v_ci;

  if sibex.is_admin() then
    v_area_label := 'Administrador';
  elsif sibex.current_area() = 'general' then
    v_area_label := 'General';
  else
    select nombre into v_area_label from sibex.categories where id = sibex.current_category_id();
  end if;

  return coalesce(v_nombre, 'Desconocido') || ' - ' || coalesce(v_area_label, '—') || ' - ' || p_tipo;
end;
$$;

-- Completa el vínculo persons -> auth.users tras crear la cuenta con la
-- Admin API. Solo la Edge Function la llama (service_role bypassa RLS y
-- grants por diseño de Supabase) — no se otorga EXECUTE a anon/authenticated
-- a propósito: nadie con solo la anon/authenticated key puede auto-vincularse
-- una cuenta ajena.
create or replace function sibex.link_person_login(p_ci bigint, p_auth_user_id uuid) returns void
language plpgsql security definer set search_path = sibex as $$
begin
  update sibex.persons set auth_user_id = p_auth_user_id where ci = p_ci;
  if not found then
    raise exception 'Persona % no existe', p_ci;
  end if;
end;
$$;
revoke execute on function sibex.link_person_login(bigint, uuid) from public, anon, authenticated;

-- Crea una persona SIN inicio de sesión (nombre/apellido/cédula/teléfono).
-- admin y coordinador pueden llamarla — la política real de "quién puede
-- crear a quién" vive en RLS sobre `persons` (sección 9), esta RPC solo
-- resuelve el alta de phones + persons en una transacción. p_grupo_id: un
-- admin/coordinador siempre crea dentro de su propio grupo (se ignora
-- cualquier otro valor que mande el cliente); super_admin debe indicarlo
-- explícitamente (no tiene uno propio).
create or replace function sibex.create_person(
  p_ci bigint, p_name text, p_surname text,
  p_phone_company_code text, p_phone_number text,
  p_categoria sibex.person_categoria default null,
  p_grupo_id bigint default null
) returns table(ci bigint, name text, surname text)
language plpgsql security definer set search_path = sibex as $$
declare v_phone_id bigint; v_grupo bigint; v_existing_grupo bigint;
begin
  if sibex.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para crear personas';
  end if;
  v_grupo := case when sibex.is_super_admin() then p_grupo_id else sibex.current_grupo_id() end;
  if v_grupo is null then
    raise exception 'Falta indicar el grupo de extensión';
  end if;

  -- ci es bigint primary key GLOBAL (no está compuesta con grupo_id) — sin
  -- este chequeo, dos grupos con una persona de la misma cédula chocarían
  -- contra el unique_violation de abajo (409 críptico) o, peor, el upsert
  -- pisaría en silencio los datos de la persona de OTRO grupo.
  select grupo_id into v_existing_grupo from sibex.persons where sibex.persons.ci = p_ci;
  if v_existing_grupo is not null and v_existing_grupo <> v_grupo then
    raise exception 'Esa cédula ya está registrada en otro grupo de extensión';
  end if;

  insert into sibex.phones (company_code, number)
    values (p_phone_company_code, p_phone_number)
    on conflict (company_code, number) do nothing;
  select id into v_phone_id from sibex.phones
    where company_code = p_phone_company_code and number = p_phone_number;

  -- Upsert real (antes solo insert): si la persona ya existe (p.ej. la creó
  -- un coordinador desde Egreso Rápido, o es un reintento tras un
  -- grant_login fallido), esto la actualiza en vez de tirar unique_violation
  -- — coherente con el comentario de voluntarios.js que ya asumía este
  -- comportamiento. grupo_id nunca se toca en el update (una persona no
  -- cambia de grupo por acá).
  insert into sibex.persons (ci, name, surname, phone_id, categoria, grupo_id)
    values (p_ci, p_name, p_surname, v_phone_id, p_categoria, v_grupo)
  on conflict (ci) do update set
    name = excluded.name, surname = excluded.surname, phone_id = excluded.phone_id;

  return query select p_ci, p_name, p_surname;
end;
$$;
grant execute on function sibex.create_person(bigint, text, text, text, text, sibex.person_categoria, bigint) to authenticated;

-- Deshace un create_person cuando el paso 2 (grant_login, Admin API en la
-- Edge Function) falla DESPUÉS de que el paso 1 ya guardó la persona — sin
-- esto, un fallo a mitad de camino (p.ej. el correo ya existe en Auth) deja
-- una persona sin ningún acceso "atascada" en la lista. El llamador
-- (voluntarios.js) solo la invoca cuando la persona no existía antes de su
-- propio intento — nunca para borrar a alguien que ya estaba ahí de antes.
-- Por eso mismo esta función también se niega sola si la persona YA tiene
-- login (auth_user_id no nulo): en ese punto ya no es "deshacer una
-- creación fallida", es borrar una cuenta real, fuera de este alcance.
create or replace function sibex.delete_person_if_no_login(p_ci bigint) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_grupo bigint; v_auth_user_id uuid;
begin
  if not sibex.is_admin() then
    raise exception 'Rol sin permiso para borrar personas';
  end if;

  select grupo_id, auth_user_id into v_grupo, v_auth_user_id
    from sibex.persons where sibex.persons.ci = p_ci;
  if v_grupo is null then return; end if; -- ya no existe, nada que deshacer
  if not sibex.can_access_grupo(v_grupo) then
    raise exception 'Esa persona pertenece a otro grupo de extensión';
  end if;
  if v_auth_user_id is not null then
    raise exception 'Esa persona ya tiene inicio de sesión — no se puede deshacer su creación';
  end if;

  delete from sibex.persons where sibex.persons.ci = p_ci;
end;
$$;
grant execute on function sibex.delete_person_if_no_login(bigint) to authenticated;

-- ══════════════════════════════════════════════════════════════════════════
--  8b. CATEGORÍAS — CRUD, admin-only (GBSInventario es una plantilla: cada
--      organización define sus propias categorías, no un set fijo).
-- ══════════════════════════════════════════════════════════════════════════

-- p_grupo_id: un admin de grupo siempre crea dentro de su propio grupo (se
-- ignora cualquier otro valor que mande el cliente); super_admin debe
-- indicarlo explícitamente (no tiene uno propio).
create or replace function sibex.create_category(p_nombre text, p_grupo_id bigint default null) returns bigint
language plpgsql security definer set search_path = sibex as $$
declare v_id bigint; v_grupo bigint;
begin
  if not sibex.is_admin() then
    raise exception 'Solo un administrador puede crear categorías';
  end if;
  v_grupo := case when sibex.is_super_admin() then p_grupo_id else sibex.current_grupo_id() end;
  if v_grupo is null then
    raise exception 'Falta indicar el grupo de extensión';
  end if;
  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El nombre de la categoría es obligatorio';
  end if;
  insert into sibex.categories (nombre, grupo_id) values (btrim(p_nombre), v_grupo) returning id into v_id;
  return v_id;
end;
$$;
grant execute on function sibex.create_category(text, bigint) to authenticated;

create or replace function sibex.update_category(p_id bigint, p_nombre text) returns void
language plpgsql security definer set search_path = sibex as $$
begin
  if not (sibex.is_admin() and sibex.can_access_category(p_id)) then
    raise exception 'Solo un administrador puede editar categorías';
  end if;
  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El nombre de la categoría es obligatorio';
  end if;
  update sibex.categories set nombre = btrim(p_nombre) where id = p_id;
  if not found then raise exception 'Categoría % no existe', p_id; end if;
end;
$$;
grant execute on function sibex.update_category(bigint, text) to authenticated;

-- Borra una categoría. Bloquea si todavía hay productos asignados (el admin
-- debe reasignarlos con update_product_category, o eliminarlos, primero) —
-- evita productos huérfanos y borrados accidentales de catálogo completo.
--
-- Efecto en cascada sobre personas: cualquier coordinador cuya área sea esta
-- categoría queda SIN ACCESO — "rebajado a persona sin acceso al sistema"
-- (no se borra ni la persona ni la cuenta de Auth, solo se le limpia
-- rol/área). auth.users vive en la misma base Postgres, así que un UPDATE
-- directo sobre su columna de metadata no requiere la Admin API — a
-- diferencia de crear/borrar una cuenta, que sí la requiere (ver Edge
-- Function). CAVEAT importante: el JWT de una sesión ya emitida sigue
-- teniendo el rol/área viejo hasta que se refresca (Supabase lo renueva
-- automáticamente cada ~1h) — para revocar al instante hace falta además
-- invalidar su sesión (auth.admin.signOut), eso sí vive en la Edge Function.
create or replace function sibex.delete_category(p_id bigint) returns void
language plpgsql security definer set search_path = sibex as $$
begin
  if not (sibex.is_admin() and sibex.can_access_category(p_id)) then
    raise exception 'Solo un administrador puede eliminar categorías';
  end if;
  -- Solo productos VIVOS bloquean el borrado — uno soft-borrado sigue en la
  -- BD (para no perder su historial) pero ya no cuenta como "en uso". Los
  -- soft-borrados que queden apuntando a p_id se desvinculan solos por el FK
  -- category_id → categories ON DELETE SET NULL al ejecutar el DELETE de abajo.
  if exists (select 1 from sibex.products where category_id = p_id and deleted_at is null) then
    raise exception 'Hay productos en esta categoría — reasígnalos o elimínalos antes de borrarla';
  end if;

  update auth.users
     set raw_app_meta_data = raw_app_meta_data - 'role' - 'area'
   where raw_app_meta_data ->> 'area' = p_id::text;

  delete from sibex.categories where id = p_id;
  if not found then raise exception 'Categoría % no existe', p_id; end if;
end;
$$;
grant execute on function sibex.delete_category(bigint) to authenticated;

-- Lista personas CON inicio de sesión y su rol/área/estado — admin-only.
-- Hace falta una RPC (no un SELECT REST normal) porque rol/área/baneo viven
-- en auth.users (app_metadata/banned_until), tabla que PostgREST nunca
-- expone a anon/authenticated directamente. La Edge Function (manage-users)
-- es quien escribe rol/área/baneo; esta RPC solo lee, para pintar el hub de
-- accesos y el conteo de "Usuarios activos" en Resumen.
-- `active`: activar/desactivar (Edge Function #set_active) usa el baneo
-- nativo de Supabase Auth (banned_until), no una columna propia — un
-- usuario desactivado no puede ni siquiera iniciar sesión, no es solo un
-- flag cosmético.
-- super_admin ve admin+coordinador de TODOS los grupos (con el nombre del
-- grupo); un admin de grupo sigue viendo solo coordinador de su propio
-- grupo (nunca a otros admins), igual que antes.
drop function if exists sibex.list_users_with_access();
create or replace function sibex.list_users_with_access() returns table(
  ci bigint, name text, surname text, email text, role text, area text, active boolean,
  phone_company_code text, phone_number text, grupo_id bigint, grupo_nombre text
)
language plpgsql security definer set search_path = sibex as $$
begin
  if not sibex.is_admin() then
    raise exception 'Solo un administrador puede listar usuarios';
  end if;

  return query
    select p.ci, p.name, p.surname, u.email::text,
           u.raw_app_meta_data ->> 'role', u.raw_app_meta_data ->> 'area',
           (u.banned_until is null or u.banned_until < now()),
           ph.company_code, ph.number,
           p.grupo_id, g.nombre
    from sibex.persons p
    join auth.users u on u.id = p.auth_user_id
    left join sibex.phones ph on ph.id = p.phone_id
    left join sibex.grupos g on g.id = p.grupo_id
    where u.raw_app_meta_data ->> 'role' is not null
      and (
        (sibex.is_super_admin() and u.raw_app_meta_data ->> 'role' <> 'super_admin')
        or (not sibex.is_super_admin() and u.raw_app_meta_data ->> 'role' = 'coordinador' and p.grupo_id = sibex.current_grupo_id())
      )
    order by p.name, p.surname;
end;
$$;
grant execute on function sibex.list_users_with_access() to authenticated;

-- Edita TODOS los datos de una `persons` (nombre/apellido/teléfono/cédula) —
-- admin-only, a diferencia de update_own_profile (autoservicio, sin poder
-- tocar la cédula de nadie). p_new_ci permite renombrar la cédula misma: es
-- la PK de `persons` y está referenciada por FK desde más de una decena de
-- tablas (comandas, movements, conductores, ubicaciones, etc.) — todas esas
-- FKs se migraron a "on update cascade" (ver bloque DO más abajo en este
-- mismo script) para que un solo `update persons set ci = ...` reatribuya
-- automáticamente TODO el historial sin tener que tocar tabla por tabla acá.
-- El correo (auth.users, fuera del alcance de una RPC normal) se edita
-- aparte desde la Edge Function (manage-users#update_email).
create or replace function sibex.admin_update_person(
  p_ci bigint, p_new_ci bigint, p_name text, p_surname text,
  p_phone_company_code text, p_phone_number text
) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_phone_id bigint; v_grupo bigint;
begin
  if not sibex.is_admin() then
    raise exception 'Solo un administrador puede editar los datos de una persona';
  end if;
  select grupo_id into v_grupo from sibex.persons where ci = p_ci;
  if not found then
    raise exception 'No existe ninguna persona con cédula %', p_ci;
  end if;
  if not sibex.can_access_grupo(v_grupo) then
    raise exception 'No tienes permiso para editar a esta persona';
  end if;
  if p_new_ci is null or p_new_ci <= 0 then
    raise exception 'Cédula inválida';
  end if;
  if p_name is null or btrim(p_name) = '' or p_surname is null or btrim(p_surname) = '' then
    raise exception 'Nombre y apellido son obligatorios';
  end if;
  if p_new_ci <> p_ci and exists (select 1 from sibex.persons where ci = p_new_ci) then
    raise exception 'Ya existe otra persona con la cédula %', p_new_ci;
  end if;

  insert into sibex.phones (company_code, number)
    values (p_phone_company_code, p_phone_number)
    on conflict (company_code, number) do nothing;
  select id into v_phone_id from sibex.phones
    where company_code = p_phone_company_code and number = p_phone_number;

  if p_new_ci <> p_ci then
    update sibex.persons set ci = p_new_ci where ci = p_ci;
  end if;

  update sibex.persons
     set name = btrim(p_name), surname = btrim(p_surname), phone_id = v_phone_id, updated_at = now()
   where ci = p_new_ci;
end;
$$;
grant execute on function sibex.admin_update_person(bigint, bigint, text, text, text, text) to authenticated;

-- Migra TODAS las foreign keys que referencian persons(ci) a "on update
-- cascade" — sin esto, admin_update_person no podría renombrar una cédula
-- en uso: cualquier fila que la referenciara (una comanda, un movimiento,
-- etc.) bloquearía el update con una violación de integridad referencial.
-- Recorre pg_constraint en vez de listar cada tabla a mano — así no hace
-- falta mantener esta lista sincronizada si el esquema agrega otra FK hacia
-- persons(ci) más adelante. Idempotente: puede correr de nuevo sin error
-- (una FK que ya quedó "on update cascade" simplemente se recrea igual).
do $$
declare rec record;
begin
  for rec in
    select con.conname, cl.relname as table_name, pg_get_constraintdef(con.oid) as def
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    where con.contype = 'f'
      and con.confrelid = 'sibex.persons'::regclass
  loop
    execute format('alter table sibex.%I drop constraint %I', rec.table_name, rec.conname);
    execute format('alter table sibex.%I add constraint %I %s on update cascade', rec.table_name, rec.conname, rec.def);
  end loop;
end $$;

-- Conteo de "Usuarios activos" para la pestaña Resumen — cualquier sesión
-- puede verlo (a diferencia de list_users_with_access, que expone
-- correo/área de cada quien y es admin-only), solo el número.
create or replace function sibex.count_active_users() returns integer
language sql security definer set search_path = sibex as $$
  select count(*)::integer
  from sibex.persons p
  join auth.users u on u.id = p.auth_user_id
  where u.raw_app_meta_data ->> 'role' in ('admin', 'coordinador', 'super_admin')
    and (u.banned_until is null or u.banned_until < now())
    and (sibex.is_super_admin() or p.grupo_id = sibex.current_grupo_id())
$$;
grant execute on function sibex.count_active_users() to authenticated;

-- Reasigna la categoría de un producto — admin-only, a diferencia de crear/
-- editar/borrar insumos (que sí puede un coordinador de esa categoría).
-- Exige poder tocar tanto la categoría actual del producto como la
-- destino (mismo patrón que merge_product) — bloquea mover un producto a
-- una categoría de OTRO grupo sin querer.
create or replace function sibex.update_product_category(p_product_id bigint, p_category_id bigint) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_current_cat bigint;
begin
  if not sibex.is_admin() then
    raise exception 'Solo un administrador puede reasignar la categoría de un producto';
  end if;
  select category_id into v_current_cat from sibex.products where id = p_product_id;
  if not found then raise exception 'Producto % no existe', p_product_id; end if;
  if not sibex.can_access_category(v_current_cat) or not sibex.can_access_category(p_category_id) then
    raise exception 'No tienes permiso para reasignar insumos de esta categoría';
  end if;
  update sibex.products set category_id = p_category_id, updated_at = now() where id = p_product_id;
end;
$$;
grant execute on function sibex.update_product_category(bigint, bigint) to authenticated;

-- Grupos de extensión — CRUD mínimo, super_admin-only (mismo patrón que
-- create_category/update_category). Sin delete en esta versión: igual de
-- arriesgado que borrar una categoría con productos, un nivel más arriba.
create or replace function sibex.create_grupo(p_nombre text) returns bigint
language plpgsql security definer set search_path = sibex as $$
declare v_id bigint;
begin
  if not sibex.is_super_admin() then
    raise exception 'Solo un super administrador puede crear grupos de extensión';
  end if;
  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El nombre del grupo es obligatorio';
  end if;
  insert into sibex.grupos (nombre) values (btrim(p_nombre)) returning id into v_id;
  return v_id;
end;
$$;
grant execute on function sibex.create_grupo(text) to authenticated;

create or replace function sibex.update_grupo(p_id bigint, p_nombre text) returns void
language plpgsql security definer set search_path = sibex as $$
begin
  if not sibex.is_super_admin() then
    raise exception 'Solo un super administrador puede editar grupos de extensión';
  end if;
  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El nombre del grupo es obligatorio';
  end if;
  update sibex.grupos set nombre = btrim(p_nombre) where id = p_id;
  if not found then raise exception 'Grupo % no existe', p_id; end if;
end;
$$;
grant execute on function sibex.update_grupo(bigint, text) to authenticated;

-- Autoservicio de perfil — a diferencia del sistema viejo, el actor NUNCA
-- se manda como parámetro (p_actor_ci): sale de auth.uid() vía el JWT ya
-- verificado, así que no hay forma de que alguien edite el perfil de otra
-- persona pasando un ci ajeno.
create or replace function sibex.update_own_profile(
  p_name text, p_surname text, p_phone_company_code text, p_phone_number text
) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_ci bigint; v_phone_id bigint;
begin
  v_ci := sibex.current_person_ci();
  if v_ci is null then
    raise exception 'Sesión sin persona asociada';
  end if;
  if p_name is null or btrim(p_name) = '' or p_surname is null or btrim(p_surname) = '' then
    raise exception 'Nombre y apellido son obligatorios';
  end if;

  insert into sibex.phones (company_code, number)
    values (p_phone_company_code, p_phone_number)
    on conflict (company_code, number) do nothing;
  select id into v_phone_id from sibex.phones
    where company_code = p_phone_company_code and number = p_phone_number;

  update sibex.persons
     set name = btrim(p_name), surname = btrim(p_surname), phone_id = v_phone_id
   where ci = v_ci;
end;
$$;
grant execute on function sibex.update_own_profile(text, text, text, text) to authenticated;

-- NOTA: promover/degradar rol, asignar área, activar/desactivar login,
-- resetear contraseña de otro usuario y eliminar una cuenta de Auth
-- requieren la Admin API (service_role) — viven en la Edge Function, no
-- acá. Ver el punto 4 del resumen al final del mensaje.


-- ══════════════════════════════════════════════════════════════════════════
--  9. CONTEO DE INVENTARIO — RPCs (mismo motor que la app usa hoy, portado
--     a auth.uid() en vez de un p_actor_ci enviado por el cliente)
-- ══════════════════════════════════════════════════════════════════════════

-- p_origen distingue QUIÉN llamó, no el signo del delta — ambos orígenes
-- pueden sumar o restar: 'ingreso' = Ingreso Rápido (en la práctica solo
-- suma, la UI no ofrece restar ahí), 'conteo' = los controles +/−/cantidad
-- de la pestaña Insumos. Egreso Rápido nunca pasa por acá, ver
-- create_comanda_rapida (siempre "Egreso").
create or replace function sibex.apply_count(
  p_client_op_id       text,
  p_product_client_id  text,
  p_delta              integer,
  p_origen             text
) returns integer
language plpgsql security definer set search_path = sibex as $$
declare v_pid bigint; v_cat bigint; v_mid bigint; v_qty integer; v_ci bigint; v_tipo text;
begin
  if sibex.current_role() not in ('admin', 'coordinador') then
    raise exception 'Rol sin permiso para modificar el inventario';
  end if;
  if p_origen not in ('ingreso', 'conteo') then
    raise exception 'Origen inválido: debe ser ingreso o conteo';
  end if;
  v_tipo := case p_origen when 'ingreso' then 'Recepción' else 'Conteo' end;
  v_ci := sibex.current_person_ci();

  select id, category_id into v_pid, v_cat from sibex.products where client_id = p_product_client_id;
  if v_pid is null then
    raise exception 'Producto % no existe', p_product_client_id;
  end if;
  if not sibex.can_access_category(v_cat) then
    raise exception 'No tienes permiso para modificar insumos de esta categoría';
  end if;

  if p_client_op_id is not null and exists (
    select 1 from sibex.movements where client_op_id = p_client_op_id
  ) then
    select qnty into v_qty from sibex.inventory where product_id = v_pid;
    return v_qty;
  end if;

  if p_delta <> 0 then
    insert into sibex.movements (direction, note, client_op_id, delivered_by)
      values (
        case when p_delta > 0 then 'in'::sibex.movement_direction else 'out'::sibex.movement_direction end,
        sibex.actor_note(v_tipo), p_client_op_id, v_ci
      ) returning id into v_mid;

    insert into sibex.movement_items (movement_id, product_id, qnty)
      values (v_mid, v_pid, abs(p_delta));
  end if;

  update sibex.inventory
     set last_counted_at = now(),
         last_counted_by = coalesce((select name || ' ' || surname from sibex.persons where ci = v_ci), last_counted_by)
   where product_id = v_pid;

  select qnty into v_qty from sibex.inventory where product_id = v_pid;
  return v_qty;
end;
$$;
grant execute on function sibex.apply_count(text, text, integer, text) to authenticated;

create or replace function sibex.uncount_item(p_product_client_id text) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_pid bigint; v_cat bigint;
begin
  if sibex.current_role() not in ('admin', 'coordinador') then
    raise exception 'Rol sin permiso para modificar el inventario';
  end if;

  select id, category_id into v_pid, v_cat from sibex.products where client_id = p_product_client_id;
  if v_pid is null then return; end if;
  if not sibex.can_access_category(v_cat) then
    raise exception 'No tienes permiso para modificar insumos de esta categoría';
  end if;

  delete from sibex.movements
   where id in (select movement_id from sibex.movement_items where product_id = v_pid);

  update sibex.inventory
     set qnty = 0, last_counted_at = null, last_counted_by = null
   where product_id = v_pid;
end;
$$;
grant execute on function sibex.uncount_item(text) to authenticated;

create or replace function sibex.delete_count(p_client_op_id text) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_mid bigint; v_product_ids bigint[];
begin
  if sibex.current_role() not in ('admin', 'coordinador') then
    raise exception 'Rol sin permiso para modificar el inventario';
  end if;

  select id into v_mid from sibex.movements where client_op_id = p_client_op_id;
  if v_mid is null then return; end if;

  select array_agg(product_id) into v_product_ids
    from sibex.movement_items where movement_id = v_mid;

  if exists (
    select 1 from unnest(v_product_ids) pid
    join sibex.products p on p.id = pid
    where not sibex.can_access_category(p.category_id)
  ) then
    raise exception 'No tienes permiso para modificar insumos de esta categoría';
  end if;

  delete from sibex.movements where id = v_mid;

  update sibex.inventory i set
    last_counted_at = (
      select max(m.occurred_at) from sibex.movements m
      join sibex.movement_items mi on mi.movement_id = m.id
      where mi.product_id = i.product_id),
    last_counted_by = (
      select m.note from sibex.movements m
      join sibex.movement_items mi on mi.movement_id = m.id
      where mi.product_id = i.product_id
      order by m.occurred_at desc limit 1)
  where i.product_id = any(v_product_ids);
end;
$$;
grant execute on function sibex.delete_count(text) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
--  9b. EGRESO RÁPIDO — create_comanda_rapida (bitácora de salidas)
--
--  Hallazgo clave al revisar el frontend: Egreso Rápido NO usa apply_count.
--  Genera un documento de negocio real (una `comanda` origen='rapida', ya
--  'completada') con reserva de stock atómica (FOR UPDATE) para un carrito de
--  varios ítems a la vez — apply_count es de un solo ítem (conteo físico),
--  no sirve para esto. Sin esta RPC, Egreso Rápido queda sin forma de
--  descontar stock ni dejar rastro en la Bitácora. Portado del original
--  (UCVInventario/supabase/2026-07-30-egreso-rapido-autorizado-por-fix.sql)
--  con cambios: auth.uid() en vez de p_actor_ci, chequeo de categoría por
--  ítem (coordinador solo puede egresar de su propia categoría), y sin
--  destino/ubicación — el original resolvía uno vía `ubicaciones.
--  es_default_egreso`; acá se desacopló por completo (2026-08-10, ver
--  supabase/2026-08-10-egreso-sin-ubicacion.sql): la comanda solo registra
--  solicitante, quién autorizó (creador), ítems+cantidad, id y fecha/hora.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.create_comanda_rapida(
  p_solicitante_ci  bigint,
  p_items           jsonb,   -- [{"product_id": bigint, "qnty": int}, ...]
  p_client_op_id    text default null,
  p_note            text default null
) returns table(comanda_id bigint, movement_id bigint)
language plpgsql security definer set search_path = sibex as $$
declare
  v_role text; v_ci bigint; v_actor_nombre text; v_autorizado_por text;
  v_comanda_id bigint; v_movement_id bigint;
  v_expected int; v_inserted int;
  v_pid bigint; v_pname text; v_punidad text; v_pcat bigint; v_qty int; v_disponible int;
  v_item jsonb;
begin
  v_role := sibex.current_role();
  v_ci := sibex.current_person_ci();
  if v_role not in ('admin', 'coordinador') then
    raise exception 'Rol sin permiso para registrar una entrega';
  end if;

  -- Idempotencia: reintento con el mismo client_op_id devuelve el mismo resultado.
  if p_client_op_id is not null then
    select c.id into v_comanda_id from sibex.comandas c where c.client_op_id = p_client_op_id;
    if found then
      select m.id into v_movement_id from sibex.movements m where m.client_op_id = p_client_op_id;
      return query select v_comanda_id, v_movement_id;
      return;
    end if;
  end if;

  -- Sin Solicitante a propósito: no había forma de ver/editar las personas
  -- creadas desde el formulario, así que se reemplazó por el campo "Destino"
  -- de texto libre (p_note → comandas.notas). p_solicitante_ci queda como
  -- columna nullable, ya sin uso desde el cliente (ver
  -- supabase/2026-08-11-egreso-destino-libre.sql), pero se sigue validando
  -- si algún día se vuelve a pasar un valor no nulo.
  if p_solicitante_ci is not null and not exists (select 1 from sibex.persons where ci = p_solicitante_ci) then
    raise exception 'El solicitante no existe';
  end if;

  v_expected := jsonb_array_length(p_items);
  if v_expected is null or v_expected = 0 then
    raise exception 'Agrega al menos un producto';
  end if;

  select (name || ' ' || surname) into v_actor_nombre from sibex.persons where ci = v_ci;
  v_autorizado_por := v_actor_nombre || ' (Uso Interno)';

  -- Sin ubicación por ahora (desacoplado a propósito — este sistema todavía
  -- no necesita registrar un destino/origen físico para el egreso, solo
  -- solicitante, quién autorizó, ítems+cantidad, id y fecha/hora). Antes
  -- exigía una fila en `ubicaciones` marcada es_default_egreso y fallaba
  -- por completo sin ella; ubicacion_id queda NULL (columna ya nullable).
  insert into sibex.comandas (
    solicitante_ci, estudiante_resp_ci, responsable_entrega_ci,
    aprobado_por_ci, aprobado_por, created_by_ci, created_by,
    fecha, hora_salida, hora_llegada,
    status, origen, processed_at, notas, client_op_id, autorizado_por
  ) values (
    p_solicitante_ci, v_ci, v_ci,
    v_ci, v_actor_nombre, v_ci, v_actor_nombre,
    current_date, current_time, current_time,
    'completada', 'rapida', now(), p_note, p_client_op_id, v_autorizado_por
  ) returning id into v_comanda_id;

  -- comanda_items + chequeo temprano de stock y categoría por ítem.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::bigint;
    v_qty := (v_item->>'qnty')::int;

    if v_pid is null or v_qty is null or v_qty <= 0 then
      raise exception 'Ítem inválido en el carrito (producto o cantidad faltante)';
    end if;

    select p.name, p.unidad, p.category_id into v_pname, v_punidad, v_pcat
      from sibex.products p where p.id = v_pid and p.deleted_at is null;
    if not found then
      raise exception 'Producto % no existe o fue eliminado', v_pid;
    end if;
    if not sibex.can_access_category(v_pcat) then
      raise exception 'No tienes permiso para egresar insumos de esta categoría (%)', v_pname;
    end if;

    select qnty into v_disponible from sibex.inventory where product_id = v_pid for update;
    if v_disponible is null or v_disponible < v_qty then
      raise exception 'No hay suficiente disponibilidad de "%" (disponible: %, solicitado: %)',
        v_pname, coalesce(v_disponible, 0), v_qty;
    end if;

    insert into sibex.comanda_items (comanda_id, producto, producto_id, cantidad, unidad)
      values (v_comanda_id, v_pname, v_pid, v_qty, v_punidad);
  end loop;

  -- movements.note SIEMPRE es el tag estructurado "Nombre - Área - Tipo"
  -- (acá, Tipo = 'Egreso') — p_note es texto libre del formulario, va aparte
  -- en comandas.notas (arriba), nunca pisa este formato. Sin destination por
  -- el mismo motivo que ubicacion_id arriba (columna ya nullable).
  insert into sibex.movements (direction, note, client_op_id, occurred_at, delivered_by)
    values ('out', sibex.actor_note('Egreso'), p_client_op_id, now(), v_ci)
    returning id into v_movement_id;

  update sibex.comandas set movement_id = v_movement_id where id = v_comanda_id;

  insert into sibex.movement_items (movement_id, product_id, qnty)
    select v_movement_id, (elem->>'product_id')::bigint, (elem->>'qnty')::int
    from jsonb_array_elements(p_items) elem;
  get diagnostics v_inserted = row_count;
  if v_inserted <> v_expected then
    raise exception 'create_comanda_rapida: % de % líneas no coincidieron con products', (v_expected - v_inserted), v_expected;
  end if;

  -- El pull incremental del cliente filtra por products.updated_at (no por
  -- inventory) — sin esto, ningún cliente vería el stock nuevo hasta que
  -- algo más, ajeno a este egreso, tocara esa misma fila de products.
  update sibex.products up set updated_at = now()
   where up.id in (select (elem->>'product_id')::bigint from jsonb_array_elements(p_items) elem);

  return query select v_comanda_id, v_movement_id;
end;
$$;
grant execute on function sibex.create_comanda_rapida(bigint, jsonb, text, text) to authenticated;

-- Fusiona un insumo duplicado en otro ya existente (reatribuye TODO el
-- historial de movement_items al destino, vacía y borra lógicamente el
-- origen) — usado por "Renombrar" en Conteo cuando el nuevo nombre coincide
-- con un insumo ya existente.
create or replace function sibex.merge_product(
  p_source_client_id text, p_target_client_id text
) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_source bigint; v_target bigint; v_source_cat bigint; v_target_cat bigint;
begin
  if sibex.current_role() not in ('admin', 'coordinador') then
    raise exception 'Rol sin permiso para fusionar insumos';
  end if;

  select id, category_id into v_source, v_source_cat from sibex.products where client_id = p_source_client_id;
  select id, category_id into v_target, v_target_cat from sibex.products where client_id = p_target_client_id;
  if v_source is null then raise exception 'Insumo de origen % no existe', p_source_client_id; end if;
  if v_target is null then raise exception 'Insumo de destino % no existe', p_target_client_id; end if;
  if not sibex.can_access_category(v_source_cat) or not sibex.can_access_category(v_target_cat) then
    raise exception 'No tienes permiso para fusionar insumos de esta categoría';
  end if;
  if v_source = v_target then return; end if;

  update sibex.movement_items set product_id = v_target where product_id = v_source;
  update sibex.inventory set qnty = 0 where product_id = v_source;
  update sibex.products set deleted_at = now(), updated_at = now() where id = v_source;
end;
$$;
grant execute on function sibex.merge_product(text, text) to authenticated;

-- Vista de búsqueda de "solicitante" para Egreso Rápido (persons + un campo
-- de texto de la cédula para buscar por substring). Sin RLS propia — hereda
-- la de `persons` (security_invoker, comportamiento estándar de una vista).
create view sibex.persons_solicitantes with (security_invoker = true) as
  select ci, name, surname, ci::text as ci_text from sibex.persons;

-- Ubicaciones genéricas activas (destinos "herramienta" reutilizables, ej.
-- la marcada es_default_egreso) — usada solo para mostrar el subtítulo
-- "Entregando desde: X" en la UI, el destino real lo resuelve
-- create_comanda_rapida del lado del servidor.
create view sibex.ubicaciones_genericas_selectable with (security_invoker = true) as
  select id, nombre, es_generica, es_default_egreso
  from sibex.ubicaciones
  where es_generica and deleted_at is null;


-- ══════════════════════════════════════════════════════════════════════════
--  10. DESPACHOS — vigente solo si/cuando GBSInventario tenga su propio
--      flujo de comandas poblando `comandas`/`comanda_items` (sección 3).
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.list_despachos_pendientes() returns table(
  item_id        bigint,
  comanda_id     integer,
  producto       text,
  cantidad       numeric,
  unidad         text,
  category_id    bigint,
  solicitante    text,
  solicitado_en  timestamptz
)
language plpgsql security definer set search_path = sibex as $$
declare v_role text;
begin
  v_role := sibex.current_role();
  if v_role not in ('admin', 'coordinador') then
    raise exception 'Rol sin permiso para ver despachos';
  end if;

  return query
    select
      ci.id::bigint, c.id::integer, ci.producto::text, ci.cantidad::numeric, ci.unidad::text, pr.category_id,
      coalesce(sp.name || ' ' || sp.surname, 'Sin solicitante')::text,
      c.created_at::timestamptz
    from sibex.comanda_items ci
    join sibex.comandas c on c.id = ci.comanda_id
    join sibex.products pr on pr.id = ci.producto_id
    left join sibex.persons sp on sp.ci = c.solicitante_ci
    where ci.despachado = false
      and c.status = 'por_despachar'
      and c.deleted_at is null
      and sibex.can_access_category(pr.category_id)
    order by c.created_at asc;
end;
$$;
grant execute on function sibex.list_despachos_pendientes() to authenticated;

create or replace function sibex.marcar_despacho_entregado(p_item_id bigint) returns void
language plpgsql security definer set search_path = sibex as $$
declare
  v_role text; v_ci bigint; v_actor_nombre text;
  v_categoria bigint; v_comanda_id integer;
  v_comanda_status sibex.comanda_status; v_pendientes integer;
begin
  v_role := sibex.current_role();
  v_ci := sibex.current_person_ci();
  if v_role not in ('admin', 'coordinador') then
    raise exception 'Rol sin permiso para marcar despachos';
  end if;

  select name || ' ' || surname into v_actor_nombre from sibex.persons where ci = v_ci;

  select pr.category_id, ci.comanda_id, c.status
    into v_categoria, v_comanda_id, v_comanda_status
  from sibex.comanda_items ci
  join sibex.products pr on pr.id = ci.producto_id
  join sibex.comandas c on c.id = ci.comanda_id
  where ci.id = p_item_id
  for update of ci;

  if v_comanda_id is null then
    raise exception 'Ítem de comanda no encontrado (o no pertenece a un producto del catálogo).';
  end if;
  if not sibex.can_access_category(v_categoria) then
    raise exception 'No tienes permiso para despachar ítems de esta área.';
  end if;
  if v_comanda_status <> 'por_despachar' then
    raise exception 'Esta comanda ya no está pendiente de despacho.';
  end if;

  update sibex.comanda_items
     set despachado = true, despachado_por_ci = v_ci, despachado_por = v_actor_nombre, despachado_at = now()
   where id = p_item_id and despachado = false;

  select count(*) into v_pendientes
    from sibex.comanda_items
   where comanda_id = v_comanda_id and producto_id is not null and despachado = false;

  if v_pendientes = 0 then
    update sibex.comandas set status = 'despachada' where id = v_comanda_id;
  end if;
end;
$$;
grant execute on function sibex.marcar_despacho_entregado(bigint) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
--  11. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════

alter table sibex.grupos enable row level security;
alter table sibex.categories enable row level security;
alter table sibex.products enable row level security;
alter table sibex.inventory enable row level security;
alter table sibex.movements enable row level security;
alter table sibex.movement_items enable row level security;
alter table sibex.requests enable row level security;
alter table sibex.checkpoints enable row level security;
alter table sibex.comms enable row level security;
alter table sibex.persons enable row level security;
alter table sibex.phones enable row level security;
alter table sibex.person_status enable row level security;
alter table sibex.comandas_viejas enable row level security;
alter table sibex.comandas enable row level security;
alter table sibex.comanda_items enable row level security;
alter table sibex.comanda_imagenes enable row level security;
alter table sibex.product_aliases enable row level security;
alter table sibex.municipios enable row level security;
alter table sibex.parroquias enable row level security;
alter table sibex.rutas_ejes enable row level security;
alter table sibex.ubicaciones enable row level security;
alter table sibex.ubicacion_contactos enable row level security;
alter table sibex.ubicacion_imagenes enable row level security;
alter table sibex.ubicacion_snapshots enable row level security;
alter table sibex.conductores enable row level security;
alter table sibex.conductor_vehiculos enable row level security;
alter table sibex.conductor_dias enable row level security;
alter table sibex.conductor_horarios enable row level security;
alter table sibex.conductor_zonas enable row level security;
alter table sibex.facultades enable row level security;
alter table sibex.carreras enable row level security;
alter table sibex.ucevistas enable row level security;
alter table sibex.afectados enable row level security;

-- 11.1 — Catálogo/inventario/movimientos: lectura filtrada por categoría —
-- un coordinador de una categoría real (no 'general') SOLO ve/toca filas de
-- SU categoría (pedido explícito: "un coordinador... solo debe tener acceso
-- a la información de su categoría"); admin y coordinador de 'general' ven
-- todo. inventory/movements/movement_items NO tienen policy de escritura
-- para anon/authenticated a propósito — todo pasa por las RPCs SECURITY
-- DEFINER de las secciones 9/9b, que corren con privilegios de owner y por
-- lo tanto sí pueden escribir aunque no exista una policy para el rol que
-- las invoca (y esas RPCs ya validan categoría por dentro, ver arriba).
create policy products_select on sibex.products for select
  to authenticated using (sibex.can_access_category(category_id));
-- OJO: sin atajo "is_admin() or ..." acá — can_access_category() ya evalúa
-- correctamente admin/general/coordinador POR DENTRO de su propio grupo
-- (sección 8); un atajo directo en is_admin() dejaría a un admin de grupo
-- crear/editar productos en la categoría de OTRO grupo.
create policy products_insert on sibex.products for insert
  to authenticated with check (sibex.can_access_category(category_id));
create policy products_update on sibex.products for update
  to authenticated
  using (sibex.can_access_category(category_id))
  with check (sibex.can_access_category(category_id));

create policy inventory_select on sibex.inventory for select
  to authenticated using (
    exists (select 1 from sibex.products p where p.id = inventory.product_id and sibex.can_access_category(p.category_id))
  );

-- OJO: a diferencia de antes, NO hay un atajo "is_admin() or general" acá —
-- ese atajo dejaba de lado el grupo (un admin de grupo vería movimientos de
-- CUALQUIER grupo). can_access_category() ya cubre admin/general/coordinador
-- por dentro (ver sección 8), así que el exists() alcanza para los tres
-- casos — todo movimiento tiene ≥1 línea garantizado por movement_has_items.
create policy movements_select on sibex.movements for select
  to authenticated using (
    exists (
      select 1 from sibex.movement_items mi join sibex.products p on p.id = mi.product_id
      where mi.movement_id = movements.id and sibex.can_access_category(p.category_id)
    )
  );

create policy movement_items_select on sibex.movement_items for select
  to authenticated using (
    exists (select 1 from sibex.products p where p.id = movement_items.product_id and sibex.can_access_category(p.category_id))
  );

create policy requests_select on sibex.requests for select
  to authenticated using (
    exists (select 1 from sibex.products p where p.id = requests.product_id and sibex.can_access_category(p.category_id))
  );

-- comandas/comanda_items (Egreso Rápido, sección 9b) — mismo criterio:
-- visibles si al menos un ítem cae en la categoría del coordinador. Sin
-- policy de escritura: create_comanda_rapida/marcar_despacho_entregado son
-- SECURITY DEFINER y validan categoría por dentro.
-- Mismo ajuste que movements_select: sin atajo "is_admin() or general" (se
-- iba de lado del grupo), can_access_category() ya cubre los tres casos.
create policy comandas_select on sibex.comandas for select
  to authenticated using (
    exists (
      select 1 from sibex.comanda_items ci join sibex.products p on p.id = ci.producto_id
      where ci.comanda_id = comandas.id and sibex.can_access_category(p.category_id)
    )
  );
create policy comanda_items_select on sibex.comanda_items for select
  to authenticated using (
    exists (select 1 from sibex.products p where p.id = comanda_items.producto_id and sibex.can_access_category(p.category_id))
  );

-- grupos: cualquier sesión lee (hace falta para poblar el switcher de grupo
-- y los selects de "crear usuario" — nombres de grupo no son información
-- sensible); solo super_admin escribe.
create policy grupos_select on sibex.grupos for select
  to authenticated using (true);
create policy grupos_super_admin_write on sibex.grupos for all
  to authenticated using (sibex.is_super_admin()) with check (sibex.is_super_admin());

-- categories: lectura/escritura acotada al grupo dueño de la categoría
-- (super_admin: todos) — en la práctica se escribe vía las RPC de 8b, pero
-- se deja la policy por si algo escribe REST.
create policy categories_select on sibex.categories for select
  to authenticated using (sibex.can_access_grupo(grupo_id));
create policy categories_admin_write on sibex.categories for all
  to authenticated
  using (sibex.is_admin() and sibex.can_access_grupo(grupo_id))
  with check (sibex.is_admin() and sibex.can_access_grupo(grupo_id));

-- 11.2 — checkpoints: solo admin (mismo criterio que ya tenía la app,
-- "Máquina del Tiempo" restringida a admin desde 2026-07-27). No sincroniza
-- a Supabase desde el cliente (ver documentation/08-...), así que queda sin
-- grupo_id propio — no hace falta acotarla por grupo.
create policy checkpoints_all on sibex.checkpoints for all
  to authenticated using (sibex.is_admin()) with check (sibex.is_admin());

-- 11.3 — comms: separados por grupo (decisión explícita, ya no "sistema
-- único" como antes de que existieran los grupos de extensión).
create policy comms_select on sibex.comms for select
  to authenticated using (sibex.can_access_grupo(grupo_id));
create policy comms_insert on sibex.comms for insert
  to authenticated with check (sibex.can_access_grupo(grupo_id));
create policy comms_update on sibex.comms for update
  to authenticated using (sibex.can_access_grupo(grupo_id)) with check (sibex.can_access_grupo(grupo_id));

-- 11.4 — persons/phones: directorio separado por grupo (decisión explícita
-- — evita que un coordinador de un grupo vea nombres/teléfonos de otro);
-- escribir directo queda reservado a admin del mismo grupo (coordinador usa
-- create_person/update_own_profile, SECURITY DEFINER, que sí validan
-- alcance por dentro).
create policy persons_select on sibex.persons for select
  to authenticated using (sibex.can_access_grupo(grupo_id));
create policy persons_admin_write on sibex.persons for all
  to authenticated
  using (sibex.is_admin() and sibex.can_access_grupo(grupo_id))
  with check (sibex.is_admin() and sibex.can_access_grupo(grupo_id));

create policy phones_select on sibex.phones for select
  to authenticated using (
    sibex.is_super_admin()
    or exists (select 1 from sibex.persons p where p.phone_id = phones.id and p.grupo_id = sibex.current_grupo_id())
  );
create policy phones_insert on sibex.phones for insert
  to authenticated with check (sibex.current_role() in ('admin', 'coordinador', 'super_admin'));

create policy person_status_select on sibex.person_status for select
  to authenticated using (true);
create policy person_status_write on sibex.person_status for all
  to authenticated using (sibex.current_role() in ('admin', 'coordinador'))
  with check (sibex.current_role() in ('admin', 'coordinador'));

-- 11.5 — dominio ubicaciones/conductores/facultades (+ comandas_viejas,
-- comanda_imagenes, product_aliases: satélites de comandas/products sin
-- lógica de categoría propia): inerte hasta que GBSInventario extienda su
-- propio flujo más allá de Egreso Rápido — política provisoria simple
-- (lectura para cualquier sesión, escritura solo admin). `comandas`/
-- `comanda_items` ya NO están acá — tienen policy real de categoría arriba
-- (11.1), son tablas activas desde que existe create_comanda_rapida.
do $$
declare t text;
begin
  foreach t in array array[
    'comandas_viejas', 'comanda_imagenes',
    'product_aliases', 'municipios', 'parroquias', 'rutas_ejes',
    'ubicaciones', 'ubicacion_contactos', 'ubicacion_imagenes', 'ubicacion_snapshots',
    'conductores', 'conductor_vehiculos', 'conductor_dias', 'conductor_horarios', 'conductor_zonas',
    'facultades', 'carreras', 'ucevistas', 'afectados'
  ]
  loop
    execute format('create policy %I_select on sibex.%I for select to authenticated using (true)', t, t);
    execute format('create policy %I_admin_write on sibex.%I for all to authenticated using (sibex.is_admin()) with check (sibex.is_admin())', t, t);
  end loop;
end $$;


-- ══════════════════════════════════════════════════════════════════════════
--  12. GRANTS de tabla — RLS filtra filas, pero sin el GRANT base ni
--      `authenticated` puede ejecutar el statement. `anon` no recibe nada:
--      GBSInventario ya no tiene una vista "sin sesión" (ver auth.js#
--      hasPlatformAccess() del sistema viejo, que exigía login para TODO).
-- ══════════════════════════════════════════════════════════════════════════

grant usage on schema sibex to authenticated;
grant select on all tables in schema sibex to authenticated;
grant insert, update on
  sibex.products, sibex.persons, sibex.phones, sibex.person_status,
  sibex.comms, sibex.checkpoints, sibex.categories, sibex.grupos
to authenticated;
-- Solo checkpoints/categories tienen policy de DELETE (admin-only) — comms
-- nunca la tuvo ni en el esquema viejo (sin flujo de "borrar comunicado" en
-- la app), así que no se otorga acá (otorgarlo sin policy sería ruido: RLS
-- lo bloquearía igual).
grant delete on sibex.checkpoints, sibex.categories to authenticated;
-- comandas/comanda_items NO reciben INSERT/UPDATE/DELETE directo — todo
-- pasa por create_comanda_rapida/marcar_despacho_entregado (SECURITY
-- DEFINER, sección 9b/10), igual criterio que inventory/movements/movement_items.
grant insert, update, delete on
  sibex.comandas_viejas, sibex.comanda_imagenes,
  sibex.product_aliases, sibex.municipios, sibex.parroquias, sibex.rutas_ejes,
  sibex.ubicaciones, sibex.ubicacion_contactos, sibex.ubicacion_imagenes, sibex.ubicacion_snapshots,
  sibex.conductores, sibex.conductor_vehiculos, sibex.conductor_dias, sibex.conductor_horarios,
  sibex.conductor_zonas, sibex.facultades, sibex.carreras, sibex.ucevistas, sibex.afectados
to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
--  13. REALTIME — sin esto el WebSocket conecta y reporta "SUBSCRIBED" pero
--      nunca recibe nada (Postgres no publica los cambios de estas tablas),
--      y sync.js#listenRealtime entra en un loop de reintentos que satura la
--      consola. inventory/products son las únicas que la app escucha en
--      vivo (ver sync.js) — el resto sigue por el timer de 30s de siempre.
-- ══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sibex.inventory;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sibex.products;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Para que los eventos de UPDATE viajen con la fila completa (con la
-- identidad por defecto solo llega la PK).
ALTER TABLE sibex.inventory REPLICA IDENTITY FULL;
ALTER TABLE sibex.products  REPLICA IDENTITY FULL;
