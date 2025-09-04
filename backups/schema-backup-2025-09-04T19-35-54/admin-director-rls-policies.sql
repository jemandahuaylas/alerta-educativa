-- POLÍTICAS RLS PARA ROLES ADMINISTRATIVOS
-- Admin, Director, Subdirector, Coordinadores
-- Implementa restricciones específicas según los requisitos del sistema

-- =====================================================
-- FUNCIONES DE UTILIDAD PARA ROLES ADMINISTRATIVOS
-- =====================================================

-- Función para verificar si un usuario es Admin (control total)
CREATE OR REPLACE FUNCTION is_admin_only()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'Admin'
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es Director/Subdirector/Coordinador
CREATE OR REPLACE FUNCTION is_management_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Director', 'Subdirector', 'Coordinador')
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede aprobar incidencias/permisos
CREATE OR REPLACE FUNCTION can_approve_requests()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Director', 'Subdirector', 'Coordinador', 'Auxiliar')
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ACTUALIZAR POLÍTICAS EXISTENTES PARA ESTUDIANTES
-- =====================================================

-- Eliminar políticas existentes de estudiantes para recrearlas
DROP POLICY IF EXISTS "Users can view assigned students" ON students;
DROP POLICY IF EXISTS "Only admins can create students" ON students;
DROP POLICY IF EXISTS "Users can update assigned students" ON students;
DROP POLICY IF EXISTS "Only admins can delete students" ON students;

-- RESTRICCIÓN: Director/Subdirector/Coordinadores NO pueden matricular, editar o borrar estudiantes
-- Solo Admin puede gestionar estudiantes completamente

-- Lectura: Todos los roles administrativos pueden ver estudiantes
CREATE POLICY "Admin and management can view all students" ON students
  FOR SELECT USING (
    is_admin_only() OR 
    is_management_role() OR
    -- Docentes/Auxiliares pueden ver estudiantes de sus secciones
    EXISTS(
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.user_id = auth.uid()
        AND ta.section_id = students.section_id
        AND ta.deleted_at IS NULL
    )
  );

-- Creación: SOLO Admin puede crear estudiantes
CREATE POLICY "Only admin can create students" ON students
  FOR INSERT WITH CHECK (is_admin_only());

-- Actualización: SOLO Admin puede actualizar estudiantes
CREATE POLICY "Only admin can update students" ON students
  FOR UPDATE USING (is_admin_only())
  WITH CHECK (is_admin_only());

-- Eliminación: SOLO Admin puede eliminar estudiantes
CREATE POLICY "Only admin can delete students" ON students
  FOR DELETE USING (is_admin_only());

-- =====================================================
-- ACTUALIZAR POLÍTICAS PARA GRADOS Y SECCIONES
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow admin write access to grades" ON grades;
DROP POLICY IF EXISTS "Allow admin write access to sections" ON sections;

-- RESTRICCIÓN: Director/Subdirector/Coordinadores NO pueden crear, editar ni eliminar grados y secciones
-- Solo Admin puede gestionar grados y secciones

CREATE POLICY "Only admin can manage grades" ON grades
  FOR ALL USING (is_admin_only())
  WITH CHECK (is_admin_only());

CREATE POLICY "Only admin can manage sections" ON sections
  FOR ALL USING (is_admin_only())
  WITH CHECK (is_admin_only());

-- =====================================================
-- POLÍTICAS PARA PERFILES DE USUARIO
-- =====================================================

-- Eliminar políticas existentes de perfiles si existen
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Only admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;

-- Lectura: Usuarios pueden ver su propio perfil, Admin puede ver todos
CREATE POLICY "Users can view own profile or admin can view all" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR is_admin_only()
  );

-- Creación: Solo Admin puede crear perfiles
CREATE POLICY "Only admin can create profiles" ON profiles
  FOR INSERT WITH CHECK (is_admin_only());

-- Actualización: Usuarios pueden actualizar su propio perfil, Admin puede actualizar todos
-- Director/Subdirector/Coordinadores pueden editar sección permisos, incidentes, diagnóstico, deserción
CREATE POLICY "Users can update own profile or admin can update all" ON profiles
  FOR UPDATE USING (
    id = auth.uid() OR is_admin_only()
  )
  WITH CHECK (
    id = auth.uid() OR is_admin_only()
  );

-- Eliminación: Solo Admin puede eliminar perfiles
CREATE POLICY "Only admin can delete profiles" ON profiles
  FOR DELETE USING (is_admin_only());

-- =====================================================
-- POLÍTICAS PARA INCIDENCIAS (SISTEMA DE APROBACIÓN)
-- =====================================================

-- Eliminar políticas existentes de incidencias
DROP POLICY IF EXISTS "Users can view assigned student incidents" ON incidents;
DROP POLICY IF EXISTS "Users can create incidents for assigned students" ON incidents;
DROP POLICY IF EXISTS "Users can update own or assigned student incidents" ON incidents;
DROP POLICY IF EXISTS "Only admins can delete incidents" ON incidents;

-- Lectura: Todos los roles pueden ver incidencias según su acceso
CREATE POLICY "Users can view incidents based on role" ON incidents
  FOR SELECT USING (
    is_admin_only() OR 
    is_management_role() OR
    user_can_access_student(student_id)
  );

-- Creación: Docentes registran, otros roles pueden crear también
CREATE POLICY "Users can create incidents for accessible students" ON incidents
  FOR INSERT WITH CHECK (
    is_admin_only() OR 
    is_management_role() OR
    user_can_access_student(student_id)
  );

-- Actualización: Director/Subdirector/Coordinadores pueden aprobar/rechazar
-- Docentes pueden actualizar las que registraron
CREATE POLICY "Users can update incidents based on role" ON incidents
  FOR UPDATE USING (
    is_admin_only() OR
    -- Roles de gestión pueden aprobar/rechazar (cambiar status)
    is_management_role() OR
    -- Docentes/Auxiliares pueden actualizar las que registraron
    created_by = auth.uid() OR
    user_can_access_student(student_id)
  )
  WITH CHECK (
    is_admin_only() OR
    is_management_role() OR
    created_by = auth.uid() OR
    user_can_access_student(student_id)
  );

-- Eliminación: Solo Admin puede eliminar incidencias
CREATE POLICY "Only admin can delete incidents" ON incidents
  FOR DELETE USING (is_admin_only());

-- =====================================================
-- POLÍTICAS PARA PERMISOS (SISTEMA DE APROBACIÓN)
-- =====================================================

-- Eliminar políticas existentes de permisos
DROP POLICY IF EXISTS "Users can view assigned student permissions" ON permissions;
DROP POLICY IF EXISTS "Users can create permissions for assigned students" ON permissions;
DROP POLICY IF EXISTS "Users can update own or assigned student permissions" ON permissions;
DROP POLICY IF EXISTS "Only admins can delete permissions" ON permissions;

-- Lectura: Todos los roles pueden ver permisos según su acceso
CREATE POLICY "Users can view permissions based on role" ON permissions
  FOR SELECT USING (
    is_admin_only() OR 
    is_management_role() OR
    user_can_access_student(student_id)
  );

-- Creación: Docentes registran permisos
CREATE POLICY "Users can create permissions for accessible students" ON permissions
  FOR INSERT WITH CHECK (
    is_admin_only() OR 
    is_management_role() OR
    user_can_access_student(student_id)
  );

-- Actualización: Director/Subdirector/Coordinadores/Auxiliares pueden aprobar
-- Docentes pueden actualizar las que solicitaron
CREATE POLICY "Users can update permissions based on role" ON permissions
  FOR UPDATE USING (
    is_admin_only() OR
    -- Roles que pueden aprobar permisos
    can_approve_requests() OR
    -- Docentes pueden actualizar las que aprobaron
    approved_by = auth.uid() OR
    user_can_access_student(student_id)
  )
  WITH CHECK (
    is_admin_only() OR
    can_approve_requests() OR
    approved_by = auth.uid() OR
    user_can_access_student(student_id)
  );

-- Eliminación: Solo Admin puede eliminar permisos
CREATE POLICY "Only admin can delete permissions" ON permissions
  FOR DELETE USING (is_admin_only());

-- =====================================================
-- POLÍTICAS PARA NEE (NECESIDADES EDUCATIVAS ESPECIALES)
-- =====================================================

-- Eliminar políticas existentes de NEE
DROP POLICY IF EXISTS "Users can view assigned student nees" ON nees;
DROP POLICY IF EXISTS "Coordinators can manage nees" ON nees;

-- Lectura: Todos los roles pueden ver NEE según su acceso
CREATE POLICY "Users can view nees based on role" ON nees
  FOR SELECT USING (
    is_admin_only() OR 
    is_management_role() OR
    user_can_access_student(student_id)
  );

-- Gestión: Admin y roles de gestión pueden gestionar NEE
CREATE POLICY "Management roles can manage nees" ON nees
  FOR ALL USING (
    is_admin_only() OR is_management_role()
  )
  WITH CHECK (
    is_admin_only() OR is_management_role()
  );

-- =====================================================
-- POLÍTICAS PARA FACTORES DE RIESGO
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view assigned student risk_factors" ON risk_factors;
DROP POLICY IF EXISTS "Users can manage risk_factors for assigned students" ON risk_factors;

-- Lectura: Todos los roles pueden ver factores de riesgo según su acceso
CREATE POLICY "Users can view risk_factors based on role" ON risk_factors
  FOR SELECT USING (
    is_admin_only() OR 
    is_management_role() OR
    user_can_access_student(student_id)
  );

-- Gestión: Admin y roles de gestión pueden gestionar factores de riesgo
CREATE POLICY "Management roles can manage risk_factors" ON risk_factors
  FOR ALL USING (
    is_admin_only() OR 
    is_management_role() OR
    user_can_access_student(student_id)
  )
  WITH CHECK (
    is_admin_only() OR 
    is_management_role() OR
    user_can_access_student(student_id)
  );

-- =====================================================
-- POLÍTICAS PARA DESERCIÓN ESCOLAR
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view assigned student dropouts" ON dropouts;
DROP POLICY IF EXISTS "Users can manage dropouts for assigned students" ON dropouts;

-- Lectura: Todos los roles pueden ver deserción según su acceso
CREATE POLICY "Users can view dropouts based on role" ON dropouts
  FOR SELECT USING (
    is_admin_only() OR 
    is_management_role() OR
    user_can_access_student(student_id)
  );

-- Gestión: Admin y roles de gestión pueden gestionar deserción
CREATE POLICY "Management roles can manage dropouts" ON dropouts
  FOR ALL USING (
    is_admin_only() OR 
    is_management_role() OR
    user_can_access_student(student_id)
  )
  WITH CHECK (
    is_admin_only() OR 
    is_management_role() OR
    user_can_access_student(student_id)
  );

-- =====================================================
-- POLÍTICAS PARA ASIGNACIONES DE DOCENTES
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Only admins can manage assignments" ON teacher_assignments;

-- Lectura: Usuarios pueden ver sus asignaciones, Admin y gestión pueden ver todas
CREATE POLICY "Users can view assignments based on role" ON teacher_assignments
  FOR SELECT USING (
    user_id = auth.uid() OR 
    is_admin_only() OR 
    is_management_role()
  );

-- Gestión: Solo Admin puede gestionar asignaciones
CREATE POLICY "Only admin can manage teacher assignments" ON teacher_assignments
  FOR ALL USING (is_admin_only())
  WITH CHECK (is_admin_only());

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION is_admin_only() IS 'Verifica si el usuario actual es Admin (control total del sistema)';
COMMENT ON FUNCTION is_management_role() IS 'Verifica si el usuario actual es Director, Subdirector o Coordinador';
COMMENT ON FUNCTION can_approve_requests() IS 'Verifica si el usuario puede aprobar incidencias y permisos';

-- =====================================================
-- RESUMEN DE RESTRICCIONES IMPLEMENTADAS
-- =====================================================

/*
RESTRICCIONES IMPLEMENTADAS:

1. ADMIN:
   - Control total del sistema sin restricciones
   - Único rol que puede gestionar estudiantes, grados, secciones y perfiles

2. DIRECTOR, SUBDIRECTOR, COORDINADORES:
   - NO pueden matricular, editar o borrar estudiantes
   - NO pueden crear, editar ni eliminar grados y secciones
   - Pueden ver todos los estudiantes, incidencias, permisos, NEE, factores de riesgo y deserción
   - Pueden editar permisos, incidentes, diagnóstico (NEE), deserción en página de perfil
   - Pueden aprobar o rechazar incidencias registradas por docentes/auxiliares
   - Pueden aprobar permisos junto con auxiliares

3. SISTEMA DE APROBACIÓN:
   - Docentes registran incidencias y permisos
   - Director/Subdirector/Coordinadores/Auxiliares pueden aprobar permisos
   - Director/Subdirector/Coordinadores pueden aprobar/rechazar incidencias

4. ACCESO A DATOS:
   - Roles administrativos tienen acceso completo de lectura
   - Restricciones específicas en escritura según el tipo de dato
   - Mantenimiento de la seguridad basada en roles
*/