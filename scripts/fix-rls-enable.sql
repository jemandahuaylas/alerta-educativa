-- Habilitar Row Level Security en la tabla profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verificar que RLS esté habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;

-- Crear funciones de utilidad si no existen
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Director', 'Subdirector', 'Coordinador')
  ) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_manage_profiles()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Director')
  ) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para la tabla profiles

-- 1. Política de SELECT: Los usuarios pueden ver su propio perfil, los admins pueden ver todos
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    is_admin_user()
  );

-- 2. Política de INSERT: Solo admins y directores pueden crear perfiles
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (
    can_manage_profiles()
  );

-- 3. Política de UPDATE: Los usuarios pueden actualizar su propio perfil, los admins pueden actualizar todos
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (
    auth.uid() = id OR 
    can_manage_profiles()
  )
  WITH CHECK (
    auth.uid() = id OR 
    can_manage_profiles()
  );

-- 4. Política de DELETE: Solo admins y directores pueden eliminar perfiles (excepto el propio)
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (
    can_manage_profiles() AND auth.uid() != id
  );

-- 5. Política especial para service_role (operaciones del sistema)
CREATE POLICY "service_role_policy" ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verificar políticas creadas
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

-- Mensaje de confirmación
SELECT 'RLS habilitado y políticas aplicadas correctamente en la tabla profiles' as status;