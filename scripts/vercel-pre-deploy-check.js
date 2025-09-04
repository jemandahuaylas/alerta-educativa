#!/usr/bin/env node

/**
 * Script de verificación pre-deploy para Vercel
 * Ejecuta: node scripts/vercel-pre-deploy-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verificando compatibilidad con Vercel...\n');

let hasErrors = false;

// 1. Verificar variables de entorno requeridas
console.log('📋 1. Verificando variables de entorno...');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const envExamplePath = path.join(process.cwd(), '.env.example');
const envLocalPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envExamplePath)) {
  console.log('   ✅ .env.example encontrado');
} else {
  console.log('   ❌ .env.example no encontrado');
  hasErrors = true;
}

if (fs.existsSync(envLocalPath)) {
  console.log('   ✅ .env.local encontrado');
  
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  requiredEnvVars.forEach(varName => {
    if (envContent.includes(`${varName}=`)) {
      console.log(`   ✅ ${varName} definida`);
    } else {
      console.log(`   ❌ ${varName} faltante`);
      hasErrors = true;
    }
  });
} else {
  console.log('   ⚠️  .env.local no encontrado (normal en producción)');
}

// 2. Verificar archivos API problemáticos
console.log('\n🔧 2. Verificando archivos API...');
const apiDir = path.join(process.cwd(), 'src', 'app', 'api');

if (fs.existsSync(apiDir)) {
  const checkApiFile = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Verificar inicialización de clientes a nivel de módulo
    const moduleLevel = /^\s*const\s+\w*[Cc]lient\s*=\s*createClient/m.test(content);
    if (moduleLevel) {
      console.log(`   ❌ ${relativePath}: Cliente inicializado a nivel de módulo`);
      hasErrors = true;
    } else {
      console.log(`   ✅ ${relativePath}: Cliente inicializado correctamente`);
    }
    
    // Verificar manejo de errores
    const hasTryCatch = content.includes('try {') && content.includes('} catch');
    if (!hasTryCatch) {
      console.log(`   ⚠️  ${relativePath}: Sin manejo de errores try/catch`);
    }
  };
  
  const walkDir = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file === 'route.ts' || file === 'route.js') {
        checkApiFile(filePath);
      }
    });
  };
  
  walkDir(apiDir);
} else {
  console.log('   ⚠️  Directorio API no encontrado');
}

// 3. Verificar build
console.log('\n🏗️  3. Verificando build...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('   ✅ Build exitoso');
} catch (error) {
  console.log('   ❌ Build falló');
  console.log('   Error:', error.message);
  hasErrors = true;
}

// 4. Verificar TypeScript
console.log('\n📝 4. Verificando TypeScript...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('   ✅ TypeScript sin errores');
} catch (error) {
  console.log('   ❌ Errores de TypeScript encontrados');
  hasErrors = true;
}

// 5. Verificar vercel.json
console.log('\n⚙️  5. Verificando configuración de Vercel...');
const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
if (fs.existsSync(vercelConfigPath)) {
  console.log('   ✅ vercel.json encontrado');
  
  try {
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    if (config.functions && config.functions['src/app/api/**/*.ts']) {
      console.log('   ✅ Configuración de funciones API definida');
    } else {
      console.log('   ⚠️  Configuración de funciones API no encontrada');
    }
  } catch (error) {
    console.log('   ❌ vercel.json inválido');
    hasErrors = true;
  }
} else {
  console.log('   ⚠️  vercel.json no encontrado (opcional)');
}

// Resultado final
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ VERIFICACIÓN FALLIDA - Hay problemas que resolver');
  console.log('\n📖 Consulta VERCEL_DEPLOYMENT.md para soluciones');
  process.exit(1);
} else {
  console.log('✅ VERIFICACIÓN EXITOSA - Listo para deploy');
  console.log('\n🚀 Puedes hacer deploy con confianza');
  process.exit(0);
}