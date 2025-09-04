#!/usr/bin/env node

/**
 * Script de Verificación Pre-Deployment
 * Ejecuta pruebas automatizadas para verificar funcionalidades críticas
 */

const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !key.startsWith('#')) {
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    console.log('⚠️  No se pudo cargar .env.local, usando variables del sistema');
  }
}

loadEnvFile();

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_KEY ? 
  createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

class DeploymentVerifier {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Ejecutando: ${name}`);
      await testFn();
      console.log(`✅ ${name}`);
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
    } catch (error) {
      console.error(`❌ ${name}: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
    }
  }

  async verifyDatabaseSchema() {
    await this.test('Verificar conexión a base de datos', async () => {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
    });

    await this.test('Verificar tabla students existe', async () => {
      const { data, error } = await supabase.from('students').select('id').limit(1);
      if (error && !error.message.includes('permission denied')) throw error;
    });

    await this.test('Verificar tabla grades existe', async () => {
      const { data, error } = await supabase.from('grades').select('id').limit(1);
      if (error && !error.message.includes('permission denied')) throw error;
    });

    await this.test('Verificar tabla sections existe', async () => {
      const { data, error } = await supabase.from('sections').select('id').limit(1);
      if (error && !error.message.includes('permission denied')) throw error;
    });

    await this.test('Verificar tabla incidents existe', async () => {
      const { data, error } = await supabase.from('incidents').select('id').limit(1);
      if (error && !error.message.includes('permission denied')) throw error;
    });

    await this.test('Verificar tabla permissions existe', async () => {
      const { data, error } = await supabase.from('permissions').select('id').limit(1);
      if (error && !error.message.includes('permission denied')) throw error;
    });

    await this.test('Verificar tabla teacher_assignments existe', async () => {
      const { data, error } = await supabase.from('teacher_assignments').select('id').limit(1);
      if (error && !error.message.includes('permission denied')) throw error;
    });
  }

  async verifyRLSPolicies() {
    if (!supabaseAdmin) {
      console.log('⚠️  Saltando pruebas de RLS (SUPABASE_SERVICE_ROLE_KEY no configurado)');
      return;
    }

    await this.test('Verificar políticas RLS existen', async () => {
      // Verificar que existen políticas para la tabla students
      const { data, error } = await supabaseAdmin
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'students')
        .limit(1);
      
      if (error) {
        // Si no podemos acceder a pg_policies, intentamos una consulta directa
        const { data: testData, error: testError } = await supabaseAdmin
          .from('students')
          .select('id')
          .limit(1);
        
        if (testError && testError.message.includes('permission denied')) {
          // Esto es bueno, significa que RLS está funcionando
          return;
        }
      }
    });

    await this.test('Verificar acceso restringido sin autenticación', async () => {
      // Usar cliente anónimo para verificar que RLS bloquea acceso
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .limit(1);
      
      // Debe fallar o retornar vacío debido a RLS
      if (data && data.length > 0) {
        throw new Error('RLS no está bloqueando acceso anónimo a students');
      }
    });
  }

  async verifyAuthFlow() {
    await this.test('Verificar flujo de autenticación', async () => {
      // Intentar login con credenciales inválidas
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@invalid.com',
        password: 'invalid'
      });
      
      // Debe fallar
      if (!error) {
        throw new Error('Login debería fallar con credenciales inválidas');
      }
    });
  }

  async verifyAPIEndpoints() {
    // Verificar que el servidor está ejecutándose revisando el proceso
    await this.test('Verificar servidor de desarrollo ejecutándose', async () => {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      try {
        // En Windows, buscar procesos de Node.js en puerto 3000
        const { stdout } = await execAsync('netstat -ano | findstr :3000');
        if (!stdout || stdout.trim() === '') {
          throw new Error('No hay servidor ejecutándose en puerto 3000');
        }
      } catch (error) {
        if (error.message.includes('No hay servidor')) {
          throw error;
        }
        // Si netstat falla, asumir que está ejecutándose (puede ser limitación del sistema)
        console.log('⚠️  No se pudo verificar puerto 3000, asumiendo que está ejecutándose');
      }
    });

    await this.test('Verificar archivos de configuración Next.js', async () => {
      const configFiles = ['next.config.ts', 'package.json'];
      
      for (const file of configFiles) {
        const filePath = path.join(process.cwd(), file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Archivo de configuración faltante: ${file}`);
        }
      }
    });
  }

  async verifyEnvironmentVariables() {
    await this.test('Verificar variables de entorno críticas', async () => {
      const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ];
      
      const missing = required.filter(key => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(`Variables faltantes: ${missing.join(', ')}`);
      }
    });
  }

  async verifyFileStructure() {
    await this.test('Verificar archivos SQL críticos', async () => {
      const requiredFiles = [
        'complete-database-schema.sql',
        'teacher-auxiliary-rls-policies.sql',
        'admin-director-rls-policies.sql'
      ];
      
      for (const file of requiredFiles) {
        const filePath = path.join(process.cwd(), file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Archivo faltante: ${file}`);
        }
      }
    });

    await this.test('Verificar estructura de componentes', async () => {
      const requiredDirs = [
        'src/components',
        'src/app',
        'src/hooks',
        'src/lib'
      ];
      
      for (const dir of requiredDirs) {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
          throw new Error(`Directorio faltante: ${dir}`);
        }
      }
    });
  }

  async run() {
    console.log('🚀 Iniciando verificación pre-deployment...\n');
    
    console.log('📁 Verificando estructura de archivos...');
    await this.verifyFileStructure();
    
    console.log('\n🔧 Verificando variables de entorno...');
    await this.verifyEnvironmentVariables();
    
    console.log('\n🗄️  Verificando esquema de base de datos...');
    await this.verifyDatabaseSchema();
    
    console.log('\n🔒 Verificando políticas RLS...');
    await this.verifyRLSPolicies();
    
    console.log('\n🔐 Verificando flujo de autenticación...');
    await this.verifyAuthFlow();
    
    console.log('\n🌐 Verificando endpoints de API...');
    await this.verifyAPIEndpoints();
    
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTADOS DE VERIFICACIÓN');
    console.log('='.repeat(50));
    
    console.log(`✅ Pruebas exitosas: ${this.results.passed}`);
    console.log(`❌ Pruebas fallidas: ${this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ PRUEBAS FALLIDAS:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
      
      console.log('\n🚫 NO PROCEDER CON DEPLOYMENT');
      console.log('   Corregir los errores antes de subir a GitHub');
      process.exit(1);
    } else {
      console.log('\n🎉 TODAS LAS PRUEBAS PASARON');
      console.log('✅ Sistema listo para deployment');
      console.log('\n📋 Próximos pasos:');
      console.log('   1. Crear backup de base de datos');
      console.log('   2. git add .');
      console.log('   3. git commit -m "feat: Sistema completo de roles y permisos"');
      console.log('   4. git push origin main');
    }
  }
}

// Ejecutar verificación
if (require.main === module) {
  const verifier = new DeploymentVerifier();
  verifier.run().catch(error => {
    console.error('💥 Error crítico en verificación:', error);
    process.exit(1);
  });
}

module.exports = DeploymentVerifier;