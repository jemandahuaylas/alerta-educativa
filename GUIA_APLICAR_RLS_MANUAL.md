# 🔒 Guía para Aplicar Políticas RLS Manualmente

## ⚠️ PROBLEMA IDENTIFICADO

Las políticas RLS (Row Level Security) no están funcionando correctamente:
- ✅ RLS está habilitado en la tabla `profiles`
- ❌ Las políticas de seguridad no están aplicadas
- ❌ Usuarios anónimos pueden ver todos los perfiles
- ❌ No hay restricciones por roles

## 🎯 SOLUCIÓN: Aplicación Manual

### Paso 1: Acceder al Dashboard de Supabase

1. Ve a: https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto **"Alerta Educativa"**

### Paso 2: Abrir el Editor SQL

1. En el menú lateral, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"** o **"Nueva consulta"**

### Paso 3: Ejecutar el Script de Políticas RLS

1. Copia **TODO** el contenido del archivo `fix-profiles-rls-policies.sql`
2. Pégalo en el editor SQL
3. Haz clic en **"Run"** o **"Ejecutar"**

### Paso 4: Verificar la Ejecución

Después de ejecutar, deberías ver:
- ✅ Mensajes de éxito para cada comando
- ✅ Políticas creadas correctamente
- ✅ Funciones `is_admin_user()` y `can_manage_profiles()` creadas

### Paso 5: Verificar Políticas Aplicadas

Ejecuta esta consulta para verificar:

```sql
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
WHERE tablename = 'profiles';
```

Deberías ver estas políticas:
- `Users can view profiles based on role`
- `Users can insert own profile or admins can insert any`
- `Users can update own profile or admins can update any`
- `Only admins can delete profiles except themselves`

## 🧪 PRUEBAS DESPUÉS DE APLICAR

### Prueba 1: Acceso Anónimo (Debe Fallar)
1. Abre una ventana de incógnito
2. Ve a tu aplicación
3. Intenta acceder sin login
4. **Resultado esperado**: No debe mostrar perfiles

### Prueba 2: Usuario Normal
1. Login con un usuario que NO sea Admin/Director/Subdirector/Coordinador
2. Ve al dashboard
3. **Resultado esperado**: Solo debe ver su propio perfil

### Prueba 3: Usuario Administrativo
1. Login con Admin, Director, Subdirector o Coordinador
2. Ve al dashboard
3. **Resultado esperado**: Debe ver todos los perfiles

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Si las políticas no se aplican:

1. **Verifica que RLS esté habilitado**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'profiles';
   ```
   Debe mostrar `rowsecurity = true`

2. **Verifica las funciones**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname IN ('is_admin_user', 'can_manage_profiles');
   ```
   Debe mostrar ambas funciones

3. **Verifica los roles de usuarios**:
   ```sql
   SELECT id, email, role FROM profiles;
   ```
   Confirma que los roles están correctos

### Si sigues teniendo problemas:

1. **Elimina todas las políticas existentes**:
   ```sql
   DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
   DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
   DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
   DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
   DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
   DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
   ```

2. **Vuelve a ejecutar** el contenido completo de `fix-profiles-rls-policies.sql`

## 📋 CONTENIDO DEL ARCHIVO A EJECUTAR

El archivo `fix-profiles-rls-policies.sql` contiene:

1. **Eliminación de políticas inseguras**
2. **Creación de funciones utilitarias**:
   - `is_admin_user()`: Verifica si el usuario es administrativo
   - `can_manage_profiles()`: Verifica permisos de gestión
3. **Políticas de seguridad**:
   - SELECT: Solo perfil propio o si es admin
   - INSERT: Solo perfil propio o si es admin
   - UPDATE: Solo perfil propio (sin cambiar rol) o si es admin
   - DELETE: Solo admins (no pueden eliminarse a sí mismos)
4. **Política especial para service_role**

## ✅ CONFIRMACIÓN DE ÉXITO

Sabrás que las políticas están funcionando cuando:

- ❌ Usuarios anónimos NO pueden ver perfiles
- ✅ Usuarios normales solo ven su perfil
- ✅ Administradores ven todos los perfiles
- ✅ Los roles se respetan en la interfaz

## 🆘 SOPORTE ADICIONAL

Si necesitas ayuda adicional:
1. Revisa los logs de error en el dashboard de Supabase
2. Verifica la consola del navegador para errores de autenticación
3. Confirma que las variables de entorno están correctas

---

**⚠️ IMPORTANTE**: Este paso es **CRÍTICO** para la seguridad de la aplicación. Sin estas políticas, cualquier usuario puede ver y modificar todos los perfiles.