# Solución para Error: column "deleted_at" does not exist

## Problema
El error indica que el índice `idx_teacher_assignments_user_id` está intentando referenciar una columna `deleted_at` que no existe en la tabla `teacher_assignments`.

## Causa Probable
1. La tabla `teacher_assignments` fue creada sin la columna `deleted_at`
2. Se está ejecutando solo una parte del script de esquema
3. Hay una versión anterior de la tabla sin esta columna

## Solución Paso a Paso

### Opción 1: Ejecutar Script de Diagnóstico
```sql
-- Ejecutar primero para identificar el problema
\i diagnose-database-schema.sql
```

### Opción 2: Ejecutar Script de Corrección
```sql
-- Ejecutar para corregir automáticamente
\i fix-teacher-assignments-table.sql
```

### Opción 3: Corrección Manual

1. **Verificar si la tabla existe:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teacher_assignments'
ORDER BY ordinal_position;
```

2. **Si falta la columna deleted_at, agregarla:**
```sql
ALTER TABLE teacher_assignments 
ADD COLUMN deleted_at timestamp with time zone;
```

3. **Si falta la columna updated_at, agregarla:**
```sql
ALTER TABLE teacher_assignments 
ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();
```

4. **Crear el trigger para updated_at:**
```sql
CREATE TRIGGER update_teacher_assignments_updated_at
    BEFORE UPDATE ON teacher_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

5. **Crear los índices:**
```sql
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_user_id 
ON teacher_assignments(user_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_section_id 
ON teacher_assignments(section_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_grade_id 
ON teacher_assignments(grade_id) 
WHERE deleted_at IS NULL;
```

### Opción 4: Recrear la Tabla Completa

Si hay problemas persistentes, eliminar y recrear:

```sql
-- CUIDADO: Esto eliminará todos los datos existentes
DROP TABLE IF EXISTS teacher_assignments CASCADE;

-- Luego ejecutar el script completo
\i complete-database-schema.sql
```

## Orden de Ejecución Recomendado

1. `complete-database-schema.sql` (archivo corregido)
2. `teacher-auxiliary-rls-policies.sql`
3. `admin-director-rls-policies.sql`
4. `fix-profiles-rls-policies.sql`

## Verificación Final

Después de aplicar la solución, verificar:

```sql
-- Verificar estructura de la tabla
\d teacher_assignments

-- Verificar índices
\di teacher_assignments*

-- Probar una consulta simple
SELECT COUNT(*) FROM teacher_assignments WHERE deleted_at IS NULL;
```

## Archivos Relacionados

- `complete-database-schema.sql` - Esquema principal corregido
- `fix-teacher-assignments-table.sql` - Script de corrección automática
- `diagnose-database-schema.sql` - Script de diagnóstico