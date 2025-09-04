-- POLÍTICAS RLS PARA FUNCIONALIDADES DE DOCENTE Y AUXILIAR
-- Este archivo implementa las políticas de seguridad basadas en secciones asignadas

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nees ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropouts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ELIMINAR POLÍTICAS EXISTENTES INSEGURAS
-- =====================================================

-- Eliminar políticas inseguras de students
DROP POLICY IF EXISTS "Allow public read access to students" ON students;
DROP POLICY IF EXISTS "Allow full access for anon users on students" ON students;

-- Eliminar políticas inseguras de grades y sections
DROP POLICY IF EXISTS "Allow full access for anon users on grades" ON grades;
DROP POLICY IF EXISTS "Allow full access for anon users on sections" ON sections;

-- =====================================================
-- POLÍTICAS PARA GRADOS Y SECCIONES (LECTURA PÚBLICA)
-- =====================================================

-- Todos pueden leer grados y secciones (necesario para la UI)
CREATE POLICY "Allow read access to grades" ON grades
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to sections" ON sections
  FOR SELECT USING (true);

-- Solo administradores pueden modificar grados y secciones
CREATE POLICY "Allow admin write access to grades" ON grades
  FOR ALL USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Allow admin write access to sections" ON sections
  FOR ALL USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- =====================================================
-- POLÍTICAS PARA ASIGNACIONES DE DOCENTES
-- =====================================================

-- Los usuarios pueden ver sus propias asignaciones
CREATE POLICY "Users can view own assignments" ON teacher_assignments
  FOR SELECT USING (user_id = auth.uid());

-- Los administradores pueden ver todas las asignaciones
CREATE POLICY "Admins can view all assignments" ON teacher_assignments
  FOR SELECT USING (is_admin_user());

-- Solo administradores pueden crear, modificar o eliminar asignaciones
CREATE POLICY "Only admins can manage assignments" ON teacher_assignments
  FOR ALL USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- =====================================================
-- POLÍTICAS PARA ESTUDIANTES
-- =====================================================

-- Los usuarios pueden ver estudiantes de sus secciones asignadas
CREATE POLICY "Users can view assigned students" ON students
  FOR SELECT USING (
    -- Administradores pueden ver todos los estudiantes
    is_admin_user() OR
    -- Docentes/Auxiliares pueden ver estudiantes de sus secciones
    EXISTS(
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.user_id = auth.uid()
        AND ta.section_id = students.section_id
        AND ta.deleted_at IS NULL
    )
  );

-- Solo administradores pueden crear estudiantes
CREATE POLICY "Only admins can create students" ON students
  FOR INSERT WITH CHECK (is_admin_user());

-- Los usuarios pueden actualizar estudiantes de sus secciones (datos básicos)
CREATE POLICY "Users can update assigned students" ON students
  FOR UPDATE USING (
    is_admin_user() OR
    EXISTS(
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.user_id = auth.uid()
        AND ta.section_id = students.section_id
        AND ta.deleted_at IS NULL
    )
  )
  WITH CHECK (
    is_admin_user() OR
    EXISTS(
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.user_id = auth.uid()
        AND ta.section_id = students.section_id
        AND ta.deleted_at IS NULL
    )
  );

-- Solo administradores pueden eliminar estudiantes
CREATE POLICY "Only admins can delete students" ON students
  FOR DELETE USING (is_admin_user());

-- =====================================================
-- POLÍTICAS PARA INCIDENCIAS
-- =====================================================

-- Los usuarios pueden ver incidencias de estudiantes de sus secciones
CREATE POLICY "Users can view assigned student incidents" ON incidents
  FOR SELECT USING (
    is_admin_user() OR
    user_can_access_student(student_id)
  );

-- Los usuarios pueden crear incidencias para estudiantes de sus secciones
CREATE POLICY "Users can create incidents for assigned students" ON incidents
  FOR INSERT WITH CHECK (
    is_admin_user() OR
    user_can_access_student(student_id)
  );

-- Los usuarios pueden actualizar incidencias que registraron o de sus estudiantes asignados
CREATE POLICY "Users can update own or assigned student incidents" ON incidents
  FOR UPDATE USING (
    is_admin_user() OR
    created_by = auth.uid() OR
    user_can_access_student(student_id)
  )
  WITH CHECK (
    is_admin_user() OR
    created_by = auth.uid() OR
    user_can_access_student(student_id)
  );

-- Solo administradores pueden eliminar incidencias
CREATE POLICY "Only admins can delete incidents" ON incidents
  FOR DELETE USING (is_admin_user());

-- =====================================================
-- POLÍTICAS PARA PERMISOS
-- =====================================================

-- Los usuarios pueden ver permisos de estudiantes de sus secciones
CREATE POLICY "Users can view assigned student permissions" ON permissions
  FOR SELECT USING (
    is_admin_user() OR
    user_can_access_student(student_id)
  );

-- Los usuarios pueden crear permisos para estudiantes de sus secciones
CREATE POLICY "Users can create permissions for assigned students" ON permissions
  FOR INSERT WITH CHECK (
    is_admin_user() OR
    user_can_access_student(student_id)
  );

-- Los usuarios pueden actualizar permisos que aprobaron o de sus estudiantes asignados
CREATE POLICY "Users can update own or assigned student permissions" ON permissions
  FOR UPDATE USING (
    is_admin_user() OR
    approved_by = auth.uid() OR
    user_can_access_student(student_id)
  )
  WITH CHECK (
    is_admin_user() OR
    approved_by = auth.uid() OR
    user_can_access_student(student_id)
  );

-- Solo administradores pueden eliminar permisos
CREATE POLICY "Only admins can delete permissions" ON permissions
  FOR DELETE USING (is_admin_user());

-- =====================================================
-- POLÍTICAS PARA NEE (NECESIDADES EDUCATIVAS ESPECIALES)
-- =====================================================

-- Los usuarios pueden ver NEE de estudiantes de sus secciones
CREATE POLICY "Users can view assigned student nees" ON nees
  FOR SELECT USING (
    is_admin_user() OR
    user_can_access_student(student_id)
  );

-- Solo administradores y coordinadores pueden crear/modificar NEE
CREATE POLICY "Coordinators can manage nees" ON nees
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('Admin', 'Director', 'Subdirector', 'Coordinador')
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('Admin', 'Director', 'Subdirector', 'Coordinador')
        AND deleted_at IS NULL
    )
  );

-- =====================================================
-- POLÍTICAS PARA FACTORES DE RIESGO
-- =====================================================

-- Los usuarios pueden ver factores de riesgo de estudiantes de sus secciones
CREATE POLICY "Users can view assigned student risks" ON risk_factors
  FOR SELECT USING (
    is_admin_user() OR
    user_can_access_student(student_id)
  );

-- Los usuarios pueden crear factores de riesgo para estudiantes de sus secciones
CREATE POLICY "Users can create risks for assigned students" ON risk_factors
  FOR INSERT WITH CHECK (
    is_admin_user() OR
    user_can_access_student(student_id)
  );

-- Los usuarios pueden actualizar factores de riesgo de sus estudiantes asignados
CREATE POLICY "Users can update assigned student risks" ON risk_factors
  FOR UPDATE USING (
    is_admin_user() OR
    user_can_access_student(student_id)
  )
  WITH CHECK (
    is_admin_user() OR
    user_can_access_student(student_id)
  );

-- Solo administradores pueden eliminar factores de riesgo
CREATE POLICY "Only admins can delete risks" ON risk_factors
  FOR DELETE USING (is_admin_user());

-- =====================================================
-- POLÍTICAS PARA DESERCIÓN ESCOLAR
-- =====================================================

-- Los usuarios pueden ver deserción de estudiantes de sus secciones
CREATE POLICY "Users can view assigned student dropouts" ON dropouts
  FOR SELECT USING (
    is_admin_user() OR
    user_can_access_student(student_id)
  );

-- Solo administradores y coordinadores pueden gestionar deserción
CREATE POLICY "Coordinators can manage dropouts" ON dropouts
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('Admin', 'Director', 'Subdirector', 'Coordinador')
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('Admin', 'Director', 'Subdirector', 'Coordinador')
        AND deleted_at IS NULL
    )
  );

-- =====================================================
-- POLÍTICA ESPECIAL PARA SERVICE_ROLE
-- =====================================================

-- Permitir acceso completo al service_role para todas las tablas
CREATE POLICY "Service role full access" ON students
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON teacher_assignments
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON incidents
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON permissions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON nees
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON risk_factors
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON dropouts
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- VERIFICACIÓN DE POLÍTICAS APLICADAS
-- =====================================================

-- Consulta para verificar todas las políticas RLS aplicadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('students', 'teacher_assignments', 'incidents', 'permissions', 'nees', 'risk_factors', 'dropouts')
ORDER BY tablename, policyname;

-- Comentarios finales
/*
ESTAS POLÍTICAS IMPLEMENTAN:

1. FUNCIONALIDADES PARA DOCENTE Y AUXILIAR:
   ✅ Ver y registrar incidencias de sus secciones asignadas
   ✅ Ver y registrar permisos de sus secciones asignadas  
   ✅ Ver y descargar lista de estudiantes de sus secciones asignadas
   ✅ Ver estudiantes con NEE de sus secciones
   ✅ Acceso restringido basado en asignaciones de sección

2. SEGURIDAD:
   ✅ Solo administradores pueden crear/eliminar estudiantes
   ✅ Solo administradores pueden gestionar asignaciones de docentes
   ✅ Solo coordinadores+ pueden gestionar NEE y deserción
   ✅ Acceso basado en secciones asignadas para Docente/Auxiliar
   ✅ Los usuarios solo pueden ver/editar datos de sus secciones

3. FLEXIBILIDAD:
   ✅ Los administradores mantienen acceso completo
   ✅ El service_role puede realizar operaciones de sistema
   ✅ Las políticas son escalables y mantenibles
*/

-- Mensaje de confirmación
SELECT 'Políticas RLS para Docente y Auxiliar aplicadas correctamente' AS status;