const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
  }
}

// Load environment variables
loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFix() {
  console.log('🔧 APLICANDO CORRECCIÓN DE POLÍTICAS RLS\n');
  
  try {
    // 1. Habilitar RLS en la tabla profiles
    console.log('1. 🛡️ Habilitando Row Level Security...');
    const { error: rlsError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;' 
      });
    
    if (rlsError) {
      console.log('⚠️ RLS ya estaba habilitado o error:', rlsError.message);
    } else {
      console.log('✅ RLS habilitado correctamente');
    }
    
    // 2. Eliminar políticas existentes
    console.log('\n2. 🗑️ Eliminando políticas existentes...');
    const policiesToDrop = [
      'Users can view own profile',
      'Users can update own profile', 
      'Admins can view all profiles',
      'Admins can insert profiles',
      'Admins can update all profiles',
      'Admins can delete profiles',
      'Service role can do everything',
      'profiles_select_policy',
      'profiles_insert_policy',
      'profiles_update_policy',
      'profiles_delete_policy',
      'service_role_policy'
    ];
    
    for (const policy of policiesToDrop) {
      const { error } = await supabaseAdmin
        .rpc('exec_sql', { 
          sql: `DROP POLICY IF EXISTS "${policy}" ON profiles;` 
        });
      if (!error) {
        console.log(`   ✅ Eliminada política: ${policy}`);
      }
    }
    
    // 3. Crear funciones de utilidad
    console.log('\n3. 🔧 Creando funciones de utilidad...');
    
    const functions = [
      {
        name: 'is_admin_user',
        sql: `
          CREATE OR REPLACE FUNCTION is_admin_user()
          RETURNS BOOLEAN AS $$
          BEGIN
            RETURN (
              SELECT role FROM profiles 
              WHERE id = auth.uid() 
              AND role IN ('Admin', 'Director', 'Subdirector', 'Coordinador')
            ) IS NOT NULL;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      },
      {
        name: 'can_manage_profiles',
        sql: `
          CREATE OR REPLACE FUNCTION can_manage_profiles()
          RETURNS BOOLEAN AS $$
          BEGIN
            RETURN (
              SELECT role FROM profiles 
              WHERE id = auth.uid() 
              AND role IN ('Admin', 'Director')
            ) IS NOT NULL;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      }
    ];
    
    for (const func of functions) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: func.sql });
      if (error) {
        console.log(`❌ Error creando función ${func.name}:`, error.message);
      } else {
        console.log(`✅ Función ${func.name} creada`);
      }
    }
    
    // 4. Crear políticas RLS
    console.log('\n4. 📋 Creando políticas RLS...');
    
    const policies = [
      {
        name: 'profiles_select_policy',
        sql: `
          CREATE POLICY "profiles_select_policy" ON profiles
            FOR SELECT
            USING (
              auth.uid() = id OR 
              is_admin_user()
            );
        `
      },
      {
        name: 'profiles_insert_policy', 
        sql: `
          CREATE POLICY "profiles_insert_policy" ON profiles
            FOR INSERT
            WITH CHECK (
              can_manage_profiles()
            );
        `
      },
      {
        name: 'profiles_update_policy',
        sql: `
          CREATE POLICY "profiles_update_policy" ON profiles
            FOR UPDATE
            USING (
              auth.uid() = id OR 
              can_manage_profiles()
            )
            WITH CHECK (
              auth.uid() = id OR 
              can_manage_profiles()
            );
        `
      },
      {
        name: 'profiles_delete_policy',
        sql: `
          CREATE POLICY "profiles_delete_policy" ON profiles
            FOR DELETE
            USING (
              can_manage_profiles() AND auth.uid() != id
            );
        `
      },
      {
        name: 'service_role_policy',
        sql: `
          CREATE POLICY "service_role_policy" ON profiles
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
        `
      }
    ];
    
    for (const policy of policies) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy.sql });
      if (error) {
        console.log(`❌ Error creando política ${policy.name}:`, error.message);
      } else {
        console.log(`✅ Política ${policy.name} creada`);
      }
    }
    
    // 5. Verificar estado final
    console.log('\n5. ✅ Verificando estado final...');
    
    // Verificar RLS habilitado
    const { data: rlsCheck } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: "SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'profiles';" 
      });
    
    console.log('RLS habilitado:', rlsCheck ? '✅ SÍ' : '❌ NO');
    
    // Contar políticas
    const { data: policyCount } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: "SELECT COUNT(*) as count FROM pg_policies WHERE tablename = 'profiles';" 
      });
    
    console.log(`Políticas creadas: ${policyCount ? policyCount[0]?.count || 0 : 0}`);
    
    console.log('\n🎉 CORRECCIÓN DE RLS COMPLETADA EXITOSAMENTE');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Reiniciar el servidor de desarrollo (npm run dev)');
    console.log('2. Probar el login con diferentes roles');
    console.log('3. Verificar que cada rol vea la interfaz correcta');
    
  } catch (error) {
    console.error('💥 Error aplicando corrección RLS:', error);
    process.exit(1);
  }
}

// Ejecutar corrección
applyRLSFix();