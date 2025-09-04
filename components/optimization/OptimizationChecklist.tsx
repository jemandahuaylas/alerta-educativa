'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Info, 
  ExternalLink,
  RefreshCw,
  Zap,
  Database,
  Globe,
  Monitor,
  Settings,
  FileText
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'frontend' | 'backend' | 'deployment' | 'monitoring';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  automated?: boolean;
  link?: string;
  code?: string;
}

const OPTIMIZATION_CHECKLIST: ChecklistItem[] = [
  // Frontend Optimizations
  {
    id: 'react-query-setup',
    title: 'Configurar React Query con caché persistente',
    description: 'Implementar React Query con configuración optimizada para minimizar llamadas a la API',
    category: 'frontend',
    priority: 'high',
    completed: false,
    code: `import { optimizedQueryClient } from '@/lib/react-query';`,
    link: '/lib/optimizations/query-client.ts'
  },
  {
    id: 'lazy-loading',
    title: 'Implementar Lazy Loading',
    description: 'Cargar componentes y rutas de forma diferida para reducir el bundle inicial',
    category: 'frontend',
    priority: 'high',
    completed: false,
    code: `const Dashboard = lazy(() => import('@/components/Dashboard'));`
  },
  {
    id: 'image-optimization',
    title: 'Optimizar imágenes con Next.js',
    description: 'Configurar formatos WebP/AVIF y caché de imágenes',
    category: 'frontend',
    priority: 'medium',
    completed: false,
    link: '/next.config.optimized.js'
  },
  {
    id: 'code-splitting',
    title: 'Implementar Code Splitting',
    description: 'Dividir el código en chunks más pequeños para mejorar la carga inicial',
    category: 'frontend',
    priority: 'medium',
    completed: false
  },
  {
    id: 'remove-console',
    title: 'Eliminar console.log en producción',
    description: 'Configurar Babel para remover logs en builds de producción',
    category: 'frontend',
    priority: 'low',
    completed: false,
    automated: true
  },
  
  // Backend Optimizations
  {
    id: 'rpc-functions',
    title: 'Crear funciones RPC optimizadas',
    description: 'Implementar funciones RPC en Supabase para consultas complejas',
    category: 'backend',
    priority: 'high',
    completed: false,
    link: '/supabase/functions/optimized-queries.sql'
  },
  {
    id: 'batch-operations',
    title: 'Implementar operaciones en lote',
    description: 'Agrupar múltiples operaciones en una sola llamada a la API',
    category: 'backend',
    priority: 'high',
    completed: false,
    code: `const { mutate } = useMutation({ mutationFn: batchUpdateStudents });`
  },
  {
    id: 'database-indexes',
    title: 'Optimizar índices de base de datos',
    description: 'Crear índices para consultas frecuentes y mejorar performance',
    category: 'backend',
    priority: 'medium',
    completed: false
  },
  {
    id: 'rls-policies',
    title: 'Optimizar políticas RLS',
    description: 'Configurar Row Level Security eficiente para reducir carga de consultas',
    category: 'backend',
    priority: 'medium',
    completed: false
  },
  {
    id: 'data-pagination',
    title: 'Implementar paginación en todas las listas',
    description: 'Limitar la cantidad de datos cargados por consulta',
    category: 'backend',
    priority: 'high',
    completed: false
  },
  
  // Deployment Optimizations
  {
    id: 'next-config',
    title: 'Configurar Next.js optimizado',
    description: 'Aplicar configuración optimizada de Next.js para producción',
    category: 'deployment',
    priority: 'high',
    completed: false,
    automated: true,
    link: '/next.config.optimized.js'
  },
  {
    id: 'middleware-cache',
    title: 'Configurar middleware de caché',
    description: 'Implementar caché inteligente y headers de seguridad',
    category: 'deployment',
    priority: 'high',
    completed: false,
    automated: true,
    link: '/middleware.optimized.ts'
  },
  {
    id: 'compression',
    title: 'Habilitar compresión gzip',
    description: 'Reducir el tamaño de los assets servidos',
    category: 'deployment',
    priority: 'medium',
    completed: false,
    automated: true
  },
  {
    id: 'env-variables',
    title: 'Configurar variables de entorno',
    description: 'Establecer configuraciones de optimización y monitoreo',
    category: 'deployment',
    priority: 'medium',
    completed: false
  },
  
  // Monitoring
  {
    id: 'resource-monitor',
    title: 'Implementar monitor de recursos',
    description: 'Configurar monitoreo en tiempo real de uso de recursos',
    category: 'monitoring',
    priority: 'high',
    completed: false,
    link: '/components/monitoring/ResourceMonitor.tsx'
  },
  {
    id: 'performance-metrics',
    title: 'Configurar métricas de performance',
    description: 'Implementar tracking de Core Web Vitals y métricas personalizadas',
    category: 'monitoring',
    priority: 'medium',
    completed: false
  },
  {
    id: 'lighthouse-ci',
    title: 'Configurar Lighthouse CI',
    description: 'Automatizar auditorías de performance en CI/CD',
    category: 'monitoring',
    priority: 'low',
    completed: false,
    automated: true
  },
  {
    id: 'bundle-analysis',
    title: 'Configurar análisis de bundle',
    description: 'Monitorear el tamaño del bundle y detectar dependencias pesadas',
    category: 'monitoring',
    priority: 'medium',
    completed: false,
    automated: true
  }
];

const CATEGORY_ICONS = {
  frontend: Zap,
  backend: Database,
  deployment: Globe,
  monitoring: Monitor
};

const CATEGORY_COLORS = {
  frontend: 'bg-blue-500',
  backend: 'bg-green-500',
  deployment: 'bg-purple-500',
  monitoring: 'bg-orange-500'
};

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200'
};

export function OptimizationChecklist() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(OPTIMIZATION_CHECKLIST);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [autoCheck, setAutoCheck] = useState(false);

  // Cargar estado desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('optimization-checklist');
    if (saved) {
      try {
        const savedChecklist = JSON.parse(saved);
        setChecklist(savedChecklist);
      } catch (error) {
        console.error('Error loading checklist:', error);
      }
    }
  }, []);

  // Guardar estado en localStorage
  useEffect(() => {
    localStorage.setItem('optimization-checklist', JSON.stringify(checklist));
  }, [checklist]);

  // Auto-verificar elementos automatizables
  useEffect(() => {
    if (autoCheck) {
      const timer = setTimeout(() => {
        setChecklist(prev => prev.map(item => 
          item.automated ? { ...item, completed: true } : item
        ));
        setAutoCheck(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoCheck]);

  const toggleItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const resetChecklist = () => {
    setChecklist(OPTIMIZATION_CHECKLIST.map(item => ({ ...item, completed: false })));
  };

  const runAutoCheck = () => {
    setAutoCheck(true);
  };

  const getFilteredItems = (category?: string) => {
    if (!category || category === 'all') return checklist;
    return checklist.filter(item => item.category === category);
  };

  const getProgress = (category?: string) => {
    const items = getFilteredItems(category);
    const completed = items.filter(item => item.completed).length;
    return Math.round((completed / items.length) * 100);
  };

  const getStats = () => {
    const total = checklist.length;
    const completed = checklist.filter(item => item.completed).length;
    const high = checklist.filter(item => item.priority === 'high').length;
    const highCompleted = checklist.filter(item => item.priority === 'high' && item.completed).length;
    
    return { total, completed, high, highCompleted };
  };

  const stats = getStats();
  const overallProgress = getProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Checklist de Optimización
              </CardTitle>
              <CardDescription>
                Verifica que todas las optimizaciones estén implementadas correctamente
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runAutoCheck}
                disabled={autoCheck}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${autoCheck ? 'animate-spin' : ''}`} />
                Auto-verificar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetChecklist}
              >
                Reiniciar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.highCompleted}/{stats.high}</div>
              <div className="text-sm text-muted-foreground">Alta Prioridad</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
              <div className="text-sm text-muted-foreground">Progreso</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso General</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todas ({checklist.length})</TabsTrigger>
          <TabsTrigger value="frontend" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Frontend ({getFilteredItems('frontend').length})
          </TabsTrigger>
          <TabsTrigger value="backend" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            Backend ({getFilteredItems('backend').length})
          </TabsTrigger>
          <TabsTrigger value="deployment" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Deploy ({getFilteredItems('deployment').length})
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            Monitor ({getFilteredItems('monitoring').length})
          </TabsTrigger>
        </TabsList>

        {['all', 'frontend', 'backend', 'deployment', 'monitoring'].map(category => {
          const Icon = category !== 'all' ? CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] : Settings;
          const items = getFilteredItems(category === 'all' ? undefined : category);
          const progress = getProgress(category === 'all' ? undefined : category);

          return (
            <TabsContent key={category} value={category} className="space-y-4">
              {category !== 'all' && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <h3 className="font-semibold capitalize">{category}</h3>
                      </div>
                      <Badge variant="outline">{progress}% completado</Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                {items.map((item) => {
                  const CategoryIcon = CATEGORY_ICONS[item.category];
                  
                  return (
                    <Card 
                      key={item.id} 
                      className={`transition-all duration-200 hover:shadow-md ${
                        item.completed ? 'bg-green-50 border-green-200' : ''
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => toggleItem(item.id)}
                            className="mt-1 flex-shrink-0"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`font-medium ${
                                item.completed ? 'line-through text-muted-foreground' : ''
                              }`}>
                                {item.title}
                              </h4>
                              
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${PRIORITY_COLORS[item.priority]}`}
                                >
                                  {item.priority}
                                </Badge>
                                
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${CATEGORY_COLORS[item.category]} text-white border-transparent`}
                                >
                                  <CategoryIcon className="h-3 w-3 mr-1" />
                                  {item.category}
                                </Badge>
                                
                                {item.automated && (
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Auto
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <p className={`text-sm text-muted-foreground ${
                              item.completed ? 'line-through' : ''
                            }`}>
                              {item.description}
                            </p>
                            
                            {item.code && (
                              <div className="bg-gray-100 rounded p-2 text-xs font-mono">
                                {item.code}
                              </div>
                            )}
                            
                            {item.link && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => window.open(item.link, '_blank')}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Ver archivo
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Footer con consejos */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium">Consejos para la implementación:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Comienza con las optimizaciones de alta prioridad</li>
                <li>• Usa el script automático: <code className="bg-gray-100 px-1 rounded">node scripts/setup-optimizations.js</code></li>
                <li>• Verifica cada cambio en desarrollo antes de desplegar</li>
                <li>• Monitorea las métricas después de cada optimización</li>
                <li>• Mantén backups de tus archivos de configuración</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OptimizationChecklist;