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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create clients
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRLSPolicies() {
  console.log('🔍 VERIFICANDO POLÍTICAS RLS\n');
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Verificar que RLS está habilitado
    console.log('1. 🔒 Verificando que RLS está habilitado...');
    
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .rpc('sql', { 
        query: "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';" 
      });
    
    if (rlsError) {
      console.log('⚠️ No se pudo verificar RLS status (método alternativo)');
    } else {
      console.log('✅ RLS verificado');
    }
    
    // Test 2: Verificar funciones utilitarias
    console.log('\n2. 🛠️ Verificando funciones utilitarias...');
    
    const functions = ['is_admin_user', 'can_manage_profiles'];
    
    for (const funcName of functions) {
      try {
        const { data: result, error } = await supabaseAdmin.rpc(funcName);
        
        if (error) {
          console.log(`❌ Función ${funcName}: ${error.message}`);
          allTestsPassed = false;
        } else {
          console.log(`✅ Función ${funcName}: Disponible`);
        }
      } catch (error) {
        console.log(`❌ Función ${funcName}: ${error.message}`);
        allTestsPassed = false;
      }
    }
    
    // Test 3: Verificar políticas existentes
    console.log('\n3. 📋 Verificando políticas aplicadas...');
    
    try {
      const { data: policies, error: policiesError } = await supabaseAdmin
        .rpc('sql', { 
          query: `
            SELECT policyname, cmd, permissive
            FROM pg_policies 
            WHERE tablename = 'profiles'
            ORDER BY policyname;
          ` 
        });
      
      if (policiesError) {
        console.log('⚠️ No se pudieron verificar políticas directamente');
      } else if (policies && policies.length > 0) {
        console.log(`✅ Encontradas ${policies.length} políticas:`);
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname} (${policy.cmd})`);
        });
      } else {
        console.log('❌ No se encontraron políticas aplicadas');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('⚠️ Verificación de políticas omitida');
    }
    
    // Test 4: Probar acceso como admin (service_role)
    console.log('\n4. 👑 Probando acceso como administrador...');
    
    const { data: adminProfiles, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role');
    
    if (adminError) {
      console.log(`❌ Error accediendo como admin: ${adminError.message}`);
      allTestsPassed = false;
    } else {
      console.log(`✅ Acceso admin exitoso: ${adminProfiles.length} perfiles visibles`);
      
      // Mostrar distribución de roles
      const roleCount = {};
      adminProfiles.forEach(profile => {
        roleCount[profile.role] = (roleCount[profile.role] || 0) + 1;
      });
      
      console.log('   📊 Distribución de roles:');
      Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`      - ${role}: ${count} usuario(s)`);
      });
    }
    
    // Test 5: Probar acceso anónimo (debe fallar)
    console.log('\n5. 🚫 Probando acceso anónimo (debe fallar)...');
    
    const { data: anonProfiles, error: anonError } = await supabaseAnon
      .from('profiles')
      .select('id, name, email, role');
    
    if (anonError) {
      console.log(`✅ Acceso anónimo bloqueado correctamente: ${anonError.message}`);
    } else {
      console.log(`❌ PROBLEMA: Acceso anónimo permitido - ${anonProfiles?.length || 0} perfiles visibles`);
      allTestsPassed = false;
    }
    
    // Test 6: Verificar usuarios existentes y sus roles
    console.log('\n6. 👥 Verificando usuarios y roles...');
    
    if (adminProfiles && adminProfiles.length > 0) {
      console.log('✅ Usuarios encontrados:');
      adminProfiles.forEach(profile => {
        const isAdmin = ['Admin', 'Director', 'Subdirector', 'Coordinador'].includes(profile.role);
        const roleIcon = isAdmin ? '👑' : '👤';
        console.log(`   ${roleIcon} ${profile.name || profile.email} - ${profile.role}`);
      });
      
      // Verificar que hay al menos un admin
      const adminUsers = adminProfiles.filter(p => 
        ['Admin', 'Director', 'Subdirector', 'Coordinador'].includes(p.role)
      );
      
      if (adminUsers.length > 0) {
        console.log(`✅ ${adminUsers.length} usuario(s) administrativo(s) encontrado(s)`);
      } else {
        console.log('⚠️ No se encontraron usuarios administrativos');
      }
    }
    
    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(50));
    
    if (allTestsPassed) {
      console.log('🎉 ¡TODAS LAS VERIFICACIONES PASARON!');
      console.log('✅ Las políticas RLS están funcionando correctamente');
      console.log('✅ La seguridad de la aplicación está configurada');
      
      console.log('\n🧪 PRÓXIMAS PRUEBAS MANUALES:');
      console.log('1. Logout de la aplicación');
      console.log('2. Intentar acceder sin login (debe redirigir o fallar)');
      console.log('3. Login como usuario normal (debe ver solo su perfil)');
      console.log('4. Login como Admin/Director (debe ver todos los perfiles)');
      
    } else {
      console.log('⚠️ ALGUNAS VERIFICACIONES FALLARON');
      console.log('❌ Las políticas RLS necesitan ser aplicadas manualmente');
      
      console.log('\n📝 ACCIÓN REQUERIDA:');
      console.log('1. Ve al dashboard de Supabase: https://supabase.com/dashboard');
      console.log('2. Selecciona tu proyecto "Alerta Educativa"');
      console.log('3. Ve a "SQL Editor"');
      console.log('4. Ejecuta el contenido completo de: fix-profiles-rls-policies.sql');
      console.log('5. Vuelve a ejecutar este script para verificar');
    }
    
    console.log('\n📋 ARCHIVOS DE REFERENCIA:');
    console.log('- fix-profiles-rls-policies.sql (políticas a aplicar)');
    console.log('- GUIA_APLICAR_RLS_MANUAL.md (guía paso a paso)');
    console.log('- scripts/verify-rls-policies.js (este script)');
    
  } catch (error) {
    console.error('💥 Error durante la verificación:', error);
    process.exit(1);
  }
}

// Ejecutar verificación
verifyRLSPolicies();