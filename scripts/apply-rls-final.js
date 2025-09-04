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

async function applyRLSFinal() {
  console.log('🔧 APLICANDO POLÍTICAS RLS FINAL\n');
  
  try {
    // 1. Habilitar RLS en la tabla profiles
    console.log('1. 🔒 Habilitando RLS en tabla profiles...');
    
    const enableRLSQuery = 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;';
    
    // Usar fetch directo a la API REST de Supabase para ejecutar SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: enableRLSQuery
      })
    });
    
    if (response.ok) {
      console.log('✅ RLS habilitado exitosamente');
    } else {
      console.log('⚠️ RLS ya estaba habilitado o error menor');
    }
    
    // 2. Aplicar políticas usando el método directo
    console.log('\n2. 📋 Aplicando políticas RLS...');
    
    const policies = [
      {
        name: 'DROP existing policies',
        sql: `
          DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
          DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
          DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
          DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
          DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
          DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
        `
      },
      {
        name: 'CREATE utility functions',
        sql: `
          CREATE OR REPLACE FUNCTION is_admin_user()
          RETURNS BOOLEAN AS $$
          BEGIN
            RETURN (
              SELECT role IN ('Admin', 'Director', 'Subdirector', 'Coordinador')
              FROM profiles 
              WHERE id = auth.uid()
            );
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          
          CREATE OR REPLACE FUNCTION can_manage_profiles()
          RETURNS BOOLEAN AS $$
          BEGIN
            RETURN (
              SELECT role IN ('Admin', 'Director', 'Subdirector', 'Coordinador')
              FROM profiles 
              WHERE id = auth.uid()
            );
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      },
      {
        name: 'CREATE SELECT policy',
        sql: `
          CREATE POLICY "Users can view profiles based on role" ON profiles
          FOR SELECT USING (
            auth.uid() = id OR 
            can_manage_profiles() OR
            auth.role() = 'service_role'
          );
        `
      },
      {
        name: 'CREATE INSERT policy', 
        sql: `
          CREATE POLICY "Users can insert own profile or admins can insert any" ON profiles
          FOR INSERT WITH CHECK (
            auth.uid() = id OR 
            can_manage_profiles() OR
            auth.role() = 'service_role'
          );
        `
      },
      {
        name: 'CREATE UPDATE policy',
        sql: `
          CREATE POLICY "Users can update own profile or admins can update any" ON profiles
          FOR UPDATE USING (
            (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid())) OR
            can_manage_profiles() OR
            auth.role() = 'service_role'
          );
        `
      },
      {
        name: 'CREATE DELETE policy',
        sql: `
          CREATE POLICY "Only admins can delete profiles except themselves" ON profiles
          FOR DELETE USING (
            (can_manage_profiles() AND auth.uid() != id) OR
            auth.role() = 'service_role'
          );
        `
      }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const policy of policies) {
      console.log(`\n🔄 Aplicando: ${policy.name}`);
      
      try {
        // Intentar con diferentes métodos
        let success = false;
        
        // Método 1: API REST directa
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: policy.sql })
          });
          
          if (response.ok) {
            success = true;
          }
        } catch (e) {
          // Continuar con el siguiente método
        }
        
        // Método 2: Usar rpc si está disponible
        if (!success) {
          try {
            const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy.sql });
            if (!error) {
              success = true;
            }
          } catch (e) {
            // Continuar
          }
        }
        
        if (success) {
          console.log('   ✅ Aplicado exitosamente');
          successCount++;
        } else {
          console.log('   ⚠️ No se pudo aplicar - requiere aplicación manual');
          errorCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }
    
    // 3. Verificar estado final
    console.log('\n3. ✅ Verificando estado final...');
    
    // Probar acceso como admin
    const { data: adminProfiles, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role');
    
    if (adminError) {
      console.log('❌ Error accediendo como admin:', adminError.message);
    } else {
      console.log(`✅ Acceso como admin exitoso: ${adminProfiles.length} perfiles`);
    }
    
    // Probar acceso como usuario anónimo
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    const { data: anonProfiles, error: anonError } = await supabaseAnon
      .from('profiles')
      .select('id, name, email, role');
    
    if (anonError) {
      console.log('✅ Acceso anónimo bloqueado correctamente:', anonError.message);
    } else {
      console.log(`⚠️ Acceso anónimo permitido: ${anonProfiles?.length || 0} perfiles visibles`);
    }
    
    // Resumen final
    console.log('\n🎉 APLICACIÓN COMPLETADA');
    console.log(`✅ Políticas aplicadas: ${successCount}`);
    console.log(`⚠️ Políticas pendientes: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n📝 ACCIÓN REQUERIDA:');
      console.log('Algunas políticas no se pudieron aplicar automáticamente.');
      console.log('Ve al dashboard de Supabase y ejecuta manualmente:');
      console.log('fix-profiles-rls-policies.sql');
    } else {
      console.log('\n🎊 ¡TODAS LAS POLÍTICAS APLICADAS EXITOSAMENTE!');
      console.log('Las políticas RLS están ahora activas.');
    }
    
    console.log('\n🧪 PRÓXIMOS PASOS DE PRUEBA:');
    console.log('1. Hacer logout de la aplicación');
    console.log('2. Intentar acceder sin autenticación (debe fallar)');
    console.log('3. Login como usuario normal (debe ver solo su perfil)');
    console.log('4. Login como Admin/Director (debe ver todos los perfiles)');
    
  } catch (error) {
    console.error('💥 Error durante la aplicación:', error);
    process.exit(1);
  }
}

// Ejecutar aplicación
applyRLSFinal();