# ORDEN DE EJECUCIÓN SQL - FUNCIONALIDADES DOCENTE Y AUXILIAR

## ⚠️ IMPORTANTE: Ejecutar en este orden exacto

Para implementar correctamente las funcionalidades de Docente y Auxiliar, ejecuta los archivos SQL en el siguiente orden:

### 1. ESQUEMA COMPLETO DE BASE DE DATOS
**Archivo:** `complete-database-schema.sql`
- ✅ Crea todas las tablas necesarias
- ✅ Añade índices para optimización
- ✅ Crea funciones utilitarias
- ✅ Configura triggers automáticos
- ✅ Establece permisos básicos

### 2. POLÍTICAS RLS PARA DOCENTES Y AUXILIARES
**Archivo:** `teacher-auxiliary-rls-policies.sql`
- ✅ Habilita Row Level Security
- ✅ Elimina políticas inseguras existentes
- ✅ Crea políticas granulares basadas en secciones
- ✅ Implementa acceso basado en roles

### 3. CORRECCIÓN DE POLÍTICAS RLS DE PERFILES
**Archivo:** `fix-profiles-rls-policies.sql`
- ✅ Corrige vulnerabilidades de seguridad
- ✅ Restringe acceso a perfiles
- ✅ Implementa validación de roles

### 4. ASIGNACIONES INICIALES DE DOCENTES
**Archivo:** `initial-teacher-assignments.sql`
- ✅ Consulta usuarios existentes
- ✅ Asigna automáticamente docentes a secciones
- ✅ Verifica asignaciones creadas
- ✅ Prueba políticas RLS

## 🔧 COMANDOS DE EJECUCIÓN

```sql
-- 1. Esquema completo
\i complete-database-schema.sql

-- 2. Políticas RLS
\i teacher-auxiliary-rls-policies.sql

-- 3. Corrección de perfiles
\i fix-profiles-rls-policies.sql

-- 4. Asignaciones iniciales
\i initial-teacher-assignments.sql
```

## ✅ VERIFICACIÓN POST-IMPLEMENTACIÓN

Después de ejecutar todos los scripts, verifica:

1. **Tablas creadas:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('teacher_assignments', 'incidents', 'permissions', 'nees', 'risk_factors', 'dropouts');
```

2. **Políticas RLS activas:**
```sql
SELECT schemaname, tablename, policyname, roles 
FROM pg_policies 
WHERE tablename IN ('students', 'incidents', 'permissions', 'teacher_assignments');
```

3. **Asignaciones creadas:**
```sql
SELECT COUNT(*) as total_assignments FROM teacher_assignments WHERE deleted_at IS NULL;
```

## 🚨 ERRORES COMUNES Y SOLUCIONES

### Error: "relation does not exist"
**Causa:** No se ejecutó el esquema completo primero
**Solución:** Ejecutar `complete-database-schema.sql` antes que cualquier otro archivo

### Error: "invalid input syntax for type uuid"
**Causa:** Usar placeholders de texto en lugar de UUIDs reales
**Solución:** El archivo `initial-teacher-assignments.sql` ya usa consultas dinámicas

### Error: "trigger already exists"
**Causa:** Intentar recrear triggers existentes
**Solución:** El esquema actualizado incluye `IF NOT EXISTS` para evitar este error

## 📋 FUNCIONALIDADES IMPLEMENTADAS

### Para DOCENTES:
- ✅ Ver estudiantes de sus secciones asignadas
- ✅ Registrar incidencias de sus estudiantes
- ✅ Ver y gestionar permisos de sus estudiantes
- ✅ Acceso a información de NEE de sus estudiantes
- ✅ Panel de control adaptado a su rol

### Para AUXILIARES:
- ✅ Ver estudiantes de secciones asignadas
- ✅ Registrar incidencias (con restricciones)
- ✅ Ver permisos (solo lectura)
- ✅ Acceso limitado a información de NEE
- ✅ Panel de control básico

### Para ADMINISTRADORES:
- ✅ Acceso completo a todas las funcionalidades
- ✅ Gestión de asignaciones de docentes
- ✅ Supervisión de todas las secciones

## 🔐 SEGURIDAD IMPLEMENTADA

- ✅ Row Level Security (RLS) en todas las tablas críticas
- ✅ Acceso basado en secciones asignadas
- ✅ Validación de roles en base de datos
- ✅ Principio de menor privilegio
- ✅ Auditoría automática con timestamps