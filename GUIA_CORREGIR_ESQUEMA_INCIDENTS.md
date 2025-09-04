# GUÍA PARA CORREGIR EL ESQUEMA DE LA TABLA INCIDENTS

## Problema Identificado

La aplicación está fallando con el error "Error fetching incidents: {}" porque hay una discrepancia entre:

**Esquema actual en la base de datos:**
- `title` (text)
- `description` (text) 
- `status` con valores: 'pending', 'approved', 'rejected'

**Esquema esperado por la aplicación:**
- `incident_types` (text[] - array)
- `description` (text)
- `status` con valores: 'Pendiente', 'Atendido'

## Solución

### Paso 1: Acceder al Dashboard de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto "Alerta Educativa"
4. Ve a la sección **SQL Editor** en el menú lateral

### Paso 2: Ejecutar el Script de Corrección

1. En el SQL Editor, crea una nueva consulta
2. Copia y pega el contenido completo del archivo `fix-incidents-table-schema.sql`
3. Haz clic en **"Run"** para ejecutar el script

### Paso 3: Verificar la Migración

El script incluye una verificación automática al final. Deberías ver:
```
mensaje: "Migración completada exitosamente"
total_incidents: [número de incidentes migrados]
```

### Paso 4: Verificar en la Aplicación

1. Regresa a tu aplicación local
2. Recarga la página donde se muestran los incidentes
3. El error "Error fetching incidents: {}" debería desaparecer
4. Los incidentes deberían cargarse correctamente

## Qué Hace el Script

1. **Crea una nueva tabla** `incidents_new` con la estructura correcta
2. **Migra los datos existentes:**
   - Convierte `title` → `incident_types` (como array)
   - Mantiene `description`
   - Mapea `status`: 'approved'/'rejected' → 'Atendido', 'pending' → 'Pendiente'
3. **Elimina la tabla antigua** y renombra la nueva
4. **Recrea índices** para optimizar consultas
5. **Configura RLS** (Row Level Security) con políticas apropiadas
6. **Verifica** que la migración fue exitosa

## Estructura Final de la Tabla

```sql
CREATE TABLE incidents (
  id uuid PRIMARY KEY,
  student_id uuid NOT NULL,
  incident_types text[] NOT NULL DEFAULT ARRAY['Incidente General'],
  description text NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('Pendiente', 'Atendido')),
  registered_by uuid NOT NULL,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);
```

## Políticas RLS Configuradas

- **Lectura:** Todos los usuarios autenticados pueden ver incidentes
- **Inserción:** Los usuarios pueden crear incidentes (como registered_by)
- **Actualización:** Solo el creador o roles administrativos pueden actualizar
- **Eliminación:** Solo administradores pueden eliminar

## Notas Importantes

- ⚠️ **CRÍTICO:** Este script debe ejecutarse desde el dashboard de Supabase, NO desde la aplicación
- 🔄 **Migración segura:** Los datos existentes se preservan durante la migración
- 🔒 **Seguridad:** Se mantienen las políticas RLS para proteger los datos
- 📊 **Índices:** Se recrean todos los índices necesarios para el rendimiento

## Solución de Problemas

Si encuentras errores durante la ejecución:

1. **Error de columna no existe:** Verifica que estés ejecutando el script correcto
2. **Error de permisos:** Asegúrate de tener permisos de administrador en Supabase
3. **Error de referencia:** Verifica que las tablas `students` y `profiles` existan

## Después de la Migración

Una vez completada la migración:

1. ✅ Los incidentes se cargarán correctamente en la aplicación
2. ✅ Los formularios de creación/edición funcionarán
3. ✅ Los filtros por estado funcionarán con 'Pendiente'/'Atendido'
4. ✅ Las políticas de seguridad estarán activas

---

**¿Necesitas ayuda?** Si encuentras problemas durante la migración, revisa los logs del SQL Editor en Supabase para obtener más detalles sobre cualquier error.