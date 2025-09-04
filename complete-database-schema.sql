-- ESQUEMA COMPLETO DE BASE DE DATOS PARA ALERTA EDUCATIVA
-- Este archivo incluye todas las tablas necesarias para las funcionalidades de Docente y Auxiliar

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLAS PRINCIPALES (ya existentes en schema.sql)
-- =====================================================

-- Tabla de Grados
DROP TABLE IF EXISTS "grades" CASCADE;
CREATE TABLE "grades" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

-- Tabla de Secciones
DROP TABLE IF EXISTS "sections" CASCADE;
CREATE TABLE "sections" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" text NOT NULL,
  "grade_id" uuid NOT NULL REFERENCES "grades"(id) ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

-- Tabla de Estudiantes
DROP TABLE IF EXISTS "students" CASCADE;
CREATE TABLE "students" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "dni" varchar(8) NOT NULL UNIQUE,
  "grade_id" uuid NOT NULL REFERENCES "grades"(id) ON DELETE RESTRICT,
  "section_id" uuid NOT NULL REFERENCES "sections"(id) ON DELETE RESTRICT,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

-- Tabla de Perfiles de Usuario
DROP TABLE IF EXISTS "profiles" CASCADE;
CREATE TABLE "profiles" (
  "id" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "role" text NOT NULL CHECK (role IN ('Admin', 'Director', 'Subdirector', 'Coordinador', 'Docente', 'Auxiliar')),
  "dni" varchar(8),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

-- =====================================================
-- TABLAS FALTANTES PARA FUNCIONALIDADES COMPLETAS
-- =====================================================

-- Tabla de Asignaciones de Docentes/Auxiliares a Secciones
DROP TABLE IF EXISTS "teacher_assignments" CASCADE;
CREATE TABLE "teacher_assignments" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" uuid NOT NULL REFERENCES "profiles"(id) ON DELETE CASCADE,
  "grade_id" uuid NOT NULL REFERENCES "grades"(id) ON DELETE CASCADE,
  "section_id" uuid NOT NULL REFERENCES "sections"(id) ON DELETE CASCADE,
  "assignment_type" text NOT NULL CHECK (assignment_type IN ('primary', 'auxiliary')) DEFAULT 'primary',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone,
  UNIQUE(user_id, section_id)
);

-- Tabla de Incidencias
DROP TABLE IF EXISTS "incidents" CASCADE;
CREATE TABLE "incidents" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "student_id" uuid NOT NULL REFERENCES "students"(id) ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "date" timestamp with time zone NOT NULL DEFAULT now(),
  "status" text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  "registered_by" uuid NOT NULL REFERENCES "profiles"(id) ON DELETE RESTRICT,
  "approved_by" uuid REFERENCES "profiles"(id) ON DELETE SET NULL,
  "approved_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

-- Tabla de Permisos
DROP TABLE IF EXISTS "permissions" CASCADE;
CREATE TABLE "permissions" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "student_id" uuid NOT NULL REFERENCES "students"(id) ON DELETE CASCADE,
  "reason" text NOT NULL,
  "request_date" timestamp with time zone NOT NULL,
  "return_date" timestamp with time zone,
  "status" text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  "requested_by" uuid NOT NULL REFERENCES "profiles"(id) ON DELETE RESTRICT,
  "approved_by" uuid REFERENCES "profiles"(id) ON DELETE SET NULL,
  "approved_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

-- Tabla de Necesidades Educativas Especiales (NEE)
DROP TABLE IF EXISTS "nees" CASCADE;
CREATE TABLE "nees" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "student_id" uuid NOT NULL REFERENCES "students"(id) ON DELETE CASCADE,
  "type" text NOT NULL,
  "description" text,
  "diagnosis_date" timestamp with time zone,
  "professional" text,
  "recommendations" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

-- Tabla de Factores de Riesgo
DROP TABLE IF EXISTS "risk_factors" CASCADE;
CREATE TABLE "risk_factors" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "student_id" uuid NOT NULL REFERENCES "students"(id) ON DELETE CASCADE,
  "factor_type" text NOT NULL,
  "description" text,
  "severity" text CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
  "identified_date" timestamp with time zone NOT NULL DEFAULT now(),
  "identified_by" uuid NOT NULL REFERENCES "profiles"(id) ON DELETE RESTRICT,
  "status" text CHECK (status IN ('active', 'resolved', 'monitoring')) DEFAULT 'active',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

-- Tabla de Deserción
DROP TABLE IF EXISTS "dropouts" CASCADE;
CREATE TABLE "dropouts" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "student_id" uuid NOT NULL REFERENCES "students"(id) ON DELETE CASCADE,
  "dropout_date" timestamp with time zone NOT NULL,
  "reason" text NOT NULL,
  "detailed_reason" text,
  "reported_by" uuid NOT NULL REFERENCES "profiles"(id) ON DELETE RESTRICT,
  "follow_up_actions" text,
  "status" text CHECK (status IN ('confirmed', 'investigating', 'returned')) DEFAULT 'investigating',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para teacher_assignments
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_user_id ON teacher_assignments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_section_id ON teacher_assignments(section_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_grade_id ON teacher_assignments(grade_id) WHERE deleted_at IS NULL;

-- Índices para incidents
CREATE INDEX IF NOT EXISTS idx_incidents_student_id ON incidents(student_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_registered_by ON incidents(registered_by) WHERE deleted_at IS NULL;

-- Índices para permissions
CREATE INDEX IF NOT EXISTS idx_permissions_student_id ON permissions(student_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_request_date ON permissions(request_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_status ON permissions(status) WHERE deleted_at IS NULL;

-- Índices para students
CREATE INDEX IF NOT EXISTS idx_students_section_id ON students(section_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_grade_id ON students(grade_id) WHERE deleted_at IS NULL;

-- Índices para nees
CREATE INDEX IF NOT EXISTS idx_nees_student_id ON nees(student_id) WHERE deleted_at IS NULL;

-- Índices para risk_factors
CREATE INDEX IF NOT EXISTS idx_risk_factors_student_id ON risk_factors(student_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_risk_factors_severity ON risk_factors(severity) WHERE deleted_at IS NULL;

-- Índices para dropouts
CREATE INDEX IF NOT EXISTS idx_dropouts_student_id ON dropouts(student_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dropouts_date ON dropouts(dropout_date DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Director', 'Subdirector')
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede gestionar perfiles
CREATE OR REPLACE FUNCTION can_manage_profiles()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Director', 'Subdirector', 'Coordinador')
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede acceder a un estudiante
CREATE OR REPLACE FUNCTION user_can_access_student(student_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role text;
BEGIN
  -- Obtener el rol del usuario actual
  SELECT role INTO user_role 
  FROM profiles 
  WHERE id = auth.uid() AND deleted_at IS NULL;
  
  -- Los administradores pueden acceder a todos los estudiantes
  IF user_role IN ('Admin', 'Director', 'Subdirector', 'Coordinador') THEN
    RETURN TRUE;
  END IF;
  
  -- Docentes y Auxiliares solo pueden acceder a estudiantes de sus secciones asignadas
  IF user_role IN ('Docente', 'Auxiliar') THEN
    RETURN EXISTS(
      SELECT 1 FROM teacher_assignments ta
      JOIN students s ON s.section_id = ta.section_id
      WHERE s.id = student_id 
        AND ta.user_id = auth.uid()
        AND ta.deleted_at IS NULL
        AND s.deleted_at IS NULL
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en teacher_assignments
DROP TRIGGER IF EXISTS update_teacher_assignments_updated_at ON teacher_assignments;
CREATE TRIGGER update_teacher_assignments_updated_at
    BEFORE UPDATE ON teacher_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en nees
DROP TRIGGER IF EXISTS update_nees_updated_at ON nees;
CREATE TRIGGER update_nees_updated_at 
  BEFORE UPDATE ON nees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en risk_factors
DROP TRIGGER IF EXISTS update_risk_factors_updated_at ON risk_factors;
CREATE TRIGGER update_risk_factors_updated_at 
  BEFORE UPDATE ON risk_factors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PERMISOS BÁSICOS
-- =====================================================

-- Permisos para tablas básicas
GRANT SELECT ON TABLE grades, sections TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE teacher_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE incidents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE nees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE risk_factors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE dropouts TO authenticated;

-- Comentarios para documentación
COMMENT ON TABLE teacher_assignments IS 'Asignaciones de docentes y auxiliares a secciones específicas';
COMMENT ON TABLE incidents IS 'Registro de incidencias de estudiantes';
COMMENT ON TABLE permissions IS 'Solicitudes de permisos de estudiantes';
COMMENT ON TABLE nees IS 'Necesidades Educativas Especiales de estudiantes';
COMMENT ON TABLE risk_factors IS 'Factores de riesgo identificados en estudiantes';
COMMENT ON TABLE dropouts IS 'Registro de deserción escolar';

COMMENT ON FUNCTION user_can_access_student(UUID) IS 'Verifica si un usuario puede acceder a un estudiante específico basado en sus asignaciones de sección';
COMMENT ON FUNCTION is_admin_user() IS 'Verifica si el usuario actual tiene privilegios administrativos';
COMMENT ON FUNCTION can_manage_profiles() IS 'Verifica si el usuario actual puede gestionar perfiles de usuario';