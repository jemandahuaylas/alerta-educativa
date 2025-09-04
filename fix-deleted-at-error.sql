-- SCRIPT DE CORRECCIÓN PARA ERROR DE COLUMNA deleted_at
-- Este script corrige el problema de la columna deleted_at faltante en teacher_assignments

-- Verificar si la tabla existe
DO $$
BEGIN
    -- Verificar si la tabla teacher_assignments existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_assignments') THEN
        RAISE NOTICE 'Tabla teacher_assignments no existe. Creándola...';
        
        -- Crear la tabla teacher_assignments con todas las columnas necesarias
        CREATE TABLE "teacher_assignments" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "user_id" uuid NOT NULL REFERENCES "profiles"(id) ON DELETE CASCADE,
          "grade_id" uuid NOT NULL REFERENCES "grades"(id) ON DELETE CASCADE,
          "section_id" uuid NOT NULL REFERENCES "sections"(id) ON DELETE CASCADE,
          "assignment_type" text NOT NULL CHECK (assignment_type IN ('primary', 'auxiliary')) DEFAULT 'primary',
          "created_at" timestamp with time zone NOT NULL DEFAULT now(),
          "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
          "deleted_at" timestamp with time zone,
          UNIQUE(user_id, section_id)
        );
        
        RAISE NOTICE 'Tabla teacher_assignments creada exitosamente.';
    ELSE
        RAISE NOTICE 'Tabla teacher_assignments ya existe.';
    END IF;
END
$$;

-- Verificar si la columna deleted_at existe en teacher_assignments
DO $$
BEGIN
    -- Verificar si la columna deleted_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_assignments' 
        AND column_name = 'deleted_at'
    ) THEN
        RAISE NOTICE 'Columna deleted_at no existe en teacher_assignments. Agregándola...';
        
        -- Agregar la columna deleted_at
        ALTER TABLE teacher_assignments ADD COLUMN deleted_at timestamp with time zone;
        
        RAISE NOTICE 'Columna deleted_at agregada exitosamente.';
    ELSE
        RAISE NOTICE 'Columna deleted_at ya existe en teacher_assignments.';
    END IF;
END
$$;

-- Verificar si la columna updated_at existe en teacher_assignments
DO $$
BEGIN
    -- Verificar si la columna updated_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_assignments' 
        AND column_name = 'updated_at'
    ) THEN
        RAISE NOTICE 'Columna updated_at no existe en teacher_assignments. Agregándola...';
        
        -- Agregar la columna updated_at
        ALTER TABLE teacher_assignments ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();
        
        RAISE NOTICE 'Columna updated_at agregada exitosamente.';
    ELSE
        RAISE NOTICE 'Columna updated_at ya existe en teacher_assignments.';
    END IF;
END
$$;

-- Crear función update_updated_at_column si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar índices existentes si existen
DROP INDEX IF EXISTS idx_teacher_assignments_user_id;
DROP INDEX IF EXISTS idx_teacher_assignments_section_id;
DROP INDEX IF EXISTS idx_teacher_assignments_grade_id;

-- Crear índices con verificación de columna deleted_at
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_user_id ON teacher_assignments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_section_id ON teacher_assignments(section_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_grade_id ON teacher_assignments(grade_id) WHERE deleted_at IS NULL;

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_teacher_assignments_updated_at ON teacher_assignments;
CREATE TRIGGER update_teacher_assignments_updated_at
    BEFORE UPDATE ON teacher_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar estructura final de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_assignments'
ORDER BY ordinal_position;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Script de corrección completado. La tabla teacher_assignments ahora tiene todas las columnas necesarias.';
END
$$;