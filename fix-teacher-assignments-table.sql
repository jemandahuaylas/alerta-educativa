-- Script para corregir la tabla teacher_assignments y sus índices
-- Ejecutar este script si hay errores con la columna deleted_at

-- Primero, verificar si la tabla existe y tiene la estructura correcta
DO $$
BEGIN
    -- Verificar si la columna deleted_at existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'teacher_assignments' 
        AND column_name = 'deleted_at'
    ) THEN
        -- Agregar la columna deleted_at si no existe
        ALTER TABLE teacher_assignments 
        ADD COLUMN deleted_at timestamp with time zone;
        
        RAISE NOTICE 'Columna deleted_at agregada a teacher_assignments';
    ELSE
        RAISE NOTICE 'La columna deleted_at ya existe en teacher_assignments';
    END IF;
END
$$;

-- Crear o recrear los índices para teacher_assignments
DROP INDEX IF EXISTS idx_teacher_assignments_user_id;
DROP INDEX IF EXISTS idx_teacher_assignments_section_id;
DROP INDEX IF EXISTS idx_teacher_assignments_grade_id;

-- Recrear los índices
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_user_id 
ON teacher_assignments(user_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_section_id 
ON teacher_assignments(section_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_grade_id 
ON teacher_assignments(grade_id) 
WHERE deleted_at IS NULL;

-- Verificar la estructura final de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_assignments'
ORDER BY ordinal_position;