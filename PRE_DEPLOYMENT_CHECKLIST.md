# Lista de Verificación Pre-Deployment

## ⚠️ IMPORTANTE: Verificar TODO antes de subir a GitHub

Esta guía te ayudará a verificar que todos los cambios funcionen correctamente en local antes de hacer el deployment a producción.

## 1. Verificación de Base de Datos

### 1.1 Ejecutar Scripts SQL en Orden
```bash
# 1. Esquema principal
psql -d tu_base_datos -f complete-database-schema.sql

# 2. Políticas RLS para Docentes y Auxiliares
psql -d tu_base_datos -f teacher-auxiliary-rls-policies.sql

# 3. Políticas RLS para Admin y Directivos
psql -d tu_base_datos -f admin-director-rls-policies.sql
```

### 1.2 Verificar Estructura de Tablas
```sql
-- Verificar que todas las tablas tengan la columna deleted_at
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'deleted_at';

-- Verificar índices creados
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;
```

## 2. Verificación de Roles y Permisos

### 2.1 Crear Usuarios de Prueba
```sql
-- Admin
INSERT INTO auth.users (id, email, role) VALUES 
('admin-test-id', 'admin@test.com', 'authenticated');

INSERT INTO profiles (id, email, role, full_name) VALUES 
('admin-test-id', 'admin@test.com', 'Admin', 'Admin Test');

-- Director
INSERT INTO auth.users (id, email, role) VALUES 
('director-test-id', 'director@test.com', 'authenticated');

INSERT INTO profiles (id, email, role, full_name) VALUES 
('director-test-id', 'director@test.com', 'Director', 'Director Test');

-- Docente
INSERT INTO auth.users (id, email, role) VALUES 
('teacher-test-id', 'teacher@test.com', 'authenticated');

INSERT INTO profiles (id, email, role, full_name) VALUES 
('teacher-test-id', 'teacher@test.com', 'Docente', 'Docente Test');
```

### 2.2 Probar Políticas RLS
```sql
-- Cambiar a usuario docente y probar acceso
SET ROLE teacher_test_id;

-- Debe funcionar: Ver estudiantes de su sección
SELECT * FROM students WHERE section_id IN (
  SELECT section_id FROM teacher_assignments WHERE user_id = auth.uid()
);

-- No debe funcionar: Ver todos los estudiantes
SELECT * FROM students; -- Debe retornar solo estudiantes asignados

-- Resetear rol
RESET ROLE;
```

## 3. Verificación de Frontend

### 3.1 Iniciar Servidor de Desarrollo
```bash
npm run dev
```

### 3.2 Probar Funcionalidades por Rol

#### Admin
- [ ] Login como Admin
- [ ] Crear/editar/eliminar estudiantes
- [ ] Crear/editar/eliminar grados y secciones
- [ ] Ver todos los perfiles
- [ ] Aprobar/rechazar incidentes
- [ ] Aprobar/rechazar permisos

#### Director/Subdirector/Coordinador
- [ ] Login como Director
- [ ] Ver estudiantes (solo lectura)
- [ ] Ver grados y secciones (solo lectura)
- [ ] Aprobar/rechazar incidentes
- [ ] Aprobar/rechazar permisos
- [ ] No poder crear/editar estudiantes

#### Docente
- [ ] Login como Docente
- [ ] Ver solo estudiantes de sus secciones asignadas
- [ ] Crear/editar incidentes de sus estudiantes
- [ ] Crear/editar permisos de sus estudiantes
- [ ] Ver/editar NEE, factores de riesgo, deserción
- [ ] No ver estudiantes de otras secciones

#### Auxiliar
- [ ] Login como Auxiliar
- [ ] Mismas funciones que Docente
- [ ] Ver solo estudiantes de secciones asignadas

## 4. Verificación de Seguridad

### 4.1 Probar Restricciones
```javascript
// En consola del navegador, intentar acceso no autorizado
// Como Docente, intentar ver estudiante de otra sección
fetch('/api/students/[id-de-otra-seccion]')
  .then(r => r.json())
  .then(console.log); // Debe fallar o retornar vacío
```

### 4.2 Verificar Logs de Errores
- [ ] No hay errores 500 en consola
- [ ] No hay errores de RLS en logs de Supabase
- [ ] No hay warnings de seguridad

## 5. Verificación de Performance

### 5.1 Tiempos de Carga
- [ ] Dashboard carga en < 3 segundos
- [ ] Lista de estudiantes carga en < 2 segundos
- [ ] Búsquedas responden en < 1 segundo

### 5.2 Consultas Optimizadas
```sql
-- Verificar que los índices se usen
EXPLAIN ANALYZE SELECT * FROM students WHERE section_id = 1;
-- Debe usar índice idx_students_section_id
```

## 6. Backup y Preparación

### 6.1 Crear Backup
```bash
# Backup de base de datos actual
pg_dump tu_base_datos > backup_pre_deployment_$(date +%Y%m%d_%H%M%S).sql
```

### 6.2 Documentar Cambios
- [ ] Actualizar README.md con nuevas funcionalidades
- [ ] Documentar nuevos roles en DEPLOYMENT_GUIDE.md
- [ ] Crear notas de release

## 7. Plan de Rollback

### 7.1 Preparar Script de Rollback
```sql
-- En caso de problemas, script para revertir cambios
-- (Mantener backup del esquema anterior)
```

### 7.2 Monitoreo Post-Deployment
- [ ] Verificar logs de Supabase por 24h
- [ ] Monitorear errores de usuarios
- [ ] Verificar performance de consultas

## 8. Checklist Final

- [ ] ✅ Todos los tests pasan en local
- [ ] ✅ Base de datos funciona correctamente
- [ ] ✅ Todos los roles funcionan como esperado
- [ ] ✅ Políticas de seguridad verificadas
- [ ] ✅ Performance aceptable
- [ ] ✅ Backup creado
- [ ] ✅ Plan de rollback preparado
- [ ] ✅ Documentación actualizada

## 🚀 Solo después de completar TODO lo anterior, proceder con:

```bash
git add .
git commit -m "feat: Implementar sistema completo de roles y permisos con RLS"
git push origin main
```

## 📞 Contacto de Emergencia

En caso de problemas críticos post-deployment:
1. Ejecutar script de rollback
2. Restaurar backup de base de datos
3. Revertir commit en GitHub

---

**⚠️ RECORDATORIO: La seguridad y estabilidad del sistema son prioritarias. No hacer deployment si hay dudas.**