-- =====================================================
-- ASIGNACIONES INICIALES DE DOCENTES Y AUXILIARES
-- =====================================================
-- Este script debe ejecutarse DESPUÉS de:
-- 1. complete-database-schema.sql
-- 2. teacher-auxiliary-rls-policies.sql
-- 3. fix-profiles-rls-policies.sql

-- PASO 1: Verificar usuarios disponibles
SELECT 
    au.id as user_uuid,
    p.name,
    p.email,
    p.role
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE p.role IN ('Docente', 'Auxiliar')
ORDER BY p.role, p.name;

-- PASO 2: Verificar grados disponibles
SELECT id as grade_uuid, name FROM grades ORDER BY name;

-- PASO 3: Verificar secciones disponibles
SELECT id as section_uuid, name, grade_id FROM sections ORDER BY name;

-- PASO 4: Insertar asignaciones automáticamente
-- Esta consulta asigna automáticamente docentes y auxiliares a secciones
INSERT INTO teacher_assignments (user_id, grade_id, section_id, assignment_type)
SELECT 
    p.id as user_id,
    s.grade_id,
    s.id as section_id,
    CASE 
        WHEN p.role = 'Docente' THEN 'primary'
        WHEN p.role = 'Auxiliar' THEN 'auxiliary'
        ELSE 'primary'
    END as assignment_type
FROM profiles p
CROSS JOIN (
    SELECT DISTINCT s.id, s.grade_id, s.name,
           ROW_NUMBER() OVER (ORDER BY s.grade_id, s.name) as rn
    FROM sections s
    WHERE s.deleted_at IS NULL
) s
WHERE p.role IN ('Docente', 'Auxiliar')
    AND p.deleted_at IS NULL
    AND (
        -- Asignar cada docente/auxiliar a máximo 2 secciones
        (ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY s.rn)) <= 2
    )
ON CONFLICT (user_id, grade_id, section_id) DO NOTHING;

-- PASO 5: Verificar las asignaciones creadas
SELECT 
    ta.id,
    p.name as teacher_name,
    p.role,
    g.name as grade_name,
    s.name as section_name,
    ta.assignment_type,
    ta.created_at
FROM teacher_assignments ta
JOIN profiles p ON ta.user_id = p.id
JOIN grades g ON ta.grade_id = g.id
JOIN sections s ON ta.section_id = s.id
WHERE ta.deleted_at IS NULL
ORDER BY p.name, g.name, s.name;

-- PASO 6: Verificar que las políticas RLS funcionan correctamente
-- (Ejecutar como usuario docente/auxiliar para probar)
SELECT 
    'teacher_assignments' as table_name,
    COUNT(*) as accessible_records
FROM teacher_assignments
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as accessible_records
FROM students
UNION ALL
SELECT 
    'incidents' as table_name,
    COUNT(*) as accessible_records
FROM incidents;

-- PASO 7: Crear algunas asignaciones específicas de ejemplo (opcional)
-- Descomenta y modifica según tus necesidades:
/*
-- Ejemplo: Asignar un docente específico a una sección específica
INSERT INTO teacher_assignments (user_id, grade_id, section_id, assignment_type)
SELECT 
    p.id,
    g.id,
    s.id,
    'primary'
FROM profiles p, grades g, sections s
WHERE p.email = 'docente@ejemplo.com'
    AND g.name = '1°'
    AND s.name = 'A'
    AND s.grade_id = g.id
ON CONFLICT (user_id, grade_id, section_id) DO NOTHING;
*/