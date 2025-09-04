# Configuración de Base de Datos - Alerta Educativa

## Problema Identificado

La aplicación está mostrando errores al editar perfiles de usuario porque la tabla `profiles` no existe en la base de datos de Supabase.

## Solución

Necesitas ejecutar el script SQL para crear la tabla `profiles` y sus configuraciones asociadas.

### Pasos para Configurar la Base de Datos:

1. **Accede a tu Dashboard de Supabase**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto "Alerta Educativa"

2. **Navega al Editor SQL**
   - En el menú lateral, haz clic en "SQL Editor"
   - Selecciona "New query"

3. **Ejecuta el Script de Configuración**
   - Copia y pega el contenido del archivo `create-profiles-table.sql`
   - O alternativamente, copia y pega el contenido completo del archivo `schema.sql` actualizado
   - Haz clic en "Run" para ejecutar el script

4. **Verifica la Creación**
   - Ve a "Table Editor" en el menú lateral
   - Deberías ver la tabla `profiles` listada junto con `students`, `grades`, y `sections`

### ¿Qué hace este script?

- ✅ Crea la tabla `profiles` con los campos necesarios
- ✅ Configura Row Level Security (RLS) para seguridad
- ✅ Establece políticas de acceso apropiadas
- ✅ Crea triggers automáticos para:
  - Actualizar `updated_at` cuando se modifica un perfil
  - Crear automáticamente un perfil cuando se registra un nuevo usuario

### Configuración de Variables de Entorno

Asegúrate también de que tu archivo `.env.local` tenga la clave de servicio configurada:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
```

**Para obtener la `SUPABASE_SERVICE_ROLE_KEY`:**
1. En tu dashboard de Supabase, ve a Settings → API
2. Copia la clave `service_role` (NO la `anon` key)
3. Pégala en tu archivo `.env.local`

### Después de la Configuración

Una vez que hayas ejecutado el script SQL y configurado las variables de entorno:

1. Reinicia tu servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Prueba las funcionalidades CRUD:
   - ✅ Crear nuevos usuarios/docentes
   - ✅ Editar perfiles existentes
   - ✅ Eliminar usuarios
   - ✅ Ver lista de docentes

### Solución de Problemas

Si sigues teniendo problemas después de la configuración:

1. **Verifica que la tabla existe**: Ve a Table Editor y confirma que `profiles` está listada
2. **Revisa las políticas RLS**: En Table Editor → profiles → Settings, verifica que las políticas estén activas
3. **Confirma las variables de entorno**: Asegúrate de que todas las claves estén correctamente configuradas
4. **Revisa la consola del navegador**: Busca errores específicos que puedan dar más información

### Contacto

Si necesitas ayuda adicional con la configuración, proporciona:
- Capturas de pantalla del error
- Logs de la consola del navegador
- Confirmación de que ejecutaste el script SQL correctamente