# 🚀 Guía de Optimización: Mantener tu App Full-Stack en Planes Gratuitos

## 📊 Límites de los Planes Gratuitos

### Vercel (Hobby Plan)
- **Bandwidth**: 100GB/mes
- **Serverless Functions**: 100GB-Hrs/mes
- **Edge Functions**: 500KB código, 1M invocaciones/mes
- **Build Time**: 6,000 minutos/mes
- **Deployments**: Ilimitados

### Supabase (Free Tier)
- **Database**: 500MB storage
- **Auth**: 50,000 MAU (Monthly Active Users)
- **Storage**: 1GB
- **Edge Functions**: 500KB código, 2M invocaciones/mes
- **Realtime**: 200 conexiones concurrentes
- **API Requests**: Sin límite oficial, pero throttling después de uso intensivo

## 🎯 Estrategias de Optimización

### 1. 📦 Optimización del Frontend (Next.js)

#### A. Configuración de Next.js Optimizada

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compresión automática
  compress: true,
  
  // Optimización de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 año
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Optimización de bundle
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Headers de caché
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600', // 5min client, 10min CDN
          },
        ],
      },
    ];
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Tree shaking mejorado
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;
    
    return config;
  },
};

module.exports = nextConfig;
```

#### B. Lazy Loading y Code Splitting

```typescript
// components/LazyComponents.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading de componentes pesados
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false, // No renderizar en servidor si no es necesario
});

const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => <div>Cargando dashboard...</div>,
});

// Uso con Suspense
export function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminDashboard />
    </Suspense>
  );
}
```

#### C. Optimización de Re-renders

```typescript
// hooks/useOptimizedState.ts
import { useCallback, useMemo, memo } from 'react';
import { debounce } from 'lodash';

// Componente memoizado
const StudentCard = memo(({ student, onUpdate }: StudentCardProps) => {
  // Memoizar callbacks costosos
  const handleUpdate = useCallback(
    debounce((data) => onUpdate(student.id, data), 300),
    [student.id, onUpdate]
  );
  
  // Memoizar cálculos costosos
  const studentStats = useMemo(() => {
    return calculateStudentStats(student);
  }, [student.incidents, student.grades]);
  
  return (
    <Card>
      {/* Contenido del componente */}
    </Card>
  );
});

StudentCard.displayName = 'StudentCard';
```

### 2. 🗄️ Optimización de Supabase

#### A. Cliente Supabase Optimizado

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Reducir verificaciones automáticas
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Desactivar si no usas magic links
  },
  realtime: {
    // Configurar solo si necesitas realtime
    params: {
      eventsPerSecond: 2, // Limitar eventos
    },
  },
  global: {
    headers: {
      'x-client-info': 'alerta-educativa@1.0.0',
    },
  },
});

// Cliente para operaciones de solo lectura (más eficiente)
export const supabaseRead = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { disabled: true },
});
```

#### B. Queries Optimizadas

```typescript
// hooks/use-students-optimized.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseRead } from '@/lib/supabase/client';

// Query con caché inteligente
export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabaseRead
        .from('students')
        .select(`
          id,
          name,
          email,
          section_id,
          sections!inner(name, grade_id),
          incidents(count)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Paginación eficiente
export function useStudentsPaginated(page: number, pageSize: number = 20) {
  return useQuery({
    queryKey: ['students', 'paginated', page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await supabaseRead
        .from('students')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('name');
      
      if (error) throw error;
      return { data, count };
    },
    keepPreviousData: true, // Mantener datos anteriores mientras carga
    staleTime: 2 * 60 * 1000,
  });
}
```

#### C. Batch Operations

```typescript
// utils/batch-operations.ts
import { supabase } from '@/lib/supabase/client';

// Insertar múltiples registros en una sola query
export async function batchInsertIncidents(incidents: NewIncident[]) {
  const { data, error } = await supabase
    .from('incidents')
    .insert(incidents)
    .select();
  
  if (error) throw error;
  return data;
}

// Actualizar múltiples registros
export async function batchUpdateStudents(updates: StudentUpdate[]) {
  const promises = updates.map(update => 
    supabase
      .from('students')
      .update(update.data)
      .eq('id', update.id)
  );
  
  const results = await Promise.allSettled(promises);
  return results;
}

// Usar transacciones RPC para operaciones complejas
export async function createStudentWithIncident(studentData: any, incidentData: any) {
  const { data, error } = await supabase.rpc('create_student_with_incident', {
    student_data: studentData,
    incident_data: incidentData
  });
  
  if (error) throw error;
  return data;
}
```

### 3. 🚀 Optimización de Serverless Functions

#### A. Edge Functions Ligeras

```typescript
// pages/api/students/stats.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configurar como Edge Function
export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  // Caché en headers
  const cacheKey = `stats-${new Date().toISOString().split('T')[0]}`;
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Query optimizada con agregaciones en DB
    const { data, error } = await supabase.rpc('get_student_stats');
    
    if (error) throw error;
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'CDN-Cache-Control': 'public, max-age=600',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

#### B. Funciones RPC en Supabase

```sql
-- Crear función RPC para estadísticas (ejecuta en DB, no en serverless)
CREATE OR REPLACE FUNCTION get_student_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_students', (SELECT COUNT(*) FROM students),
    'pending_incidents', (SELECT COUNT(*) FROM incidents WHERE status = 'Pendiente'),
    'high_risk_students', (SELECT COUNT(*) FROM risk_assessments WHERE level = 'High'),
    'total_dropouts', (SELECT COUNT(*) FROM desertion_records)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. 💾 Estrategias de Caché

#### A. React Query Setup

```typescript
// lib/react-query.ts
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

// Persistir caché en localStorage
const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : null,
  key: 'alerta-educativa-cache',
});

if (typeof window !== 'undefined') {
  persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  });
}

export { queryClient };
```

#### B. Caché de Imágenes y Assets

```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({ src, alt, width, height, priority = false }: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div className="relative overflow-hidden">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={75} // Reducir calidad para ahorrar bandwidth
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        onLoad={() => setIsLoading(false)}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}
```

### 5. 🔐 Autenticación Optimizada

#### A. Session Management

```typescript
// hooks/use-auth-optimized.ts
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export function useAuthOptimized() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Obtener sesión inicial (solo una vez)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    // Escuchar cambios de auth (mínimo necesario)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { user, loading };
}
```

#### B. RLS Policies Eficientes

```sql
-- Políticas RLS optimizadas
-- Evitar subconsultas complejas en policies

-- Policy simple para estudiantes
CREATE POLICY "Users can view their assigned students" ON students
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM teacher_assignments 
      WHERE section_id = students.section_id
    )
  );

-- Usar funciones para policies complejas
CREATE OR REPLACE FUNCTION user_can_access_student(student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Lógica compleja aquí, ejecutada una vez
  RETURN EXISTS(
    SELECT 1 FROM teacher_assignments ta
    JOIN students s ON s.section_id = ta.section_id
    WHERE s.id = student_id AND ta.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can access allowed students" ON incidents
  FOR ALL USING (user_can_access_student(student_id));
```

### 6. 📊 Métricas y Monitoreo

#### A. Dashboard de Métricas

```typescript
// components/MetricsDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Metrics {
  vercelBandwidth: number;
  vercelFunctions: number;
  supabaseStorage: number;
  supabaseAuth: number;
  cacheHitRate: number;
}

export function MetricsDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 5 * 60 * 1000, // Cada 5 minutos
  });
  
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      <MetricCard
        title="Vercel Bandwidth"
        value={`${metrics?.vercelBandwidth || 0}GB`}
        limit="100GB"
        percentage={(metrics?.vercelBandwidth || 0) / 100 * 100}
      />
      <MetricCard
        title="Supabase Storage"
        value={`${metrics?.supabaseStorage || 0}MB`}
        limit="500MB"
        percentage={(metrics?.supabaseStorage || 0) / 500 * 100}
      />
      <MetricCard
        title="Cache Hit Rate"
        value={`${metrics?.cacheHitRate || 0}%`}
        limit="90%+"
        percentage={metrics?.cacheHitRate || 0}
      />
    </div>
  );
}
```

#### B. Alertas Automáticas

```typescript
// utils/monitoring.ts
export class ResourceMonitor {
  private static instance: ResourceMonitor;
  private thresholds = {
    bandwidth: 80, // 80GB (80% del límite)
    storage: 400,  // 400MB (80% del límite)
    functions: 80, // 80GB-Hrs
  };
  
  static getInstance() {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }
  
  async checkLimits() {
    const metrics = await this.fetchCurrentMetrics();
    
    if (metrics.bandwidth > this.thresholds.bandwidth) {
      this.sendAlert('bandwidth', metrics.bandwidth);
    }
    
    if (metrics.storage > this.thresholds.storage) {
      this.sendAlert('storage', metrics.storage);
    }
  }
  
  private async sendAlert(type: string, value: number) {
    // Enviar notificación (email, webhook, etc.)
    console.warn(`⚠️ ${type} usage: ${value} - approaching limit!`);
  }
}
```

### 7. 🔧 Configuraciones Adicionales

#### A. Webpack Bundle Analyzer

```javascript
// Agregar al package.json
{
  "scripts": {
    "analyze": "cross-env ANALYZE=true next build",
    "analyze:server": "cross-env BUNDLE_ANALYZE=server next build",
    "analyze:browser": "cross-env BUNDLE_ANALYZE=browser next build"
  }
}

// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

#### B. Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Audit URLs using Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.js'
```

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/dashboard'],
      startServerCommand: 'npm run start',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
      },
    },
  },
};
```

## 🎯 Checklist de Optimización

### ✅ Frontend
- [ ] Implementar lazy loading para componentes pesados
- [ ] Configurar caché de imágenes con Next.js Image
- [ ] Memoizar componentes y callbacks costosos
- [ ] Implementar code splitting por rutas
- [ ] Configurar Service Worker para caché offline
- [ ] Optimizar bundle size (tree shaking, dynamic imports)

### ✅ Backend/Supabase
- [ ] Implementar RPC functions para queries complejas
- [ ] Configurar índices en columnas frecuentemente consultadas
- [ ] Usar batch operations para múltiples inserts/updates
- [ ] Implementar paginación en todas las listas
- [ ] Configurar RLS policies eficientes
- [ ] Limitar uso de Realtime a casos esenciales

### ✅ Caché
- [ ] Configurar React Query con persistencia
- [ ] Implementar caché de API responses
- [ ] Configurar headers de caché en Vercel
- [ ] Usar CDN para assets estáticos
- [ ] Implementar caché de base de datos cuando sea posible

### ✅ Monitoreo
- [ ] Configurar métricas de uso de recursos
- [ ] Implementar alertas automáticas
- [ ] Monitorear performance con Lighthouse
- [ ] Trackear bundle size en CI/CD
- [ ] Configurar error tracking (Sentry, LogRocket)

## 🚨 Señales de Alerta

### Vercel
- Bandwidth > 80GB/mes
- Function execution time > 80GB-Hrs/mes
- Build time > 5,000 minutos/mes

### Supabase
- Database storage > 400MB
- Auth MAU > 40,000
- Storage > 800MB
- Realtime connections > 150 concurrentes

### Performance
- Lighthouse Performance Score < 90
- Bundle size > 500KB
- Time to Interactive > 3s
- Cache hit rate < 80%

## 📈 Métricas Clave a Monitorear

1. **Bundle Size**: Mantener < 500KB inicial
2. **Cache Hit Rate**: Objetivo > 85%
3. **API Response Time**: < 200ms promedio
4. **Database Query Time**: < 100ms promedio
5. **Memory Usage**: < 128MB en serverless functions
6. **Error Rate**: < 1%

---

**💡 Tip Final**: Implementa estas optimizaciones gradualmente y mide el impacto de cada una. Prioriza las que tengan mayor impacto en el uso de recursos de tu aplicación específica.