-- Crear los tipos ENUM para los nuevos campos
CREATE TYPE new_schema_archive.voluntario_status AS ENUM ('Activo', 'Inactivo');
CREATE TYPE new_schema_archive.voluntario_turno AS ENUM ('Mañana', 'Tarde', 'Noche');
CREATE TYPE new_schema_archive.voluntario_depto AS ENUM ('Higiene', 'Hidratación', 'Mascotas', 'Medicinas', 'Alimentos de bebe', 'Cuidado de bebe y pañales', 'Higiene personal', 'Papel higiénico', 'Snacks', 'Harina y pasta', 'Arroz y granos', 'Enlatados', 'Otros');

-- Añadir columnas a la tabla persons existente
ALTER TABLE new_schema_archive.persons
ADD COLUMN status new_schema_archive.voluntario_status NOT NULL DEFAULT 'Activo',
ADD COLUMN turno new_schema_archive.voluntario_turno,
ADD COLUMN departamento new_schema_archive.voluntario_depto;
