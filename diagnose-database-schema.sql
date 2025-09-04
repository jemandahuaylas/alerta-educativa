-- Script de diagnóstico para problemas de esquema de base de datos
-- Ejecutar este script para identificar problemas con las tablas

-- 1. Verificar qué tablas existen
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Verificar estructura de teacher_assignments si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'teacher_assignments'
    ) THEN
        RAISE NOTICE 'Tabla teacher_assignments existe. Verificando columnas:';
        
        -- Mostrar todas las columnas
        PERFORM column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'teacher_assignments'
        ORDER BY ordinal_position;
    ELSE
        RAISE NOTICE 'Tabla teacher_assignments NO existe';
    END IF;
END
$$;

-- 3. Verificar si la columna deleted_at existe en teacher_assignments
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'teacher_assignments' 
            AND column_name = 'deleted_at'
        ) THEN 'La columna deleted_at EXISTE en teacher_assignments'
        ELSE 'La columna deleted_at NO EXISTE en teacher_assignments'
    END as resultado;

-- 4. Verificar índices existentes en teacher_assignments
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'teacher_assignments'
ORDER BY indexname;

-- 5. Mostrar estructura completa de teacher_assignments
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_assignments'
ORDER BY ordinal_position;

-- 6. Verificar dependencias de foreign keys
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'teacher_assignments';