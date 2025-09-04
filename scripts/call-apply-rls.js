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

async function applyRLSPolicies() {
  console.log('🔧 APLICANDO POLÍTICAS RLS VIA API\n');
  
  try {
    // Verificar que el servidor esté corriendo
    const serverUrl = 'http://localhost:3000';
    
    console.log('1. 🌐 Verificando servidor...');
    
    try {
      const healthCheck = await fetch(`${serverUrl}/api/health`, {
        method: 'GET'
      });
      
      if (!healthCheck.ok) {
        throw new Error('Servidor no responde correctamente');
      }
      
      console.log('✅ Servidor funcionando correctamente');
    } catch (error) {
      console.log('⚠️ Servidor no disponible, intentando aplicar políticas...');
    }
    
    console.log('\n2. 🔐 Aplicando políticas RLS...');
    
    const response = await fetch(`${serverUrl}/api/admin/apply-rls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('\n📋 RESULTADOS DE LA APLICACIÓN:');
    
    if (result.success) {
      console.log('✅ Políticas RLS aplicadas exitosamente\n');
      
      // Mostrar detalles de cada paso
      result.results.forEach((step, index) => {
        const status = step.status === 'success' ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${step.step}`);
        
        if (step.policy) {
          console.log(`   Política: ${step.policy}`);
        }
        
        if (step.function) {
          console.log(`   Función: ${step.function}`);
        }
        
        if (step.message) {
          console.log(`   Mensaje: ${step.message}`);
        }
        
        console.log('');
      });
      
      console.log('🎉 APLICACIÓN COMPLETADA EXITOSAMENTE\n');
      
      console.log('📝 PRÓXIMOS PASOS:');
      console.log('1. Reiniciar el servidor de desarrollo si está corriendo');
      console.log('2. Probar el login con diferentes roles:');
      console.log('   - Admin: Debe ver todos los perfiles');
      console.log('   - Director: Debe ver todos los perfiles');
      console.log('   - Docente: Solo debe ver su propio perfil');
      console.log('3. Verificar que la interfaz se adapte según el rol');
      console.log('4. Confirmar que los permisos funcionan correctamente\n');
      
    } else {
      console.log('❌ Error aplicando políticas RLS:');
      console.log(result.error);
      
      if (result.results) {
        console.log('\nDetalles de los pasos ejecutados:');
        result.results.forEach((step, index) => {
          const status = step.status === 'success' ? '✅' : '❌';
          console.log(`${index + 1}. ${status} ${step.step}: ${step.message || 'Sin mensaje'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Error llamando a la API:', error.message);
    
    console.log('\n🔧 SOLUCIÓN ALTERNATIVA:');
    console.log('1. Asegúrate de que el servidor esté corriendo (npm run dev)');
    console.log('2. Ve al dashboard de Supabase: https://supabase.com/dashboard');
    console.log('3. Selecciona tu proyecto "Alerta Educativa"');
    console.log('4. Ve a "SQL Editor"');
    console.log('5. Ejecuta el contenido del archivo: fix-profiles-rls-policies.sql');
    console.log('6. Verifica que las políticas se aplicaron correctamente\n');
    
    process.exit(1);
  }
}

// Ejecutar aplicación de políticas
applyRLSPolicies();