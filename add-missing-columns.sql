-- Agregar las columnas faltantes a la tabla profiles existente

-- Agregar columna created_at si no existe
ALTER TABLE "profiles" 
ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone NOT NULL DEFAULT now();

-- Agregar columna updated_at si no existe
ALTER TABLE "profiles" 
ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();

-- Actualizar registros existentes para que tengan valores en estas columnas
UPDATE "profiles" 
SET 
  "created_at" = COALESCE("created_at", now()),
  "updated_at" = COALESCE("updated_at", now())
WHERE "created_at" IS NULL OR "updated_at" IS NULL;

-- Crear o reemplazar la función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar trigger existente si existe y crear uno nuevo
DROP TRIGGER IF EXISTS update_profiles_updated_at ON "profiles";
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON "profiles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para las nuevas columnas
COMMENT ON COLUMN "profiles"."created_at" IS 'Fecha y hora de creación del perfil';
COMMENT ON COLUMN "profiles"."updated_at" IS 'Fecha y hora de última actualización del perfil';