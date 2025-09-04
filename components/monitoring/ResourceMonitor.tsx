// components/monitoring/ResourceMonitor.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Server, 
  Zap, 
  HardDrive, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

interface ResourceMetrics {
  // Vercel metrics (simulados - en producción vendrían de Vercel API)
  vercel: {
    bandwidth: { used: number; limit: number; unit: 'GB' };
    functions: { used: number; limit: number; unit: 'GB-Hrs' };
    builds: { used: number; limit: number; unit: 'minutes' };
  };
  
  // Supabase metrics
  supabase: {
    database: { used: number; limit: number; unit: 'MB' };
    storage: { used: number; limit: number; unit: 'GB' };
    auth: { used: number; limit: number; unit: 'MAU' };
    apiCalls: { used: number; estimated: boolean };
  };
  
  // Performance metrics
  performance: {
    cacheHitRate: number;
    avgResponseTime: number;
    errorRate: number;
  };
  
  lastUpdated: string;
}

// Función para obtener métricas (simulada)
async function fetchResourceMetrics(): Promise<ResourceMetrics> {
  // En producción, estas métricas vendrían de APIs reales
  const { data: dbMetrics } = await supabase.rpc('get_usage_metrics');
  
  // Simular métricas de Vercel (en producción usar Vercel API)
  const vercelMetrics = {
    bandwidth: { used: 15.2, limit: 100, unit: 'GB' as const },
    functions: { used: 8.5, limit: 100, unit: 'GB-Hrs' as const },
    builds: { used: 450, limit: 6000, unit: 'minutes' as const },
  };
  
  // Métricas de Supabase (algunas reales, otras simuladas)
  const supabaseMetrics = {
    database: { 
      used: dbMetrics?.database?.size_mb || 45, 
      limit: 500, 
      unit: 'MB' as const 
    },
    storage: { used: 0.12, limit: 1, unit: 'GB' as const },
    auth: { 
      used: dbMetrics?.counts?.users || 25, 
      limit: 50000, 
      unit: 'MAU' as const 
    },
    apiCalls: { used: 1250, estimated: true },
  };
  
  // Métricas de performance (simuladas - en producción usar herramientas reales)
  const performanceMetrics = {
    cacheHitRate: 87.5,
    avgResponseTime: 145,
    errorRate: 0.2,
  };
  
  return {
    vercel: vercelMetrics,
    supabase: supabaseMetrics,
    performance: performanceMetrics,
    lastUpdated: new Date().toISOString(),
  };
}

interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  value: number;
  limit: number;
  unit: string;
  description?: string;
  estimated?: boolean;
}

function MetricCard({ title, icon, value, limit, unit, description, estimated }: MetricCardProps) {
  const percentage = (value / limit) * 100;
  const isWarning = percentage > 70;
  const isCritical = percentage > 85;
  
  const getStatusColor = () => {
    if (isCritical) return 'text-red-600';
    if (isWarning) return 'text-yellow-600';
    return 'text-green-600';
  };
  
  const getProgressColor = () => {
    if (isCritical) return 'bg-red-500';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
          {estimated && (
            <Badge variant="outline" className="text-xs">
              Est.
            </Badge>
          )}
        </CardTitle>
        <div className={`text-2xl font-bold ${getStatusColor()}`}>
          {isCritical ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toLocaleString()} {unit}
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          de {limit.toLocaleString()} {unit} ({percentage.toFixed(1)}%)
        </p>
        <Progress 
          value={percentage} 
          className="h-2"
          // @ts-ignore - Custom color class
          style={{
            '--progress-background': isCritical ? '#ef4444' : isWarning ? '#eab308' : '#22c55e'
          } as React.CSSProperties}
        />
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface PerformanceCardProps {
  title: string;
  value: number;
  unit: string;
  target: number;
  icon: React.ReactNode;
  isHigherBetter?: boolean;
}

function PerformanceCard({ title, value, unit, target, icon, isHigherBetter = true }: PerformanceCardProps) {
  const isGood = isHigherBetter ? value >= target : value <= target;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <Badge variant={isGood ? 'default' : 'destructive'}>
          {isGood ? 'Bueno' : 'Mejorar'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}{unit}
        </div>
        <p className="text-xs text-muted-foreground">
          Objetivo: {isHigherBetter ? '≥' : '≤'} {target}{unit}
        </p>
      </CardContent>
    </Card>
  );
}

export function ResourceMonitor() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['resource-metrics'],
    queryFn: fetchResourceMetrics,
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false, // 5 minutos
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
  
  const criticalAlerts = metrics ? [
    ...(metrics.vercel.bandwidth.used / metrics.vercel.bandwidth.limit > 0.85 ? ['Bandwidth de Vercel > 85%'] : []),
    ...(metrics.vercel.functions.used / metrics.vercel.functions.limit > 0.85 ? ['Funciones de Vercel > 85%'] : []),
    ...(metrics.supabase.database.used / metrics.supabase.database.limit > 0.85 ? ['Base de datos > 85%'] : []),
    ...(metrics.performance.errorRate > 1 ? ['Tasa de errores alta'] : []),
  ] : [];
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Monitor de Recursos</h2>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar métricas: {error.message}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!metrics) return null;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Recursos</h2>
          <p className="text-sm text-muted-foreground">
            Última actualización: {new Date(metrics.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-500' : 'text-gray-400'}`} />
            Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>
      
      {/* Alertas críticas */}
      {criticalAlerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Alertas críticas:</strong>
            <ul className="mt-2 list-disc list-inside">
              {criticalAlerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Métricas de Vercel */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5" />
          Vercel (Hosting)
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Bandwidth"
            icon={<Activity className="h-4 w-4" />}
            value={metrics.vercel.bandwidth.used}
            limit={metrics.vercel.bandwidth.limit}
            unit={metrics.vercel.bandwidth.unit}
            description="Transferencia de datos mensual"
          />
          <MetricCard
            title="Serverless Functions"
            icon={<Zap className="h-4 w-4" />}
            value={metrics.vercel.functions.used}
            limit={metrics.vercel.functions.limit}
            unit={metrics.vercel.functions.unit}
            description="Tiempo de ejecución mensual"
          />
          <MetricCard
            title="Build Minutes"
            icon={<RefreshCw className="h-4 w-4" />}
            value={metrics.vercel.builds.used}
            limit={metrics.vercel.builds.limit}
            unit={metrics.vercel.builds.unit}
            description="Tiempo de build mensual"
          />
        </div>
      </div>
      
      {/* Métricas de Supabase */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase (Backend)
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Base de Datos"
            icon={<Database className="h-4 w-4" />}
            value={metrics.supabase.database.used}
            limit={metrics.supabase.database.limit}
            unit={metrics.supabase.database.unit}
            description="Almacenamiento de datos"
          />
          <MetricCard
            title="Storage"
            icon={<HardDrive className="h-4 w-4" />}
            value={metrics.supabase.storage.used}
            limit={metrics.supabase.storage.limit}
            unit={metrics.supabase.storage.unit}
            description="Archivos y documentos"
          />
          <MetricCard
            title="Usuarios Activos"
            icon={<Users className="h-4 w-4" />}
            value={metrics.supabase.auth.used}
            limit={metrics.supabase.auth.limit}
            unit={metrics.supabase.auth.unit}
            description="Usuarios autenticados mensualmente"
          />
          <MetricCard
            title="API Calls"
            icon={<Activity className="h-4 w-4" />}
            value={metrics.supabase.apiCalls.used}
            limit={10000}
            unit="calls"
            description="Llamadas a la API (estimado)"
            estimated={metrics.supabase.apiCalls.estimated}
          />
        </div>
      </div>
      
      {/* Métricas de Performance */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <PerformanceCard
            title="Cache Hit Rate"
            value={metrics.performance.cacheHitRate}
            unit="%"
            target={85}
            icon={<Database className="h-4 w-4" />}
          />
          <PerformanceCard
            title="Tiempo de Respuesta"
            value={metrics.performance.avgResponseTime}
            unit="ms"
            target={200}
            icon={<Zap className="h-4 w-4" />}
            isHigherBetter={false}
          />
          <PerformanceCard
            title="Tasa de Errores"
            value={metrics.performance.errorRate}
            unit="%"
            target={1}
            icon={<AlertTriangle className="h-4 w-4" />}
            isHigherBetter={false}
          />
        </div>
      </div>
      
      {/* Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recomendaciones de Optimización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {metrics.vercel.bandwidth.used / metrics.vercel.bandwidth.limit > 0.7 && (
              <p>• Considera optimizar imágenes y habilitar compresión para reducir bandwidth</p>
            )}
            {metrics.supabase.database.used / metrics.supabase.database.limit > 0.7 && (
              <p>• Revisa y limpia datos antiguos o innecesarios en la base de datos</p>
            )}
            {metrics.performance.cacheHitRate < 80 && (
              <p>• Mejora la estrategia de caché para reducir llamadas a la API</p>
            )}
            {metrics.performance.avgResponseTime > 300 && (
              <p>• Optimiza queries de base de datos y considera usar RPC functions</p>
            )}
            <p>• Monitorea regularmente estas métricas para evitar exceder los límites gratuitos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ResourceMonitor;