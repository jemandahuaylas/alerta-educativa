# Guía de Implementación - Roles Administrativos

## Resumen de Funcionalidades

Esta guía implementa las políticas de seguridad (RLS) para los roles administrativos del sistema Alerta Educativa:

### Roles y Permisos

#### 🔴 **Admin**
- **Control total del sistema** sin restricciones
- Único rol que puede:
  - Matricular, editar y eliminar estudiantes
  - Crear, editar y eliminar grados y secciones
  - Gestionar perfiles de usuario
  - Gestionar asignaciones de docentes

#### 🟡 **Director, Subdirector, Coordinadores**
- **Restricciones específicas:**
  - ❌ NO pueden matricular, editar o borrar estudiantes
  - ❌ NO pueden crear, editar ni eliminar grados y secciones
  - ❌ NO pueden gestionar asignaciones de docentes

- **Permisos permitidos:**
  - ✅ Pueden ver todos los estudiantes del sistema
  - ✅ En página de perfil: pueden editar permisos, incidentes, diagnóstico (NEE), deserción
  - ✅ Pueden aprobar o rechazar incidencias registradas por docentes/auxiliares
  - ✅ Pueden aprobar permisos (junto con auxiliares)
  - ✅ Acceso completo de lectura a todos los datos del sistema

### Sistema de Aprobación

#### Incidencias
- **Registro:** Docentes y auxiliares registran incidencias
- **Aprobación:** Director, Subdirector, Coordinadores pueden aprobar/rechazar
- **Admin:** Control total

#### Permisos
- **Registro:** Docentes registran permisos
- **Aprobación:** Auxiliares, Director, Subdirector, Coordinadores pueden aprobar
- **Admin:** Control total

## Orden de Ejecución SQL

### Paso 1: Esquema Base
```sql
-- Ejecutar primero si no existe
\i complete-database-schema.sql
```

### Paso 2: Políticas para Docentes y Auxiliares
```sql
-- Ejecutar si no se ha hecho antes
\i teacher-auxiliary-rls-policies.sql
```

### Paso 3: Políticas para Roles Administrativos
```sql
-- Ejecutar el nuevo archivo
\i admin-director-rls-policies.sql
```

### Paso 4: Corrección de Políticas de Perfiles
```sql
-- Ejecutar si existe el archivo
\i fix-profiles-rls-policies.sql
```

## Validaciones Post-Implementación

### 1. Verificar Funciones de Utilidad
```sql
-- Verificar que las funciones existen
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'is_admin_only', 
  'is_management_role', 
  'can_approve_requests',
  'user_can_access_student'
);
```

### 2. Verificar Políticas RLS
```sql
-- Verificar que RLS está habilitado en todas las tablas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'students', 'grades', 'sections', 'profiles', 
  'teacher_assignments', 'incidents', 'permissions', 
  'nees', 'risk_factors', 'dropouts'
);
```

### 3. Verificar Políticas Específicas
```sql
-- Listar todas las políticas por tabla
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Pruebas de Funcionalidad

### Prueba 1: Restricciones de Admin
```sql
-- Como Admin, debería poder hacer todo
-- Cambiar a usuario Admin y probar:
INSERT INTO students (first_name, last_name, dni, grade_id, section_id) 
VALUES ('Test', 'Student', '12345678', 
  (SELECT id FROM grades LIMIT 1), 
  (SELECT id FROM sections LIMIT 1)
);
```

### Prueba 2: Restricciones de Director
```sql
-- Como Director, NO debería poder crear estudiantes
-- Cambiar a usuario Director y probar (debería fallar):
INSERT INTO students (first_name, last_name, dni, grade_id, section_id) 
VALUES ('Test', 'Student', '87654321', 
  (SELECT id FROM grades LIMIT 1), 
  (SELECT id FROM sections LIMIT 1)
);
```

### Prueba 3: Aprobación de Incidencias
```sql
-- Como Director, debería poder actualizar status de incidencias
UPDATE incidents 
SET status = 'Atendido', 
    attended_by = auth.uid(),
    attended_date = now()
WHERE id = (SELECT id FROM incidents WHERE status = 'Pendiente' LIMIT 1);
```

### Prueba 4: Aprobación de Permisos
```sql
-- Como Director, debería poder aprobar permisos
UPDATE permissions 
SET status = 'Aprobado', 
    approved_by = auth.uid(),
    approved_date = now()
WHERE id = (SELECT id FROM permissions WHERE status = 'Pendiente' LIMIT 1);
```

## Resolución de Problemas Comunes

### Error: "permission denied for table"
**Causa:** RLS está bloqueando el acceso
**Solución:**
1. Verificar que el usuario tiene el rol correcto en la tabla `profiles`
2. Verificar que las funciones de utilidad funcionan correctamente
3. Revisar las políticas RLS específicas

### Error: "function does not exist"
**Causa:** Las funciones de utilidad no se crearon correctamente
**Solución:**
```sql
-- Recrear las funciones manualmente
\i admin-director-rls-policies.sql
```

### Error: "policy already exists"
**Causa:** Intentando crear políticas que ya existen
**Solución:**
```sql
-- Las políticas se eliminan automáticamente antes de recrearse
-- Si persiste el error, eliminar manualmente:
DROP POLICY IF EXISTS "nombre_de_la_politica" ON nombre_tabla;
```

## Verificación de Seguridad

### Checklist de Seguridad
- [ ] Admin tiene control total ✅
- [ ] Director/Subdirector/Coordinadores NO pueden gestionar estudiantes ✅
- [ ] Director/Subdirector/Coordinadores NO pueden gestionar grados/secciones ✅
- [ ] Sistema de aprobación funciona correctamente ✅
- [ ] Acceso de lectura apropiado para cada rol ✅
- [ ] Docentes/Auxiliares mantienen acceso a sus secciones asignadas ✅

### Comandos de Verificación Rápida
```sql
-- Verificar roles de usuarios
SELECT name, email, role FROM profiles ORDER BY role;

-- Verificar asignaciones de docentes
SELECT p.name, p.role, g.name as grade, s.name as section
FROM teacher_assignments ta
JOIN profiles p ON ta.user_id = p.id
JOIN grades g ON ta.grade_id = g.id
JOIN sections s ON ta.section_id = s.id
WHERE ta.deleted_at IS NULL;

-- Verificar incidencias pendientes
SELECT i.*, s.first_name, s.last_name, p.name as registered_by_name
FROM incidents i
JOIN students s ON i.student_id = s.id
LEFT JOIN profiles p ON i.registered_by = p.id
WHERE i.status = 'Pendiente';

-- Verificar permisos pendientes
SELECT pe.*, s.first_name, s.last_name, p.name as requested_by_name
FROM permissions pe
JOIN students s ON pe.student_id = s.id
LEFT JOIN profiles p ON pe.requested_by = p.id
WHERE pe.status = 'Pendiente';
```

## Notas Importantes

1. **Orden de Ejecución:** Es crucial ejecutar los archivos SQL en el orden especificado
2. **Backup:** Siempre hacer backup de la base de datos antes de aplicar cambios
3. **Pruebas:** Probar cada funcionalidad con diferentes roles antes de producción
4. **Monitoreo:** Monitorear logs de la base de datos para detectar errores de permisos

## Archivos Relacionados

- `complete-database-schema.sql` - Esquema base de datos
- `teacher-auxiliary-rls-policies.sql` - Políticas para docentes y auxiliares
- `admin-director-rls-policies.sql` - Políticas para roles administrativos (NUEVO)
- `fix-profiles-rls-policies.sql` - Correcciones de políticas de perfiles
- `initial-teacher-assignments.sql` - Asignaciones iniciales

---

**Fecha de creación:** $(date)
**Versión:** 1.0
**Estado:** Implementación completa de roles administrativos