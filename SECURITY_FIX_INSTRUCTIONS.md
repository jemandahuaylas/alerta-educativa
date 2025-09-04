# 🚨 CORRECCIÓN CRÍTICA DE SEGURIDAD - PRIVILEGIOS DE PERFILES

## ⚠️ PROBLEMA IDENTIFICADO

**GRAVEDAD: CRÍTICA** - Se ha identificado una falla grave de seguridad en el manejo de privilegios de los perfiles de usuario.

### Descripción del Problema

Las políticas de Row Level Security (RLS) actuales en la tabla `profiles` permiten que **cualquier usuario autenticado** pueda:
- ✅ Ver todos los perfiles de usuarios
- ✅ Editar cualquier perfil (incluyendo cambiar roles)
- ✅ Eliminar cualquier perfil
- ✅ Crear nuevos perfiles

Esto significa que un usuario con rol "Docente" o "Auxiliar" puede:
- Cambiar su propio rol a "Admin"
- Eliminar perfiles de administradores
- Ver información confidencial de todos los usuarios
- Crear usuarios con privilegios administrativos

## 🛠️ SOLUCIÓN IMPLEMENTADA

Se ha creado el archivo `fix-profiles-rls-policies.sql` que contiene:

### 1. Eliminación de Políticas Inseguras
- Elimina todas las políticas RLS actuales que son demasiado permisivas

### 2. Funciones de Seguridad
- `is_admin_user()`: Verifica si el usuario actual es Admin, Director o Subdirector
- `can_manage_profiles()`: Verifica si el usuario puede gestionar perfiles (incluye Coordinador)

### 3. Nuevas Políticas Seguras

#### Visualización (SELECT)
- Los usuarios solo pueden ver su propio perfil
- Los administradores pueden ver todos los perfiles

#### Inserción (INSERT)
- Solo los administradores pueden crear nuevos perfiles

#### Actualización (UPDATE)
- Los usuarios pueden actualizar su propio perfil **excepto el rol**
- Los administradores pueden actualizar cualquier perfil

#### Eliminación (DELETE)
- Solo los administradores pueden eliminar perfiles
- Los administradores no pueden eliminarse a sí mismos

## 📋 INSTRUCCIONES DE APLICACIÓN

### PASO 1: Acceder a Supabase Dashboard
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto "Alerta Educativa"
3. Ve a "SQL Editor" en el menú lateral

### PASO 2: Ejecutar el Script de Corrección
1. Haz clic en "New query"
2. Copia y pega el contenido completo del archivo `fix-profiles-rls-policies.sql`
3. **IMPORTANTE**: Ejecuta el script cuando tengas una sesión activa como administrador
4. Haz clic en "Run" para ejecutar

### PASO 3: Verificar la Aplicación
El script incluye una consulta de verificación al final que mostrará todas las políticas aplicadas.

### PASO 4: Probar la Seguridad
1. Inicia sesión con un usuario no administrador
2. Verifica que no puede:
   - Ver perfiles de otros usuarios
   - Editar perfiles de otros usuarios
   - Cambiar su propio rol
   - Eliminar perfiles

## ⚠️ CONSIDERACIONES IMPORTANTES

### Antes de Aplicar
- **Haz un backup de tu base de datos**
- Asegúrate de tener al menos un usuario con rol "Admin" activo
- Ejecuta el script durante un período de bajo tráfico

### Después de Aplicar
- Verifica que los administradores pueden seguir gestionando usuarios
- Confirma que los usuarios normales solo ven su propio perfil
- Prueba la funcionalidad de edición de perfiles

## 🔍 IMPACTO EN LA APLICACIÓN

### Funcionalidades que Seguirán Funcionando
- Los administradores pueden gestionar usuarios normalmente
- Los usuarios pueden editar su información personal (nombre, email, DNI)
- La creación automática de perfiles al registrarse

### Funcionalidades que se Restringen
- Los usuarios no administradores ya no pueden ver la lista completa de usuarios
- Los usuarios no pueden cambiar su propio rol
- Solo los administradores pueden eliminar usuarios

## 📞 SOPORTE

Si encuentras algún problema después de aplicar esta corrección:
1. Verifica que el script se ejecutó completamente sin errores
2. Confirma que tienes usuarios con rol "Admin" disponibles
3. Revisa los logs de Supabase para errores de políticas RLS

---

**Fecha de creación**: $(date)
**Prioridad**: CRÍTICA
**Estado**: Listo para aplicar