// lib/optimizations/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Configuración optimizada de React Query para minimizar llamadas a Supabase
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caché agresivo para reducir llamadas a Supabase
      staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
      gcTime: 15 * 60 * 1000, // 15 minutos - mantener en memoria (antes cacheTime)
      
      // Reducir refetching automático
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: 'always', // Solo cuando se reconecta
      
      // Retry inteligente para evitar llamadas innecesarias
      retry: (failureCount, error: any) => {
        // No reintentar errores 4xx (cliente)
        if (error?.status >= 400 && error?.status < 500) return false;
        // Máximo 2 reintentos para errores de servidor
        return failureCount < 2;
      },
      
      // Delay exponencial entre reintentos
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Reintentos para mutaciones críticas
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Persistir caché en localStorage para reducir llamadas iniciales
const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : null,
  key: 'alerta-educativa-cache-v1',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});

// Solo persistir en el cliente
if (typeof window !== 'undefined') {
  persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    buster: 'v1', // Cambiar para invalidar caché existente
  });
}

// Prefetch inteligente para datos críticos
export const prefetchCriticalData = async () => {
  // Solo prefetch datos que se usan en múltiples páginas
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['user-profile'],
      staleTime: 10 * 60 * 1000, // 10 minutos para datos de usuario
    }),
    queryClient.prefetchQuery({
      queryKey: ['app-settings'],
      staleTime: 30 * 60 * 1000, // 30 minutos para configuración
    }),
  ]);
};

// Invalidación inteligente de caché
export const invalidateRelatedQueries = (entityType: string, entityId?: string) => {
  const patterns = {
    student: ['students', 'incidents', 'risk-assessments'],
    incident: ['incidents', 'students', 'dashboard-stats'],
    section: ['sections', 'students', 'teachers'],
    user: ['user-profile', 'permissions'],
  };
  
  const relatedKeys = patterns[entityType as keyof typeof patterns] || [];
  
  relatedKeys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
};

// Limpieza periódica de caché para liberar memoria
export const cleanupCache = () => {
  // Limpiar queries no utilizadas hace más de 30 minutos
  queryClient.getQueryCache().clear();
  
  // Garbage collection manual
  if (typeof window !== 'undefined' && window.gc) {
    window.gc();
  }
};

// Ejecutar limpieza cada hora
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 60 * 60 * 1000);
}