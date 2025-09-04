# Guía de Deployment en Vercel

## ⚠️ Problemas Comunes y Soluciones

Si estás experimentando errores frecuentes en los deploys, aquí están las mejores prácticas para escribir código compatible con Vercel:

### 1. Inicialización de Clientes en Runtime (No en Build Time)

**❌ INCORRECTO:**
```typescript
// En el nivel del módulo - se ejecuta durante el build
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  // usar supabaseClient aquí
}
```

**✅ CORRECTO:**
```typescript
export async function POST() {
  // Crear el cliente dentro de la función - se ejecuta en runtime
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // usar supabaseClient aquí
}
```

### 2. Manejo Seguro de Variables de Entorno

**✅ Siempre verificar que las variables existan:**
```typescript
export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Missing required environment variables' },
      { status: 500 }
    );
  }
  
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
}
```

### 3. Optimización de Imports Dinámicos

**✅ Para librerías pesadas, usar imports dinámicos:**
```typescript
export async function POST() {
  const { createClient } = await import('@supabase/supabase-js');
  // resto del código
}
```

### 4. Configuración de Edge Runtime (Opcional)

**✅ Para APIs simples, considera usar Edge Runtime:**
```typescript
export const runtime = 'edge';

export async function POST() {
  // código optimizado para edge
}
```

---

## 🚀 Configuración Optimizada para Vercel

### 1. Archivo `vercel.json` Recomendado

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": []
}
```

### 2. Variables de Entorno Obligatorias

**En Vercel Dashboard → Settings → Environment Variables:**

| Variable | Valor | Entornos |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Tu URL de Supabase | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu clave anónima | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu clave de servicio | Production, Preview, Development |

### 3. Estructura de Archivos API Optimizada

```
src/app/api/
├── auth/
│   └── route.ts          # Autenticación
├── admin/
│   ├── bulk-import-users/
│   │   └── route.ts      # Import masivo
│   └── delete-user/
│       └── route.ts      # Eliminar usuario
└── health/
    └── route.ts          # Health check
```

### 4. Template para APIs Compatibles con Vercel

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Opcional: usar edge runtime para mejor performance
// export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // 1. Validar variables de entorno
    const requiredEnvVars = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return NextResponse.json(
        { error: `Missing environment variables: ${missingVars.join(', ')}` },
        { status: 500 }
      );
    }

    // 2. Crear clientes en runtime
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      requiredEnvVars.supabaseUrl!,
      requiredEnvVars.supabaseKey!
    );

    // 3. Tu lógica aquí
    const { data } = await request.json();
    
    // 4. Procesar y responder
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5. Checklist Pre-Deploy

- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ No hay inicializaciones de clientes a nivel de módulo
- [ ] ✅ Todas las APIs manejan errores correctamente
- [ ] ✅ Build local exitoso (`npm run build`)
- [ ] ✅ TypeScript sin errores (`npm run type-check`)
- [ ] ✅ Linting pasando (`npm run lint`)

---

## 🔄 ¿Crear Nuevo Repositorio?

**Antes de crear un nuevo repositorio, considera:**

1. **Aplicar las mejores prácticas arriba** - Muchos errores se pueden resolver
2. **Limpiar el historial de builds** - Ve a Vercel Dashboard → Deployments → Settings → Clear Build Cache
3. **Verificar configuración** - Asegúrate que todas las variables estén bien configuradas

**Si decides crear un nuevo repositorio:**

1. Usa este proyecto como base pero aplicando todas las mejores prácticas
2. Configura las variables de entorno desde el inicio
3. Haz commits pequeños y frecuentes para identificar problemas rápidamente

---

## Error Común: "supabaseKey is required"

Si ves este error durante el build en Vercel:
```
Error: supabaseKey is required.
```

Significa que las variables de entorno de Supabase no están configuradas correctamente.

## Configuración de Variables de Entorno

### Variables Obligatorias

Debes configurar estas 3 variables en Vercel:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Valor: URL de tu proyecto Supabase
   - Ejemplo: `https://zahqnkjkyltsthfczzgp.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Valor: Clave anónima/pública de Supabase
   - Se puede exponer al cliente

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Valor: Clave de rol de servicio de Supabase
   - ⚠️ **CRÍTICO**: Esta clave debe mantenerse secreta
   - Requerida para operaciones administrativas como bulk import

### Pasos para Configurar en Vercel

1. **Accede a tu Dashboard de Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Selecciona tu proyecto

2. **Navega a Environment Variables**
   - Ve a `Settings` > `Environment Variables`

3. **Agrega cada variable**
   - Haz clic en "Add New"
   - Nombre: `NEXT_PUBLIC_SUPABASE_URL`
   - Valor: Tu URL de Supabase
   - Environments: Selecciona `Production`, `Preview`, y `Development`
   - Repite para las otras 2 variables

4. **Obtén los valores desde Supabase**
   - Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard)
   - Selecciona tu proyecto
   - Ve a `Settings` > `API`
   - Copia:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

5. **Redeploy**
   - Después de agregar las variables, haz un nuevo deployment
   - Puedes hacer push a tu repositorio o usar "Redeploy" en Vercel

## Verificación

Después de configurar las variables:
- El build debería completarse sin errores
- Las funciones de bulk import funcionarán correctamente
- No verás más el error "supabaseKey is required"

## Troubleshooting

- **Error persiste**: Verifica que los nombres de las variables sean exactos
- **Build falla**: Asegúrate de que las 3 variables estén configuradas
- **Funciones no funcionan**: Verifica que `SUPABASE_SERVICE_ROLE_KEY` sea correcta

## Seguridad

⚠️ **IMPORTANTE**: 
- Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en el código cliente
- Esta clave solo debe usarse en funciones del servidor (API routes)
- Las claves `NEXT_PUBLIC_*` son seguras para el cliente