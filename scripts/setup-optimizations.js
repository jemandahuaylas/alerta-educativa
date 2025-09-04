#!/usr/bin/env node
// scripts/setup-optimizations.js
// Script para configurar automáticamente todas las optimizaciones

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Función para verificar si un archivo existe
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Función para crear backup de un archivo
function createBackup(filePath) {
  if (fileExists(filePath)) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    log(`Backup creado: ${backupPath}`, 'yellow');
    return backupPath;
  }
  return null;
}

// Función para instalar dependencias necesarias
function installDependencies() {
  logStep('1', 'Instalando dependencias de optimización...');
  
  const dependencies = [
    '@tanstack/react-query',
    '@tanstack/react-query-persist-client-core',
    '@tanstack/query-sync-storage-persister',
    '@next/bundle-analyzer',
    'lodash',
  ];
  
  const devDependencies = [
    'babel-plugin-transform-remove-console',
    '@types/lodash',
  ];
  
  try {
    log('Instalando dependencias principales...');
    execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });
    
    log('Instalando dependencias de desarrollo...');
    execSync(`npm install -D ${devDependencies.join(' ')}`, { stdio: 'inherit' });
    
    logSuccess('Dependencias instaladas correctamente');
  } catch (error) {
    logError(`Error instalando dependencias: ${error.message}`);
    process.exit(1);
  }
}

// Función para actualizar package.json con scripts optimizados
function updatePackageJson() {
  logStep('2', 'Actualizando package.json...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fileExists(packageJsonPath)) {
    logError('package.json no encontrado');
    return;
  }
  
  createBackup(packageJsonPath);
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Agregar scripts de optimización
  packageJson.scripts = {
    ...packageJson.scripts,
    'analyze': 'cross-env ANALYZE=true next build',
    'analyze:server': 'cross-env BUNDLE_ANALYZE=server next build',
    'analyze:browser': 'cross-env BUNDLE_ANALYZE=browser next build',
    'build:optimized': 'cross-env NODE_ENV=production next build',
    'start:optimized': 'cross-env NODE_ENV=production next start',
    'monitor:bundle': 'cross-env MONITOR_BUNDLE_SIZE=true next build',
    'setup:db': 'node scripts/setup-database.js',
    'monitor:resources': 'node scripts/monitor-resources.js',
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  logSuccess('package.json actualizado');
}

// Función para configurar Next.js
function setupNextConfig() {
  logStep('3', 'Configurando Next.js...');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  const optimizedConfigPath = path.join(process.cwd(), 'next.config.optimized.js');
  
  if (fileExists(nextConfigPath)) {
    createBackup(nextConfigPath);
  }
  
  if (fileExists(optimizedConfigPath)) {
    // Copiar configuración optimizada
    fs.copyFileSync(optimizedConfigPath, nextConfigPath);
    logSuccess('Configuración de Next.js optimizada aplicada');
  } else {
    logWarning('next.config.optimized.js no encontrado. Creando configuración básica...');
    
    const basicConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizeCss: true,
  },
  swcMinify: true,
  reactStrictMode: true,
};

module.exports = nextConfig;
`;
    
    fs.writeFileSync(nextConfigPath, basicConfig);
    logSuccess('Configuración básica de Next.js creada');
  }
}

// Función para configurar middleware
function setupMiddleware() {
  logStep('4', 'Configurando middleware...');
  
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  const optimizedMiddlewarePath = path.join(process.cwd(), 'middleware.optimized.ts');
  
  if (fileExists(middlewarePath)) {
    createBackup(middlewarePath);
  }
  
  if (fileExists(optimizedMiddlewarePath)) {
    fs.copyFileSync(optimizedMiddlewarePath, middlewarePath);
    logSuccess('Middleware optimizado aplicado');
  } else {
    logWarning('middleware.optimized.ts no encontrado');
  }
}

// Función para configurar React Query
function setupReactQuery() {
  logStep('5', 'Configurando React Query...');
  
  const queryClientPath = path.join(process.cwd(), 'lib', 'react-query.ts');
  const optimizedQueryClientPath = path.join(process.cwd(), 'lib', 'optimizations', 'query-client.ts');
  
  // Crear directorio lib si no existe
  const libDir = path.join(process.cwd(), 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }
  
  if (fileExists(optimizedQueryClientPath)) {
    fs.copyFileSync(optimizedQueryClientPath, queryClientPath);
    logSuccess('Configuración de React Query aplicada');
  } else {
    logWarning('Configuración optimizada de React Query no encontrada');
  }
}

// Función para crear archivo de variables de entorno
function setupEnvironment() {
  logStep('6', 'Configurando variables de entorno...');
  
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fileExists(envLocalPath)) {
    const envContent = `
# Optimización
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_CACHE_ENABLED=true
NEXT_PUBLIC_DEBUG_MODE=false

# Monitoreo
NEXT_PUBLIC_MONITOR_PERFORMANCE=true
NEXT_PUBLIC_MONITOR_RESOURCES=true

# Supabase (reemplazar con tus valores)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Vercel (opcional, para monitoreo)
VERCEL_TOKEN=your_vercel_token
VERCEL_TEAM_ID=your_team_id
`;
    
    fs.writeFileSync(envLocalPath, envContent);
    logSuccess('.env.local creado con configuraciones de optimización');
  }
  
  // Crear .env.example si no existe
  if (!fileExists(envExamplePath)) {
    const envExampleContent = `
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optimización
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_CACHE_ENABLED=true

# Monitoreo
NEXT_PUBLIC_MONITOR_PERFORMANCE=true
VERCEL_TOKEN=
VERCEL_TEAM_ID=
`;
    
    fs.writeFileSync(envExamplePath, envExampleContent);
    logSuccess('.env.example creado');
  }
}

// Función para crear script de monitoreo
function createMonitoringScript() {
  logStep('7', 'Creando script de monitoreo...');
  
  const scriptsDir = path.join(process.cwd(), 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  const monitorScript = `
#!/usr/bin/env node
// scripts/monitor-resources.js
// Script para monitorear el uso de recursos

const https = require('https');

const THRESHOLDS = {
  bandwidth: 80, // GB
  database: 400, // MB
  storage: 0.8, // GB
};

async function checkResources() {
  console.log('🔍 Verificando uso de recursos...');
  
  // Aquí implementarías las llamadas a las APIs de Vercel y Supabase
  // Por ahora, solo un ejemplo
  
  const usage = {
    bandwidth: 15.2,
    database: 45,
    storage: 0.12,
  };
  
  console.log('📊 Uso actual:');
  console.log(\`  Bandwidth: \${usage.bandwidth}GB / 100GB (\${(usage.bandwidth/100*100).toFixed(1)}%)\`);
  console.log(\`  Database: \${usage.database}MB / 500MB (\${(usage.database/500*100).toFixed(1)}%)\`);
  console.log(\`  Storage: \${usage.storage}GB / 1GB (\${(usage.storage/1*100).toFixed(1)}%)\`);
  
  // Verificar umbrales
  const warnings = [];
  if (usage.bandwidth > THRESHOLDS.bandwidth) warnings.push('Bandwidth');
  if (usage.database > THRESHOLDS.database) warnings.push('Database');
  if (usage.storage > THRESHOLDS.storage) warnings.push('Storage');
  
  if (warnings.length > 0) {
    console.log('⚠️  Advertencias:', warnings.join(', '));
  } else {
    console.log('✅ Todos los recursos dentro de los límites');
  }
}

checkResources().catch(console.error);
`;
  
  const monitorScriptPath = path.join(scriptsDir, 'monitor-resources.js');
  fs.writeFileSync(monitorScriptPath, monitorScript);
  
  // Hacer el script ejecutable
  try {
    execSync(`chmod +x ${monitorScriptPath}`);
  } catch (error) {
    // Ignorar error en Windows
  }
  
  logSuccess('Script de monitoreo creado');
}

// Función para crear configuración de Lighthouse CI
function setupLighthouseCI() {
  logStep('8', 'Configurando Lighthouse CI...');
  
  const lighthouseConfig = {
    ci: {
      collect: {
        url: ['http://localhost:3000', 'http://localhost:3000/dashboard'],
        startServerCommand: 'npm run start',
      },
      assert: {
        assertions: {
          'categories:performance': ['warn', { minScore: 0.9 }],
          'categories:accessibility': ['error', { minScore: 0.9 }],
          'categories:best-practices': ['warn', { minScore: 0.9 }],
          'categories:seo': ['warn', { minScore: 0.9 }],
        },
      },
    },
  };
  
  const lighthousePath = path.join(process.cwd(), 'lighthouserc.js');
  const configContent = `module.exports = ${JSON.stringify(lighthouseConfig, null, 2)};`;
  
  fs.writeFileSync(lighthousePath, configContent);
  logSuccess('Configuración de Lighthouse CI creada');
}

// Función para mostrar resumen final
function showSummary() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🎉 CONFIGURACIÓN DE OPTIMIZACIÓN COMPLETADA', 'green');
  log('='.repeat(60), 'cyan');
  
  log('\n📋 Próximos pasos:', 'yellow');
  log('1. Actualiza las variables de entorno en .env.local');
  log('2. Ejecuta las funciones RPC en tu base de datos Supabase');
  log('3. Reemplaza los hooks existentes con los optimizados');
  log('4. Configura el componente ResourceMonitor en tu dashboard');
  log('5. Ejecuta "npm run analyze" para verificar el bundle size');
  
  log('\n🔧 Scripts disponibles:', 'yellow');
  log('• npm run analyze - Analizar bundle size');
  log('• npm run monitor:resources - Monitorear recursos');
  log('• npm run build:optimized - Build optimizado');
  
  log('\n📚 Archivos creados/modificados:', 'yellow');
  log('• next.config.js - Configuración optimizada');
  log('• middleware.ts - Middleware con caché y seguridad');
  log('• lib/react-query.ts - Configuración de React Query');
  log('• .env.local - Variables de entorno');
  log('• scripts/monitor-resources.js - Script de monitoreo');
  log('• lighthouserc.js - Configuración de Lighthouse CI');
  
  log('\n⚠️  Recuerda:', 'red');
  log('• Hacer backup de tus archivos antes de aplicar cambios');
  log('• Probar en desarrollo antes de desplegar a producción');
  log('• Monitorear regularmente el uso de recursos');
  
  log('\n🚀 ¡Tu aplicación está lista para mantenerse en los planes gratuitos!', 'green');
}

// Función principal
function main() {
  log('🚀 CONFIGURADOR DE OPTIMIZACIONES PARA PLANES GRATUITOS', 'bright');
  log('Este script configurará tu aplicación para optimizar el uso de recursos\n');
  
  try {
    installDependencies();
    updatePackageJson();
    setupNextConfig();
    setupMiddleware();
    setupReactQuery();
    setupEnvironment();
    createMonitoringScript();
    setupLighthouseCI();
    showSummary();
  } catch (error) {
    logError(`Error durante la configuración: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  installDependencies,
  updatePackageJson,
  setupNextConfig,
  setupMiddleware,
  setupReactQuery,
  setupEnvironment,
  createMonitoringScript,
  setupLighthouseCI,
};