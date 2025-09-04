// middleware.optimized.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Configuración de caché por ruta
const CACHE_CONFIG = {
  // Páginas estáticas - caché largo
  static: {
    paths: ['/login', '/register', '/about'],
    maxAge: 3600, // 1 hora
    sMaxAge: 7200, // 2 horas en CDN
  },
  // Dashboard y páginas dinámicas - caché corto
  dynamic: {
    paths: ['/dashboard', '/students', '/incidents', '/permisos'],
    maxAge: 300, // 5 minutos
    sMaxAge: 600, // 10 minutos en CDN
  },
  // API routes - caché muy corto
  api: {
    paths: ['/api'],
    maxAge: 60, // 1 minuto
    sMaxAge: 300, // 5 minutos en CDN
  },
  // Assets - caché muy largo
  assets: {
    paths: ['/_next/static', '/favicon.ico', '/images'],
    maxAge: 31536000, // 1 año
    sMaxAge: 31536000, // 1 año en CDN
  },
};

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/dashboard',
  '/students',
  '/incidents',
  '/permisos',
  '/docentes',
  '/settings',
  '/api/students',
  '/api/incidents',
  '/api/dashboard',
];

// Rutas públicas (no requieren autenticación)
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/about',
  '/api/auth',
];

// Función para determinar el tipo de caché basado en la ruta
function getCacheConfig(pathname: string) {
  for (const [type, config] of Object.entries(CACHE_CONFIG)) {
    if (config.paths.some(path => pathname.startsWith(path))) {
      return { type, ...config };
    }
  }
  return null;
}

// Función para generar headers de caché optimizados
function getCacheHeaders(config: any) {
  const headers = new Headers();
  
  if (config) {
    // Cache-Control para el navegador y CDN
    headers.set(
      'Cache-Control',
      `public, max-age=${config.maxAge}, s-maxage=${config.sMaxAge}, stale-while-revalidate=86400`
    );
    
    // Headers adicionales para optimización
    headers.set('X-Cache-Type', config.type);
    headers.set('Vary', 'Accept-Encoding, Authorization');
    
    // ETag para validación de caché
    const etag = `"${Date.now()}-${config.type}"`;
    headers.set('ETag', etag);
  }
  
  return headers;
}

// Función para verificar si la ruta está protegida
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

// Función para verificar si la ruta es pública
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

// Rate limiting simple (en memoria - para producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Función para limpiar rate limit map periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000); // Limpiar cada minuto

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const response = NextResponse.next();
  
  // Obtener IP para rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    // 1. Rate Limiting
    if (!checkRateLimit(ip, 100, 60000)) { // 100 requests por minuto
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
        },
      });
    }
    
    // 2. Headers de seguridad
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // 3. Configurar headers de caché
    const cacheConfig = getCacheConfig(pathname);
    if (cacheConfig) {
      const cacheHeaders = getCacheHeaders(cacheConfig);
      cacheHeaders.forEach((value, key) => {
        response.headers.set(key, value);
      });
    }
    
    // 4. Manejo de assets estáticos
    if (pathname.startsWith('/_next/static') || pathname.startsWith('/images')) {
      // Headers de caché muy largos para assets
      response.headers.set(
        'Cache-Control',
        'public, max-age=31536000, immutable'
      );
      return response;
    }
    
    // 5. Verificación de autenticación para rutas protegidas
    if (isProtectedRoute(pathname)) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll().map(cookie => ({
                name: cookie.name,
                value: cookie.value
              }));
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          // Redirigir a login si no está autenticado
          const redirectUrl = new URL('/login', request.url);
          redirectUrl.searchParams.set('redirect', pathname + search);
          return NextResponse.redirect(redirectUrl);
        }
        
        // Agregar información del usuario a headers (para uso en páginas)
        response.headers.set('X-User-ID', user.id);
        response.headers.set('X-User-Role', user.user_metadata?.role || 'user');
        
      } catch (authError) {
        console.error('Auth error in middleware:', authError);
        // En caso de error de auth, redirigir a login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    
    // 6. Redirecciones optimizadas
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // 7. Manejo especial para API routes
    if (pathname.startsWith('/api/')) {
      // Headers específicos para API
      response.headers.set('Content-Type', 'application/json');
      response.headers.set('X-API-Version', '1.0');
      
      // CORS headers si es necesario
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
    }
    
    // 8. Compresión de respuestas (si no está habilitada en Vercel)
    const acceptEncoding = request.headers.get('accept-encoding');
    if (acceptEncoding?.includes('gzip')) {
      response.headers.set('Content-Encoding', 'gzip');
    }
    
    // 9. Headers de performance
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('X-Middleware-Cache', cacheConfig?.type || 'none');
    
    // 10. Logging para monitoreo (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] ${request.method} ${pathname} - Cache: ${cacheConfig?.type || 'none'}`);
    }
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    // En caso de error, permitir que la request continúe
    // pero sin optimizaciones
    return NextResponse.next();
  }
}

// Configuración del matcher para optimizar performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

// Función auxiliar para limpiar caché (usar en casos específicos)
export function clearMiddlewareCache() {
  rateLimitMap.clear();
}

// Función para obtener estadísticas del middleware
export function getMiddlewareStats() {
  return {
    rateLimitEntries: rateLimitMap.size,
    timestamp: new Date().toISOString(),
  };
}