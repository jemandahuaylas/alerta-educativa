#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Verificación Pre-Despliegue - Alerta Educativa\n');

const checks = [
  {
    name: 'Verificar package.json',
    check: () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.scripts && packageJson.scripts.build && packageJson.scripts.start;
    },
    message: 'Scripts de build y start configurados'
  },
  {
    name: 'Verificar next.config.ts',
    check: () => fs.existsSync('next.config.ts'),
    message: 'Configuración de Next.js presente'
  },
  {
    name: 'Verificar vercel.json',
    check: () => fs.existsSync('vercel.json'),
    message: 'Configuración de Vercel presente'
  },
  {
    name: 'Verificar .env.example',
    check: () => fs.existsSync('.env.example'),
    message: 'Archivo de ejemplo de variables de entorno presente'
  },
  {
    name: 'Verificar variables de entorno locales',
    check: () => {
      if (!fs.existsSync('.env.local')) return false;
      const envContent = fs.readFileSync('.env.local', 'utf8');
      return envContent.includes('NEXT_PUBLIC_SUPABASE_URL') && 
             envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    },
    message: 'Variables de entorno de Supabase configuradas'
  },
  {
    name: 'Verificar dependencias',
    check: () => {
      try {
        execSync('npm ls --depth=0', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    message: 'Todas las dependencias instaladas correctamente'
  },
  {
    name: 'Verificar build',
    check: () => {
      try {
        console.log('   Ejecutando build...');
        execSync('npm run build', { stdio: 'pipe' });
        return fs.existsSync('.next');
      } catch (error) {
        console.log('   Error en build:', error.message);
        return false;
      }
    },
    message: 'Build de producción exitoso'
  },
  {
    name: 'Verificar archivos críticos',
    check: () => {
      const criticalFiles = [
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/app/(auth)/login/page.tsx',
        'src/components/ui',
        'src/lib/supabase'
      ];
      return criticalFiles.every(file => fs.existsSync(file));
    },
    message: 'Archivos críticos de la aplicación presentes'
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  process.stdout.write(`${index + 1}. ${check.name}... `);
  
  try {
    const result = check.check();
    if (result) {
      console.log('✅ PASS');
      console.log(`   ${check.message}`);
    } else {
      console.log('❌ FAIL');
      console.log(`   ${check.message}`);
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ ERROR');
    console.log(`   Error: ${error.message}`);
    allPassed = false;
  }
  
  console.log('');
});

if (allPassed) {
  console.log('🎉 ¡Todas las verificaciones pasaron! Tu aplicación está lista para desplegar en Vercel.\n');
  console.log('📋 Próximos pasos:');
  console.log('1. Sube tu código a GitHub');
  console.log('2. Conecta tu repositorio en Vercel');
  console.log('3. Configura las variables de entorno en Vercel');
  console.log('4. Despliega tu aplicación');
  console.log('\n📖 Consulta DEPLOYMENT_GUIDE.md para instrucciones detalladas.');
} else {
  console.log('⚠️  Algunas verificaciones fallaron. Por favor, revisa los errores antes de desplegar.');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('Verificación completada - ' + new Date().toLocaleString());
console.log('='.repeat(60));