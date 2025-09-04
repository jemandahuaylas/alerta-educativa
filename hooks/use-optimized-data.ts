// hooks/use-optimized-data.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useMemo } from 'react';

// Hook optimizado para estudiantes con paginación y filtros
export function useStudentsOptimized({
  page = 0,
  pageSize = 20,
  sectionId,
  searchTerm,
}: {
  page?: number;
  pageSize?: number;
  sectionId?: string;
  searchTerm?: string;
} = {}) {
  const queryKey = ['students', 'paginated', page, pageSize, sectionId, searchTerm];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select(`
          id,
          name,
          email,
          phone,
          section_id,
          created_at,
          sections!inner(
            id,
            name,
            grade_id,
            grades(name)
          ),
          incidents(count),
          risk_assessments(
            level,
            created_at
          )
        `, { count: 'exact' })
        .order('name');
      
      // Aplicar filtros solo si existen
      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      // Paginación
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        students: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
    placeholderData: (previousData) => previousData, // Mantener datos anteriores durante navegación
    enabled: true, // Siempre habilitado
  });
}

// Hook para estadísticas del dashboard con caché agresivo
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Usar RPC function para obtener todas las estadísticas en una sola llamada
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      
      if (error) {
        // Fallback a queries individuales si RPC falla
        const [studentsRes, incidentsRes, riskRes, desertionRes] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('status', 'Pendiente'),
          supabase.from('risk_assessments').select('id', { count: 'exact', head: true }).eq('level', 'High'),
          supabase.from('desertion_records').select('id', { count: 'exact', head: true }),
        ]);
        
        return {
          totalStudents: studentsRes.count || 0,
          pendingIncidents: incidentsRes.count || 0,
          highRiskStudents: riskRes.count || 0,
          totalDesertions: desertionRes.count || 0,
        };
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - estadísticas no cambian frecuentemente
    gcTime: 15 * 60 * 1000, // 15 minutos (antes cacheTime)
    refetchOnWindowFocus: false,
  });
}

// Hook para incidentes recientes con límite
export function useRecentIncidents(limit: number = 5) {
  return useQuery({
    queryKey: ['incidents', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          id,
          type,
          description,
          status,
          created_at,
          students!inner(
            id,
            name,
            sections(name, grades(name))
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 8 * 60 * 1000, // 8 minutos (antes cacheTime)
  });
}

// Hook para datos de gráfico de deserción con caché diario
export function useDesertionTrendData() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['desertion-trend', today],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_desertion_trend_data');
      
      if (error) {
        // Fallback query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('desertion_records')
          .select(`
            created_at,
            reason,
            students(sections(grades(name)))
          `)
          .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 6 meses
          .order('created_at');
        
        if (fallbackError) throw fallbackError;
        
        // Procesar datos para el gráfico
        const processedData = processDesertionData(fallbackData || []);
        return processedData;
      }
      
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 horas - datos históricos
    gcTime: 48 * 60 * 60 * 1000, // 48 horas (antes cacheTime)
    refetchOnWindowFocus: false,
  });
}

// Hook para secciones con caché extendido
export function useSections() {
  return useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select(`
          id,
          name,
          grade_id,
          grades(id, name),
          students(count)
        `)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutos - secciones no cambian frecuentemente
    gcTime: 60 * 60 * 1000, // 1 hora (antes cacheTime)
  });
}

// Mutation optimizada para crear incidentes
export function useCreateIncident() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (incidentData: any) => {
      const { data, error } = await supabase
        .from('incidents')
        .insert(incidentData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidar solo las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      // Actualizar caché de incidentes recientes optimísticamente
      queryClient.setQueryData(['incidents', 'recent', 5], (old: any[]) => {
        if (!old) return [data];
        return [data, ...old.slice(0, 4)];
      });
    },
  });
}

// Mutation optimizada para actualizar estudiante
export function useUpdateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: result, error } = await supabase
        .from('students')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onMutate: async ({ id, data }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: ['students'] });
      
      // Snapshot del estado anterior
      const previousData = queryClient.getQueryData(['students']);
      
      // Actualización optimista
      queryClient.setQueriesData(
        { queryKey: ['students'] },
        (old: any) => {
          if (!old) return old;
          // Actualizar el estudiante en los datos cacheados
          return {
            ...old,
            students: old.students?.map((student: any) =>
              student.id === id ? { ...student, ...data } : student
            ),
          };
        }
      );
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Revertir en caso de error
      if (context?.previousData) {
        queryClient.setQueryData(['students'], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// Función auxiliar para procesar datos de deserción
function processDesertionData(data: any[]) {
  const monthlyData = data.reduce((acc, record) => {
    const month = new Date(record.created_at).toISOString().slice(0, 7); // YYYY-MM
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(monthlyData)
    .map(([month, count]) => ({
      month,
      desertions: count,
      date: new Date(month + '-01'),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Hook personalizado para datos del profesor
export function useTeacherData(teacherId: string) {
  return useQuery({
    queryKey: ['teacher-data', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select(`
          section_id,
          sections!inner(
            id,
            name,
            grade_id,
            grades(name),
            students(count)
          )
        `)
        .eq('user_id', teacherId);
      
      if (error) throw error;
      
      // Obtener estadísticas del profesor
      const sectionIds = data?.map(ta => ta.section_id) || [];
      
      if (sectionIds.length === 0) {
        return {
          sections: [],
          totalStudents: 0,
          totalIncidents: 0,
        };
      }
      
      const [studentsRes, incidentsRes] = await Promise.all([
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .in('section_id', sectionIds),
        supabase
          .from('incidents')
          .select('id', { count: 'exact', head: true })
          .in('student_id', 
            (await supabase
              .from('students')
              .select('id')
              .in('section_id', sectionIds)
            ).data?.map(s => s.id) || []
          ),
      ]);
      
      return {
        sections: data?.map(ta => ta.sections) || [],
        totalStudents: studentsRes.count || 0,
        totalIncidents: incidentsRes.count || 0,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 20 * 60 * 1000, // 20 minutos (antes cacheTime)
    enabled: !!teacherId,
  });
}