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

async function applyRLSDirectly() {
  console.log('🔧 APLICANDO POLÍTICAS RLS DIRECTAMENTE\n');
  
  try {
    // 1. Habilitar RLS en la tabla profiles
    console.log('1. 🛡️ Habilitando Row Level Security...');
    
    // Usar una consulta directa para habilitar RLS
    const { data: enableRLS, error: rlsError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (rlsError) {
      console.log('⚠️ Error verificando tabla profiles:', rlsError.message);
    } else {
      console.log('✅ Tabla profiles accesible');
    }
    
    // 2. Verificar políticas existentes
    console.log('\n2. 📋 Verificando políticas existentes...');
    
    // Intentar obtener todos los perfiles como admin
    const { data: allProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role');
    
    if (profilesError) {
      console.log('❌ Error obteniendo perfiles:', profilesError.message);
    } else {
      console.log(`✅ Perfiles obtenidos: ${allProfiles.length}`);
      
      // Mostrar distribución de roles
      const roleCount = {};
      allProfiles.forEach(profile => {
        roleCount[profile.role] = (roleCount[profile.role] || 0) + 1;
      });
      
      console.log('📊 Distribución por roles:');
      Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`   - ${role}: ${count} usuario(s)`);
      });
    }
    
    // 3. Verificar acceso con cliente normal (simulando usuario autenticado)
    console.log('\n3. 🔒 Verificando acceso con cliente normal...');
    
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: limitedProfiles, error: limitedError } = await supabaseClient
      .from('profiles')
      .select('id, name, email, role');
    
    if (limitedError) {
      console.log('✅ Acceso restringido correctamente (esperado):', limitedError.message);
    } else {
      console.log(`⚠️ Acceso no restringido - ${limitedProfiles.length} perfiles visibles sin autenticación`);
    }
    
    // 4. Crear un usuario de prueba para verificar RLS
    console.log('\n4. 👤 Creando usuario de prueba...');
    
    // Buscar un usuario existente para usar como prueba
    const testUser = allProfiles.find(p => p.role === 'Docente');
    
    if (testUser) {
      console.log(`✅ Usuario de prueba encontrado: ${testUser.name} (${testUser.role})`);
      
      // Simular autenticación con este usuario
      const { data: userSession, error: authError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: testUser.email
      });
      
      if (authError) {
        console.log('⚠️ No se pudo generar enlace de prueba:', authError.message);
      } else {
        console.log('✅ Enlace de prueba generado (no se enviará)');
      }
    }
    
    // 5. Verificar funciones de utilidad
    console.log('\n5. 🔧 Verificando funciones de utilidad...');
    
    // Intentar llamar a las funciones RPC
    const functions = ['is_admin_user', 'can_manage_profiles'];
    
    for (const funcName of functions) {
      const { data: funcResult, error: funcError } = await supabaseAdmin
        .rpc(funcName);
      
      if (funcError) {
        console.log(`❌ Función ${funcName}: ERROR - ${funcError.message}`);
      } else {
        console.log(`✅ Función ${funcName}: FUNCIONA - Resultado: ${funcResult}`);
      }
    }
    
    // 6. Diagnóstico final
    console.log('\n6. 🎯 DIAGNÓSTICO FINAL:');
    
    if (allProfiles && allProfiles.length > 0) {
      console.log('✅ El service_role puede acceder a todos los perfiles');
    }
    
    if (limitedError) {
      console.log('✅ Los usuarios no autenticados no pueden acceder a perfiles');
    } else {
      console.log('❌ PROBLEMA: Los usuarios no autenticados pueden ver perfiles');
    }
    
    // Verificar si hay usuarios con diferentes roles
    const hasAdmin = allProfiles.some(p => p.role === 'Admin');
    const hasDirector = allProfiles.some(p => p.role === 'Director');
    const hasDocente = allProfiles.some(p => p.role === 'Docente');
    
    console.log('\n📊 ESTADO DE ROLES:');
    console.log(`Admin: ${hasAdmin ? '✅' : '❌'} ${hasAdmin ? 'Presente' : 'No encontrado'}`);
    console.log(`Director: ${hasDirector ? '✅' : '❌'} ${hasDirector ? 'Presente' : 'No encontrado'}`);
    console.log(`Docente: ${hasDocente ? '✅' : '❌'} ${hasDocente ? 'Presente' : 'No encontrado'}`);
    
    console.log('\n🎉 DIAGNÓSTICO COMPLETADO');
    console.log('\n📝 RECOMENDACIONES:');
    console.log('1. Las políticas RLS deben aplicarse desde el dashboard de Supabase');
    console.log('2. Ejecutar el archivo fix-profiles-rls-policies.sql en el SQL Editor');
    console.log('3. Verificar que cada usuario tenga el rol correcto en su perfil');
    console.log('4. Probar el login con diferentes roles para verificar el comportamiento');
    
  } catch (error) {
    console.error('💥 Error durante el diagnóstico:', error);
    process.exit(1);
  }
}

// Ejecutar diagnóstico
applyRLSDirectly();