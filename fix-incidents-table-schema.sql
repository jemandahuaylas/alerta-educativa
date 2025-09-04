-- CORRECCIÓN DEL ESQUEMA DE LA TABLA INCIDENTS
-- Este script migra la tabla incidents del esquema actual al esquema esperado por la aplicación

-- Paso 1: Crear la nueva tabla con la estructura correcta
CREATE TABLE incidents_new (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  incident_types text[] NOT NULL DEFAULT ARRAY['Incidente General'],
  description text NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('Pendiente', 'Atendido')) DEFAULT 'Pendiente',
  registered_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

-- Paso 2: Migrar datos existentes (si los hay)
-- Convertir title a incident_types array y mapear status
INSERT INTO incidents_new (
  id,
  student_id,
  incident_types,
  description,
  date,
  status,
  registered_by,
  approved_by,
  approved_at,
  created_at,
  deleted_at
)
SELECT 
  id,
  student_id,
  ARRAY[COALESCE(title, 'Incidente General')] as incident_types,
  description,
  date,
  CASE 
    WHEN status = 'approved' THEN 'Atendido'
    WHEN status = 'rejected' THEN 'Atendido'
    ELSE 'Pendiente'
  END as status,
  registered_by,
  approved_by,
  approved_at,
  created_at,
  deleted_at
FROM incidents
WHERE deleted_at IS NULL;

-- Paso 3: Eliminar la tabla antigua
DROP TABLE incidents CASCADE;

-- Paso 4: Renombrar la nueva tabla
ALTER TABLE incidents_new RENAME TO incidents;

-- Paso 5: Recrear índices para optimizar consultas
CREATE INDEX idx_incidents_student_id ON incidents(student_id);
CREATE INDEX idx_incidents_registered_by ON incidents(registered_by);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_date ON incidents(date);
CREATE INDEX idx_incidents_deleted_at ON incidents(deleted_at);

-- Paso 6: Crear trigger para updated_at
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Paso 7: Habilitar Row Level Security (RLS)
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Paso 8: Crear políticas RLS básicas
-- Política para lectura: usuarios autenticados pueden ver incidentes
CREATE POLICY "incidents_select_policy" ON incidents
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserción: usuarios autenticados pueden crear incidentes
CREATE POLICY "incidents_insert_policy" ON incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = registered_by);

-- Política para actualización: solo el creador o administradores pueden actualizar
CREATE POLICY "incidents_update_policy" ON incidents
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = registered_by OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('Admin', 'Director', 'Subdirector', 'Coordinador')
    )
  );

-- Política para eliminación: solo administradores pueden eliminar
CREATE POLICY "incidents_delete_policy" ON incidents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

-- Verificar que la migración fue exitosa
SELECT 
  'Migración completada exitosamente' as mensaje,
  COUNT(*) as total_incidents
FROM incidents;