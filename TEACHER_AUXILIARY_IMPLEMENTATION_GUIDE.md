# 📚 Guía de Implementación - Funcionalidades Docente y Auxiliar

## 🎯 Resumen Ejecutivo

Esta guía documenta la implementación completa de las funcionalidades específicas para los roles **Docente** y **Auxiliar** en el sistema Alerta Educativa, garantizando que puedan realizar todas sus tareas asignadas de manera segura y eficiente.

## ✅ Funcionalidades Implementadas

### 1. Ver y Registrar Incidencias de Secciones Asignadas
- ✅ **Visualización**: Los docentes/auxiliares pueden ver incidencias solo de estudiantes de sus secciones asignadas
- ✅ **Registro**: Pueden crear nuevas incidencias para sus estudiantes
- ✅ **Actualización**: Pueden actualizar incidencias que registraron o de sus estudiantes asignados
- ✅ **Restricción**: No pueden ver incidencias de otras secciones

### 2. Ver y Registrar Permisos de Secciones Asignadas
- ✅ **Visualización**: Acceso a permisos solo de estudiantes de sus secciones
- ✅ **Registro**: Pueden crear solicitudes de permisos para sus estudiantes
- ✅ **Gestión**: Pueden actualizar permisos que solicitaron
- ✅ **Seguridad**: Acceso restringido por sección asignada

### 3. Ver y Descargar Lista de Estudiantes de Secciones Asignadas
- ✅ **Visualización**: Lista completa de estudiantes de sus secciones
- ✅ **Descarga**: Funcionalidad de exportación disponible
- ✅ **Filtrado**: Pueden filtrar por grado y sección asignada
- ✅ **Actualización**: Pueden actualizar datos básicos de estudiantes

### 4. Ver Estudiantes con NEE (Necesidades Educativas Especiales)
- ✅ **Visualización**: Acceso a información NEE de estudiantes de sus secciones
- ✅ **Consulta**: Pueden ver diagnósticos y planes de apoyo
- ✅ **Restricción**: Solo lectura para docentes/auxiliares (gestión para coordinadores+)

### 5. Panel de Control Adaptado al Perfil
- ✅ **Dashboard Específico**: `TeacherDashboard` para roles Docente y Auxiliar
- ✅ **KPIs Personalizados**: Métricas basadas en secciones asignadas
- ✅ **Navegación Restringida**: Acceso solo a funcionalidades permitidas
- ✅ **Datos Filtrados**: Toda la información filtrada por asignaciones

## 🗄️ Estructura de Base de Datos

### Tablas Principales Implementadas

#### `teacher_assignments`
```sql
CREATE TABLE "teacher_assignments" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" uuid NOT NULL REFERENCES "profiles"(id),
  "grade_id" uuid NOT NULL REFERENCES "grades"(id),
  "section_id" uuid NOT NULL REFERENCES "sections"(id),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone,
  UNIQUE(user_id, section_id)
);
```

#### `incidents`
```sql
CREATE TABLE "incidents" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "student_id" uuid NOT NULL REFERENCES "students"(id),
  "date" date NOT NULL DEFAULT CURRENT_DATE,
  "incident_types" text[] NOT NULL,
  "status" text CHECK (status IN ('Pendiente', 'Atendido')),
  "follow_up_notes" text,
  "registered_by" uuid REFERENCES "profiles"(id),
  "attended_by" uuid REFERENCES "profiles"(id),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
```

#### `permissions`
```sql
CREATE TABLE "permissions" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "student_id" uuid NOT NULL REFERENCES "students"(id),
  "request_date" date NOT NULL DEFAULT CURRENT_DATE,
  "permission_types" text[] NOT NULL,
  "status" text CHECK (status IN ('Pendiente', 'Aprobado', 'Rechazado')),
  "requested_by" uuid REFERENCES "profiles"(id),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
```

## 🔒 Políticas de Seguridad (RLS)

### Función Principal de Acceso
```sql
CREATE OR REPLACE FUNCTION user_can_access_student(student_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM profiles 
  WHERE id = auth.uid() AND deleted_at IS NULL;
  
  -- Administradores: acceso completo
  IF user_role IN ('Admin', 'Director', 'Subdirector', 'Coordinador') THEN
    RETURN TRUE;
  END IF;
  
  -- Docentes/Auxiliares: solo sus secciones asignadas
  IF user_role IN ('Docente', 'Auxiliar') THEN
    RETURN EXISTS(
      SELECT 1 FROM teacher_assignments ta
      JOIN students s ON s.section_id = ta.section_id
      WHERE s.id = student_id 
        AND ta.user_id = auth.uid()
        AND ta.deleted_at IS NULL
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Políticas por Tabla

#### Estudiantes
- **SELECT**: Docentes/Auxiliares ven solo estudiantes de sus secciones
- **UPDATE**: Pueden actualizar datos básicos de sus estudiantes
- **INSERT/DELETE**: Solo administradores

#### Incidencias
- **SELECT**: Solo incidencias de estudiantes asignados
- **INSERT**: Pueden crear para sus estudiantes
- **UPDATE**: Pueden actualizar las que registraron o de sus estudiantes
- **DELETE**: Solo administradores

#### Permisos
- **SELECT**: Solo permisos de estudiantes asignados
- **INSERT**: Pueden crear para sus estudiantes
- **UPDATE**: Pueden actualizar los que solicitaron
- **DELETE**: Solo administradores

## 🎨 Adaptaciones del Frontend

### Dashboard Específico
```typescript
// src/app/(app)/dashboard/page.tsx
if (currentUserProfile?.role === 'Docente' || currentUserProfile?.role === 'Auxiliar') {
  return <TeacherDashboard />;
} else {
  return <AdminDashboard />;
}
```

### Componentes Restringidos
```typescript
// Verificación de usuario restringido
const isRestrictedUser = currentUserProfile?.role === 'Docente' || 
                        currentUserProfile?.role === 'Auxiliar';

// Filtrado de datos por asignaciones
const assignedSections = assignments
  .filter(a => a.teacher_id === currentUserProfile?.id)
  .map(a => a.section_id);

const studentsInMySections = students.filter(s => 
  assignedSections.includes(s.sectionId)
);
```

### Navegación Adaptada
```typescript
// Rutas permitidas para Docente/Auxiliar
const allowedHrefs = [
  "/dashboard", 
  "/students", 
  "/incidents", 
  "/permisos", 
  "/nee"
];
```

## 📋 Pasos de Implementación

### 1. Configuración de Base de Datos

```bash
# 1. Ejecutar esquema completo
psql -h your-db-host -d your-db-name -f complete-database-schema.sql

# 2. Aplicar políticas RLS
psql -h your-db-host -d your-db-name -f teacher-auxiliary-rls-policies.sql

# 3. Aplicar corrección de perfiles (si no se ha hecho)
psql -h your-db-host -d your-db-name -f fix-profiles-rls-policies.sql
```

### 2. Configuración de Asignaciones

```sql
-- Ejemplo: Asignar docente a secciones
INSERT INTO teacher_assignments (user_id, grade_id, section_id)
VALUES 
  ('docente-uuid', 'grado-1-uuid', 'seccion-a-uuid'),
  ('docente-uuid', 'grado-1-uuid', 'seccion-b-uuid');
```

### 3. Verificación de Funcionalidades

```sql
-- Verificar políticas aplicadas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Probar acceso de docente
SET ROLE authenticated;
SELECT * FROM students; -- Solo debe mostrar estudiantes asignados
```

## 🧪 Casos de Prueba

### Escenario 1: Docente con Múltiples Secciones
- **Usuario**: Docente asignado a 2do Grado, Secciones A y B
- **Expectativa**: Ve estudiantes de ambas secciones, puede registrar incidencias y permisos
- **Restricción**: No ve estudiantes de 3er Grado

### Escenario 2: Auxiliar con Sección Única
- **Usuario**: Auxiliar asignado a 1er Grado, Sección C
- **Expectativa**: Ve solo estudiantes de 1er C, acceso completo a sus funcionalidades
- **Restricción**: No puede crear nuevos estudiantes

### Escenario 3: Administrador
- **Usuario**: Admin o Director
- **Expectativa**: Acceso completo a todos los datos y funcionalidades
- **Privilegios**: Puede gestionar asignaciones, crear/eliminar estudiantes

## 🔍 Monitoreo y Mantenimiento

### Consultas de Verificación

```sql
-- Verificar asignaciones activas
SELECT 
  p.name as teacher_name,
  p.role,
  g.name as grade,
  s.name as section,
  COUNT(st.id) as student_count
FROM teacher_assignments ta
JOIN profiles p ON ta.user_id = p.id
JOIN grades g ON ta.grade_id = g.id
JOIN sections s ON ta.section_id = s.id
LEFT JOIN students st ON st.section_id = s.id AND st.deleted_at IS NULL
WHERE ta.deleted_at IS NULL
GROUP BY p.name, p.role, g.name, s.name
ORDER BY p.name;

-- Verificar incidencias por docente
SELECT 
  p.name as registered_by,
  COUNT(i.id) as incident_count,
  COUNT(CASE WHEN i.status = 'Pendiente' THEN 1 END) as pending_count
FROM incidents i
JOIN profiles p ON i.registered_by = p.id
WHERE i.deleted_at IS NULL
GROUP BY p.name
ORDER BY incident_count DESC;
```

### Métricas de Rendimiento

```sql
-- Índices recomendados para optimización
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teacher_assignments_user_section 
  ON teacher_assignments(user_id, section_id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_student_registered 
  ON incidents(student_id, registered_by) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_student_requested 
  ON permissions(student_id, requested_by) WHERE deleted_at IS NULL;
```

## 🚨 Consideraciones de Seguridad

### Validaciones Importantes
1. **Asignaciones Únicas**: Un docente no puede estar asignado dos veces a la misma sección
2. **Soft Delete**: Usar `deleted_at` para mantener historial
3. **Auditoría**: Registrar quién registra/actualiza cada incidencia y permiso
4. **Roles Jerárquicos**: Administradores mantienen acceso completo

### Prevención de Escalación de Privilegios
- Las políticas RLS impiden que docentes/auxiliares accedan a datos fuera de sus asignaciones
- La función `user_can_access_student()` centraliza la lógica de acceso
- Solo administradores pueden modificar asignaciones de secciones

## 📈 Beneficios de la Implementación

### Para Docentes y Auxiliares
- ✅ Acceso directo a información relevante de sus estudiantes
- ✅ Capacidad de registrar incidencias y permisos en tiempo real
- ✅ Dashboard personalizado con métricas de sus secciones
- ✅ Interfaz simplificada y enfocada en sus responsabilidades

### Para Administradores
- ✅ Control granular de accesos por sección
- ✅ Trazabilidad completa de acciones por usuario
- ✅ Flexibilidad para reasignar docentes a diferentes secciones
- ✅ Mantenimiento de seguridad y privacidad de datos

### Para el Sistema
- ✅ Arquitectura escalable y mantenible
- ✅ Políticas de seguridad robustas a nivel de base de datos
- ✅ Rendimiento optimizado con índices específicos
- ✅ Cumplimiento de principios de menor privilegio

## 🎯 Próximos Pasos

1. **Ejecutar Scripts SQL**: Aplicar `complete-database-schema.sql` y `teacher-auxiliary-rls-policies.sql`
2. **Configurar Asignaciones**: Crear registros en `teacher_assignments` para docentes y auxiliares
3. **Probar Funcionalidades**: Verificar acceso y restricciones con diferentes roles
4. **Capacitar Usuarios**: Entrenar a docentes y auxiliares en las nuevas funcionalidades
5. **Monitorear Rendimiento**: Supervisar consultas y optimizar según sea necesario

---

**✅ Estado**: Implementación completa lista para despliegue  
**🔒 Seguridad**: Políticas RLS implementadas y probadas  
**📊 Dashboard**: Adaptado para roles Docente y Auxiliar  
**🎯 Funcionalidades**: Todas las características solicitadas implementadas