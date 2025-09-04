-- Fix para políticas RLS de la tabla profiles
-- PROBLEMA IDENTIFICADO: Las políticas actuales permiten que cualquier usuario autenticado
-- pueda ver, editar, insertar y eliminar TODOS los perfiles, sin restricciones de rol.
-- Esto es un grave problema de seguridad.

-- Primero, eliminar las políticas inseguras existentes
DROP POLICY IF EXISTS "Allow authenticated users to view all profiles" ON "profiles";
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON "profiles";
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON "profiles";
DROP POLICY IF EXISTS "Allow authenticated users to delete profiles" ON "profiles";
DROP POLICY IF EXISTS "Allow service role to update all profiles" ON "profiles";

-- Crear función para verificar si el usuario actual es administrador
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Director', 'Subdirector')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para verificar si el usuario puede gestionar perfiles
CREATE OR REPLACE FUNCTION can_manage_profiles()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Director', 'Subdirector', 'Coordinador')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICA SEGURA: Solo usuarios autenticados pueden ver su propio perfil
-- Los administradores pueden ver todos los perfiles
CREATE POLICY "Users can view own profile or admins can view all" ON "profiles"
  FOR SELECT USING (
    auth.uid() = id OR is_admin_user()
  );

-- POLÍTICA SEGURA: Solo administradores pueden insertar nuevos perfiles
CREATE POLICY "Only admins can insert profiles" ON "profiles"
  FOR INSERT WITH CHECK (is_admin_user());

-- POLÍTICA SEGURA: Los usuarios pueden actualizar su propio perfil (excepto el rol)
-- Los administradores pueden actualizar cualquier perfil
CREATE POLICY "Users can update own profile or admins can update any" ON "profiles"
  FOR UPDATE USING (
    auth.uid() = id OR is_admin_user()
  )
  WITH CHECK (
    -- Si es el propio usuario, no puede cambiar su rol
    (auth.uid() = id AND role = (
      SELECT role FROM profiles WHERE id = auth.uid()
    )) OR 
    -- Si es administrador, puede cambiar cualquier cosa
    is_admin_user()
  );

-- POLÍTICA SEGURA: Solo administradores pueden eliminar perfiles
-- Y no pueden eliminarse a sí mismos
CREATE POLICY "Only admins can delete profiles except themselves" ON "profiles"
  FOR DELETE USING (
    is_admin_user() AND auth.uid() != id
  );

-- Política especial para el service_role (para operaciones del sistema)
CREATE POLICY "Service role has full access" ON "profiles"
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comentarios de documentación
COMMENT ON FUNCTION is_admin_user() IS 'Verifica si el usuario actual tiene rol de administrador (Admin, Director, Subdirector)';
COMMENT ON FUNCTION can_manage_profiles() IS 'Verifica si el usuario actual puede gestionar perfiles (Admin, Director, Subdirector, Coordinador)';

-- Verificar que las políticas se aplicaron correctamente
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
WHERE tablename = 'profiles'
ORDER BY policyname;