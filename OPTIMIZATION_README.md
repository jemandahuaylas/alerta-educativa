# 🚀 Guía de Optimización para Planes Gratuitos

## Vercel + Supabase Free Tier Optimization Guide

Esta guía te ayudará a mantener tu aplicación React/Next.js + Supabase dentro de los límites de los planes gratuitos indefinidamente.

## 📊 Límites de Planes Gratuitos

### Vercel Free Tier
- **Bandwidth**: 100GB/mes
- **Serverless Functions**: 100GB-hrs/mes
- **Edge Functions**: 500KB código, 1M invocaciones/mes
- **Build Time**: 6000 minutos/mes
- **Deployments**: Ilimitados

### Supabase Free Tier
- **Database**: 500MB storage
- **Bandwidth**: 5GB/mes
- **Auth Users**: 50,000 MAU
- **Storage**: 1GB
- **Edge Functions**: 500KB código, 2M invocaciones/mes

## 🛠️ Configuración Rápida

### 1. Instalación Automática

```bash
# Ejecutar el script de configuración automática
node scripts/setup-optimizations.js

# O manualmente:
npm install @tanstack/react-query @tanstack/react-query-persist-client-core @tanstack/query-sync-storage-persister @next/bundle-analyzer lodash
npm install -D babel-plugin-transform-remove-console @types/lodash
```

### 2. Configuración Manual

Si prefieres configurar manualmente:

#### A. Actualizar `next.config.js`
```bash
cp next.config.optimized.js next.config.js
```

#### B. Configurar Middleware
```bash
cp middleware.optimized.ts middleware.ts
```

#### C. Configurar React Query
```bash
cp lib/optimizations/query-client.ts lib/react-query.ts
```

## 📁 Estructura de Archivos de Optimización

```
├── lib/optimizations/
│   └── query-client.ts          # Configuración optimizada de React Query
├── hooks/
│   └── use-optimized-data.ts     # Hooks optimizados para Supabase
├── components/monitoring/
│   └── ResourceMonitor.tsx       # Monitor de recursos en tiempo real
├── supabase/functions/
│   └── optimized-queries.sql     # Funciones RPC optimizadas
├── scripts/
│   ├── setup-optimizations.js    # Script de configuración automática
│   └── monitor-resources.js      # Script de monitoreo
├── middleware.optimized.ts       # Middleware con caché inteligente
├── next.config.optimized.js      # Configuración Next.js optimizada
└── optimization-guide.md         # Guía completa de optimización
```

## 🔧 Implementación Paso a Paso

### 1. Configurar React Query Provider

```tsx
// app/layout.tsx o pages/_app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { optimizedQueryClient } from '@/lib/react-query';

function MyApp({ Component, pageProps }) {
  return (
    <QueryClientProvider client={optimizedQueryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
```

### 2. Reemplazar Hooks Existentes

```tsx
// Antes
import { useStudents } from '@/hooks/use-students';

// Después
import { useStudentsOptimized } from '@/hooks/use-optimized-data';

function StudentsPage() {
  const { data: students, isLoading } = useStudentsOptimized({
    page: 1,
    limit: 20,
    filters: { active: true }
  });
  
  // ...
}
```

### 3. Implementar Funciones RPC en Supabase

```sql
-- Ejecutar en el SQL Editor de Supabase
-- Copiar y ejecutar el contenido de supabase/functions/optimized-queries.sql
```

### 4. Configurar Monitoreo

```tsx
// components/Dashboard.tsx
import { ResourceMonitor } from '@/components/monitoring/ResourceMonitor';

function Dashboard() {
  return (
    <div>
      {/* Tu contenido del dashboard */}
      
      {/* Monitor de recursos (solo en desarrollo o para admins) */}
      {process.env.NODE_ENV === 'development' && <ResourceMonitor />}
    </div>
  );
}
```

## 📈 Estrategias de Optimización

### 1. Frontend (React/Next.js)

#### Caché Agresivo
```tsx
// Configuración de React Query con caché persistente
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

#### Lazy Loading y Code Splitting
```tsx
// Componentes lazy
const Dashboard = lazy(() => import('@/components/Dashboard'));
const Students = lazy(() => import('@/components/Students'));

// Rutas con Suspense
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

#### Optimización de Imágenes
```tsx
// next.config.js
module.exports = {
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 año
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
};
```

### 2. Backend (Supabase)

#### Batch Operations
```tsx
// Operaciones en lote para reducir llamadas
const { mutate: batchUpdateStudents } = useMutation({
  mutationFn: async (updates: StudentUpdate[]) => {
    const { data } = await supabase.rpc('batch_update_students', {
      updates: updates
    });
    return data;
  },
});
```

#### RPC Functions para Consultas Complejas
```sql
-- Función RPC para estadísticas del dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_students', (SELECT COUNT(*) FROM students),
    'active_incidents', (SELECT COUNT(*) FROM incidents WHERE status = 'active'),
    'desertion_rate', (SELECT ROUND(AVG(desertion_rate), 2) FROM sections)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### Row Level Security (RLS)
```sql
-- Políticas RLS eficientes
CREATE POLICY "Users can view own data" ON students
  FOR SELECT USING (auth.uid() = teacher_id);
```

### 3. Serverless Functions

#### Edge Functions para Operaciones Ligeras
```typescript
// supabase/functions/quick-stats/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // Operación ligera y rápida
  const stats = await getQuickStats();
  
  return new Response(
    JSON.stringify(stats),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

## 📊 Monitoreo y Alertas

### 1. Métricas Clave

```tsx
// hooks/use-resource-monitoring.ts
export function useResourceMonitoring() {
  return useQuery({
    queryKey: ['resource-usage'],
    queryFn: async () => {
      // Obtener métricas de Vercel y Supabase
      const [vercelUsage, supabaseUsage] = await Promise.all([
        getVercelUsage(),
        getSupabaseUsage()
      ]);
      
      return { vercel: vercelUsage, supabase: supabaseUsage };
    },
    refetchInterval: 5 * 60 * 1000, // Cada 5 minutos
  });
}
```

### 2. Alertas Automáticas

```typescript
// utils/alerts.ts
export function checkResourceThresholds(usage: ResourceUsage) {
  const alerts = [];
  
  if (usage.bandwidth > 80) {
    alerts.push({
      type: 'warning',
      message: 'Bandwidth usage above 80%',
      action: 'Consider optimizing images and enabling compression'
    });
  }
  
  if (usage.database > 400) {
    alerts.push({
      type: 'critical',
      message: 'Database size above 400MB',
      action: 'Clean up old data or optimize storage'
    });
  }
  
  return alerts;
}
```

## 🎯 Scripts de Utilidad

### 1. Análisis de Bundle
```bash
# Analizar tamaño del bundle
npm run analyze

# Monitorear recursos
npm run monitor:resources

# Build optimizado
npm run build:optimized
```

### 2. Limpieza de Caché
```bash
# Limpiar caché de Next.js
npm run clean

# Limpiar caché de React Query
# (Se hace automáticamente cada 24 horas)
```

## ⚠️ Mejores Prácticas

### 1. Desarrollo
- ✅ Usar React Query para todas las llamadas a Supabase
- ✅ Implementar paginación en todas las listas
- ✅ Usar RPC functions para consultas complejas
- ✅ Optimizar imágenes con Next.js Image
- ✅ Implementar lazy loading
- ❌ No usar Realtime a menos que sea crítico
- ❌ No hacer consultas en loops
- ❌ No cargar datos innecesarios

### 2. Producción
- ✅ Habilitar compresión gzip
- ✅ Configurar caché headers apropiados
- ✅ Usar CDN para assets estáticos
- ✅ Monitorear métricas regularmente
- ✅ Implementar error boundaries
- ❌ No incluir console.log en producción
- ❌ No cargar librerías innecesarias

### 3. Base de Datos
- ✅ Crear índices para consultas frecuentes
- ✅ Usar RLS policies eficientes
- ✅ Implementar soft deletes
- ✅ Archivar datos antiguos
- ❌ No hacer SELECT * sin LIMIT
- ❌ No crear índices innecesarios

## 🚨 Señales de Alerta

### Vercel
- Bandwidth > 80GB/mes
- Function execution time > 80GB-hrs/mes
- Build time > 5000 minutos/mes

### Supabase
- Database size > 400MB
- Bandwidth > 4GB/mes
- MAU > 40,000 usuarios
- Storage > 800MB

## 🔄 Mantenimiento Regular

### Semanal
- [ ] Revisar métricas de uso
- [ ] Limpiar logs antiguos
- [ ] Verificar performance de queries

### Mensual
- [ ] Analizar bundle size
- [ ] Revisar y optimizar imágenes
- [ ] Archivar datos antiguos
- [ ] Actualizar dependencias

### Trimestral
- [ ] Auditoría completa de performance
- [ ] Revisión de arquitectura
- [ ] Optimización de base de datos
- [ ] Evaluación de nuevas tecnologías

## 📞 Soporte y Recursos

- **Documentación Vercel**: https://vercel.com/docs
- **Documentación Supabase**: https://supabase.com/docs
- **React Query**: https://tanstack.com/query/latest
- **Next.js Performance**: https://nextjs.org/docs/advanced-features/measuring-performance

## 🎉 Conclusión

Siguiendo esta guía, tu aplicación debería mantenerse cómodamente dentro de los límites de los planes gratuitos mientras mantiene un excelente rendimiento y experiencia de usuario.

**¡Recuerda**: La optimización es un proceso continuo. Monitorea regularmente y ajusta según sea necesario.