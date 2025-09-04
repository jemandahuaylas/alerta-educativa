-- supabase/functions/optimized-queries.sql
-- Funciones RPC optimizadas para reducir el número de llamadas desde el frontend

-- Función para obtener estadísticas del dashboard en una sola llamada
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_students_count INTEGER;
  pending_incidents_count INTEGER;
  high_risk_students_count INTEGER;
  total_desertions_count INTEGER;
  recent_trend NUMERIC;
BEGIN
  -- Obtener todas las estadísticas en paralelo
  SELECT 
    (SELECT COUNT(*) FROM students WHERE deleted_at IS NULL),
    (SELECT COUNT(*) FROM incidents WHERE status = 'Pendiente' AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM risk_assessments WHERE level = 'High' AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM desertion_records WHERE deleted_at IS NULL)
  INTO total_students_count, pending_incidents_count, high_risk_students_count, total_desertions_count;
  
  -- Calcular tendencia de deserción (últimos 30 días vs 30 días anteriores)
  WITH recent_period AS (
    SELECT COUNT(*) as recent_count
    FROM desertion_records 
    WHERE created_at >= NOW() - INTERVAL '30 days'
      AND deleted_at IS NULL
  ),
  previous_period AS (
    SELECT COUNT(*) as previous_count
    FROM desertion_records 
    WHERE created_at >= NOW() - INTERVAL '60 days'
      AND created_at < NOW() - INTERVAL '30 days'
      AND deleted_at IS NULL
  )
  SELECT 
    CASE 
      WHEN p.previous_count = 0 THEN 
        CASE WHEN r.recent_count > 0 THEN 100.0 ELSE 0.0 END
      ELSE 
        ROUND(((r.recent_count - p.previous_count)::NUMERIC / p.previous_count * 100), 2)
    END
  INTO recent_trend
  FROM recent_period r, previous_period p;
  
  -- Construir JSON de respuesta
  SELECT json_build_object(
    'totalStudents', total_students_count,
    'pendingIncidents', pending_incidents_count,
    'highRiskStudents', high_risk_students_count,
    'totalDesertions', total_desertions_count,
    'desertionTrend', COALESCE(recent_trend, 0),
    'lastUpdated', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener datos de tendencia de deserción
CREATE OR REPLACE FUNCTION get_desertion_trend_data(months_back INTEGER DEFAULT 6)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH monthly_desertions AS (
    SELECT 
      DATE_TRUNC('month', dr.created_at) as month,
      COUNT(*) as count,
      json_agg(
        json_build_object(
          'reason', dr.reason,
          'grade', g.name
        )
      ) as details
    FROM desertion_records dr
    JOIN students s ON dr.student_id = s.id
    JOIN sections sec ON s.section_id = sec.id
    JOIN grades g ON sec.grade_id = g.id
    WHERE dr.created_at >= NOW() - (months_back || ' months')::INTERVAL
      AND dr.deleted_at IS NULL
    GROUP BY DATE_TRUNC('month', dr.created_at)
    ORDER BY month
  )
  SELECT json_agg(
    json_build_object(
      'month', TO_CHAR(month, 'YYYY-MM'),
      'desertions', count,
      'details', details
    )
  ) INTO result
  FROM monthly_desertions;
  
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estudiantes con información completa y paginación
CREATE OR REPLACE FUNCTION get_students_paginated(
  page_offset INTEGER DEFAULT 0,
  page_limit INTEGER DEFAULT 20,
  section_filter UUID DEFAULT NULL,
  search_term TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_count INTEGER;
BEGIN
  -- Construir query dinámicamente
  WITH filtered_students AS (
    SELECT 
      s.id,
      s.name,
      s.email,
      s.phone,
      s.created_at,
      json_build_object(
        'id', sec.id,
        'name', sec.name,
        'grade', json_build_object(
          'id', g.id,
          'name', g.name
        )
      ) as section,
      (
        SELECT COUNT(*) 
        FROM incidents i 
        WHERE i.student_id = s.id AND i.deleted_at IS NULL
      ) as incidents_count,
      (
        SELECT json_build_object(
          'level', ra.level,
          'score', ra.score,
          'created_at', ra.created_at
        )
        FROM risk_assessments ra 
        WHERE ra.student_id = s.id 
          AND ra.deleted_at IS NULL
        ORDER BY ra.created_at DESC 
        LIMIT 1
      ) as latest_risk_assessment
    FROM students s
    JOIN sections sec ON s.section_id = sec.id
    JOIN grades g ON sec.grade_id = g.id
    WHERE s.deleted_at IS NULL
      AND (section_filter IS NULL OR s.section_id = section_filter)
      AND (
        search_term IS NULL OR 
        s.name ILIKE '%' || search_term || '%' OR 
        s.email ILIKE '%' || search_term || '%'
      )
  ),
  paginated_students AS (
    SELECT *
    FROM filtered_students
    ORDER BY name
    LIMIT page_limit
    OFFSET page_offset
  )
  SELECT 
    json_build_object(
      'students', COALESCE(json_agg(ps.*), '[]'::JSON),
      'totalCount', (SELECT COUNT(*) FROM filtered_students),
      'currentPage', page_offset / page_limit,
      'totalPages', CEIL((SELECT COUNT(*) FROM filtered_students)::NUMERIC / page_limit)
    )
  INTO result
  FROM paginated_students ps;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener incidentes recientes con información completa
CREATE OR REPLACE FUNCTION get_recent_incidents(incident_limit INTEGER DEFAULT 5)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH recent_incidents AS (
    SELECT 
      i.id,
      i.type,
      i.description,
      i.status,
      i.severity,
      i.created_at,
      json_build_object(
        'id', s.id,
        'name', s.name,
        'section', json_build_object(
          'name', sec.name,
          'grade', g.name
        )
      ) as student
    FROM incidents i
    JOIN students s ON i.student_id = s.id
    JOIN sections sec ON s.section_id = sec.id
    JOIN grades g ON sec.grade_id = g.id
    WHERE i.deleted_at IS NULL
    ORDER BY i.created_at DESC
    LIMIT incident_limit
  )
  SELECT json_agg(ri.*) INTO result
  FROM recent_incidents ri;
  
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener datos del profesor con estadísticas
CREATE OR REPLACE FUNCTION get_teacher_dashboard_data(teacher_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH teacher_sections AS (
    SELECT 
      sec.id,
      sec.name,
      json_build_object(
        'id', g.id,
        'name', g.name
      ) as grade,
      (
        SELECT COUNT(*) 
        FROM students s 
        WHERE s.section_id = sec.id AND s.deleted_at IS NULL
      ) as student_count
    FROM teacher_assignments ta
    JOIN sections sec ON ta.section_id = sec.id
    JOIN grades g ON sec.grade_id = g.id
    WHERE ta.user_id = teacher_user_id
      AND ta.deleted_at IS NULL
  ),
  teacher_stats AS (
    SELECT 
      COUNT(DISTINCT s.id) as total_students,
      COUNT(DISTINCT i.id) as total_incidents,
      COUNT(DISTINCT ts.id) as assigned_sections
    FROM teacher_assignments ta
    LEFT JOIN students s ON s.section_id = ta.section_id AND s.deleted_at IS NULL
    LEFT JOIN incidents i ON i.student_id = s.id AND i.deleted_at IS NULL
    LEFT JOIN teacher_sections ts ON ts.id = ta.section_id
    WHERE ta.user_id = teacher_user_id
      AND ta.deleted_at IS NULL
  )
  SELECT json_build_object(
    'sections', COALESCE((SELECT json_agg(ts.*) FROM teacher_sections ts), '[]'::JSON),
    'stats', (SELECT row_to_json(stats.*) FROM teacher_stats stats),
    'lastUpdated', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear estudiante con validaciones
CREATE OR REPLACE FUNCTION create_student_optimized(
  student_name TEXT,
  student_email TEXT,
  student_phone TEXT DEFAULT NULL,
  section_id UUID,
  additional_data JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  new_student_id UUID;
  result JSON;
BEGIN
  -- Validar que la sección existe
  IF NOT EXISTS (SELECT 1 FROM sections WHERE id = section_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Section does not exist';
  END IF;
  
  -- Validar email único
  IF EXISTS (SELECT 1 FROM students WHERE email = student_email AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;
  
  -- Insertar estudiante
  INSERT INTO students (name, email, phone, section_id, additional_data)
  VALUES (student_name, student_email, student_phone, section_id, additional_data)
  RETURNING id INTO new_student_id;
  
  -- Retornar estudiante creado con información completa
  SELECT json_build_object(
    'id', s.id,
    'name', s.name,
    'email', s.email,
    'phone', s.phone,
    'created_at', s.created_at,
    'section', json_build_object(
      'id', sec.id,
      'name', sec.name,
      'grade', json_build_object(
        'id', g.id,
        'name', g.name
      )
    )
  ) INTO result
  FROM students s
  JOIN sections sec ON s.section_id = sec.id
  JOIN grades g ON sec.grade_id = g.id
  WHERE s.id = new_student_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para batch update de estudiantes
CREATE OR REPLACE FUNCTION batch_update_students(
  updates JSONB
)
RETURNS JSON AS $$
DECLARE
  update_record JSONB;
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
  results JSON[];
BEGIN
  -- Iterar sobre cada actualización
  FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    BEGIN
      UPDATE students 
      SET 
        name = COALESCE((update_record->>'name'), name),
        email = COALESCE((update_record->>'email'), email),
        phone = COALESCE((update_record->>'phone'), phone),
        section_id = COALESCE((update_record->>'section_id')::UUID, section_id),
        updated_at = NOW()
      WHERE id = (update_record->>'id')::UUID
        AND deleted_at IS NULL;
      
      IF FOUND THEN
        updated_count := updated_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
    END;
  END LOOP;
  
  RETURN json_build_object(
    'updated', updated_count,
    'errors', error_count,
    'total', jsonb_array_length(updates)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener métricas de uso (para monitoreo)
CREATE OR REPLACE FUNCTION get_usage_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH metrics AS (
    SELECT 
      -- Conteos básicos
      (SELECT COUNT(*) FROM students WHERE deleted_at IS NULL) as total_students,
      (SELECT COUNT(*) FROM incidents WHERE deleted_at IS NULL) as total_incidents,
      (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users,
      
      -- Actividad reciente (últimas 24 horas)
      (SELECT COUNT(*) FROM incidents WHERE created_at >= NOW() - INTERVAL '24 hours') as incidents_24h,
      (SELECT COUNT(*) FROM students WHERE created_at >= NOW() - INTERVAL '24 hours') as new_students_24h,
      
      -- Tamaño de base de datos (aproximado)
      pg_database_size(current_database()) as db_size_bytes,
      
      -- Estadísticas de tablas principales
      (SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
       FROM pg_stat_user_tables 
       WHERE tablename IN ('students', 'incidents', 'users')
      ) as table_stats
  )
  SELECT json_build_object(
    'counts', json_build_object(
      'students', m.total_students,
      'incidents', m.total_incidents,
      'users', m.total_users
    ),
    'activity_24h', json_build_object(
      'new_incidents', m.incidents_24h,
      'new_students', m.new_students_24h
    ),
    'database', json_build_object(
      'size_mb', ROUND(m.db_size_bytes / 1024.0 / 1024.0, 2)
    ),
    'generated_at', NOW()
  ) INTO result
  FROM metrics m;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear índices para optimizar las consultas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_section_name ON students(section_id, name) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_student_created ON incidents(student_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_status_created ON incidents(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_risk_assessments_student_created ON risk_assessments(student_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_desertion_records_created ON desertion_records(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teacher_assignments_user ON teacher_assignments(user_id) WHERE deleted_at IS NULL;

-- Comentarios para documentación
COMMENT ON FUNCTION get_dashboard_stats() IS 'Obtiene todas las estadísticas del dashboard en una sola llamada para minimizar requests';
COMMENT ON FUNCTION get_desertion_trend_data(INTEGER) IS 'Obtiene datos de tendencia de deserción procesados para gráficos';
COMMENT ON FUNCTION get_students_paginated(INTEGER, INTEGER, UUID, TEXT) IS 'Obtiene estudiantes paginados con filtros y búsqueda';
COMMENT ON FUNCTION get_recent_incidents(INTEGER) IS 'Obtiene incidentes recientes con información completa del estudiante';
COMMENT ON FUNCTION get_teacher_dashboard_data(UUID) IS 'Obtiene todos los datos necesarios para el dashboard del profesor';
COMMENT ON FUNCTION create_student_optimized(TEXT, TEXT, TEXT, UUID, JSONB) IS 'Crea estudiante con validaciones y retorna información completa';
COMMENT ON FUNCTION batch_update_students(JSONB) IS 'Actualiza múltiples estudiantes en una sola transacción';
COMMENT ON FUNCTION get_usage_metrics() IS 'Obtiene métricas de uso para monitoreo de recursos';