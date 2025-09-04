-- Crear tabla profiles para gestión de usuarios
-- Esta tabla almacena información adicional de los usuarios autenticados

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "role" text NOT NULL CHECK (role IN ('Admin', 'Director', 'Subdirector', 'Coordinador', 'Docente', 'Auxiliar')),
  "dni" varchar(8),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

-- Política para permitir que los usuarios vean todos los perfiles (necesario para gestión)
CREATE POLICY "Allow authenticated users to view all profiles" ON "profiles"
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir que los usuarios actualicen perfiles
CREATE POLICY "Allow authenticated users to update profiles" ON "profiles"
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política adicional para permitir que los usuarios actualicen cualquier perfil (para administradores)
CREATE POLICY "Allow service role to update all profiles" ON "profiles"
  FOR UPDATE USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Política para permitir que los usuarios inserten perfiles
CREATE POLICY "Allow authenticated users to insert profiles" ON "profiles"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir que los usuarios eliminen perfiles
CREATE POLICY "Allow authenticated users to delete profiles" ON "profiles"
  FOR DELETE USING (auth.role() = 'authenticated');

-- Otorgar permisos a usuarios autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "profiles" TO "authenticated";
GRANT SELECT ON TABLE "profiles" TO "anon";

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON "profiles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, dni)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Docente'),
    NEW.raw_user_meta_data->>'dni'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentarios para documentación
COMMENT ON TABLE "profiles" IS 'Perfiles de usuario con información adicional';
COMMENT ON COLUMN "profiles"."id" IS 'ID del usuario, referencia a auth.users';
COMMENT ON COLUMN "profiles"."name" IS 'Nombre completo del usuario';
COMMENT ON COLUMN "profiles"."email" IS 'Correo electrónico del usuario';
COMMENT ON COLUMN "profiles"."role" IS 'Rol del usuario en el sistema';
COMMENT ON COLUMN "profiles"."dni" IS 'Documento Nacional de Identidad (opcional)';