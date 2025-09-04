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
  process.exit(1);
}

// Create clients
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseRLSIssue() {
  console.log('🔍 DIAGNÓSTICO DE POLÍTICAS RLS\n');
  
  try {
    // 1. Verificar políticas RLS existentes
    console.log('1. 📋 VERIFICANDO POLÍTICAS RLS EXISTENTES:');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');
    
    if (policiesError) {
      console.error('❌ Error obteniendo políticas:', policiesError);
    } else {
      console.log(`✅ Encontradas ${policies.length} políticas para la tabla profiles:`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
        console.log(`     Condición: ${policy.qual || 'N/A'}`);
        console.log(`     Check: ${policy.with_check || 'N/A'}\n`);
      });
    }
    
    // 2. Verificar funciones de utilidad
    console.log('2. 🔧 VERIFICANDO FUNCIONES DE UTILIDAD:');
    const functions = ['is_admin_user', 'can_manage_profiles', 'is_admin_only', 'is_management_role'];
    
    for (const funcName of functions) {
      const { data: funcExists, error: funcError } = await supabaseAdmin
        .rpc('pg_get_function_def', { function_oid: `${funcName}()` })
        .single();
      
      if (funcError) {
        console.log(`❌ Función ${funcName}: NO EXISTE o ERROR`);
      } else {
        console.log(`✅ Función ${funcName}: EXISTE`);
      }
    }
    
    // 3. Verificar perfiles existentes
    console.log('\n3. 👥 VERIFICANDO PERFILES EXISTENTES (como admin):');
    const { data: allProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role')
      .order('role');
    
    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError);
    } else {
      console.log(`✅ Total de perfiles: ${allProfiles.length}`);
      const roleCount = {};
      allProfiles.forEach(profile => {
        roleCount[profile.role] = (roleCount[profile.role] || 0) + 1;
        console.log(`   - ${profile.name} (${profile.email}) - Rol: ${profile.role}`);
      });
      
      console.log('\n📊 Distribución por roles:');
      Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`   - ${role}: ${count} usuario(s)`);
      });
    }
    
    // 4. Simular acceso como usuario normal (sin autenticación)
    console.log('\n4. 🔒 SIMULANDO ACCESO COMO USUARIO ANÓNIMO:');
    const { data: anonProfiles, error: anonError } = await supabaseClient
      .from('profiles')
      .select('id, name, email, role');
    
    if (anonError) {
      console.log('❌ Error acceso anónimo (esperado):', anonError.message);
    } else {
      console.log(`⚠️ Acceso anónimo permitido - ${anonProfiles.length} perfiles visibles`);
    }
    
    // 5. Verificar RLS habilitado
    console.log('\n5. 🛡️ VERIFICANDO ESTADO DE RLS:');
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'profiles')
      .single();
    
    if (rlsError) {
      console.error('❌ Error verificando RLS:', rlsError);
    } else {
      console.log(`RLS habilitado en tabla profiles: ${rlsStatus.relrowsecurity ? '✅ SÍ' : '❌ NO'}`);
    }
    
    // 6. Verificar usuarios de auth
    console.log('\n6. 🔐 VERIFICANDO USUARIOS DE AUTH:');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error obteniendo usuarios auth:', authError);
    } else {
      console.log(`✅ Total usuarios auth: ${authUsers.users.length}`);
      authUsers.users.forEach(user => {
        const metadata = user.user_metadata || {};
        console.log(`   - ${user.email} (ID: ${user.id.substring(0, 8)}...) - Metadata: ${JSON.stringify(metadata)}`);
      });
    }
    
    // 7. Diagnóstico y recomendaciones
    console.log('\n🎯 DIAGNÓSTICO Y RECOMENDACIONES:');
    
    if (!rlsStatus?.relrowsecurity) {
      console.log('❌ PROBLEMA: RLS no está habilitado en la tabla profiles');
      console.log('   SOLUCIÓN: Ejecutar ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;');
    }
    
    if (policies.length === 0) {
      console.log('❌ PROBLEMA: No hay políticas RLS definidas');
      console.log('   SOLUCIÓN: Ejecutar el script fix-profiles-rls-policies.sql');
    }
    
    const hasAdminPolicy = policies.some(p => p.policyname.includes('admin'));
    if (!hasAdminPolicy) {
      console.log('❌ PROBLEMA: No hay políticas específicas para administradores');
      console.log('   SOLUCIÓN: Implementar políticas que permitan a admins ver todos los perfiles');
    }
    
    if (allProfiles.length > 0 && anonProfiles && anonProfiles.length > 0) {
      console.log('⚠️ ADVERTENCIA: Usuarios anónimos pueden ver perfiles');
      console.log('   SOLUCIÓN: Revisar políticas RLS para restringir acceso anónimo');
    }
    
    console.log('\n✅ Diagnóstico completado.');
    
  } catch (error) {
    console.error('💥 Error durante el diagnóstico:', error);
    process.exit(1);
  }
}

// Ejecutar diagnóstico
diagnoseRLSIssue();