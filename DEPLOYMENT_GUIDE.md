# 🚀 Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar tu aplicación **Alerta Educativa** en Vercel de manera exitosa.

## 📋 Prerrequisitos

- [ ] Cuenta en [Vercel](https://vercel.com)
- [ ] Cuenta en [Supabase](https://supabase.com)
- [ ] Repositorio de GitHub con el código
- [ ] Node.js 18+ instalado localmente

## 🔧 Preparación Previa

### 1. Verificar Build Local
```bash
npm run build
```
✅ **Completado**: El build se ejecuta sin errores

### 2. Configurar Supabase para Producción

#### En tu Dashboard de Supabase:
1. Ve a **Settings** → **API**
2. Copia tu **Project URL** y **anon/public key**
3. Ve a **Authentication** → **URL Configuration**
4. Agrega tu dominio de Vercel: `https://tu-app.vercel.app`
5. En **Site URL**, configura: `https://tu-app.vercel.app`
6. En **Redirect URLs**, agrega:
   - `https://tu-app.vercel.app/auth/callback`
   - `https://tu-app.vercel.app/login`

#### Configurar RLS (Row Level Security):
```sql
-- Ejecutar en el SQL Editor de Supabase
-- Asegúrate de que las políticas RLS estén configuradas correctamente
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
-- Agrega más tablas según sea necesario
```

## 🌐 Despliegue en Vercel

### Opción 1: Desde GitHub (Recomendado)

1. **Conectar Repositorio**:
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Haz clic en "New Project"
   - Importa tu repositorio de GitHub

2. **Configurar Variables de Entorno**:
   En la sección "Environment Variables" de Vercel, agrega:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
   NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
   NODE_ENV=production
   ```

3. **Configurar Build Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. **Deploy**:
   - Haz clic en "Deploy"
   - Espera a que termine el proceso

### Opción 2: Desde CLI de Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Desplegar
vercel --prod
```

## ⚙️ Configuraciones Post-Despliegue

### 1. Configurar Dominio Personalizado (Opcional)
1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Agrega tu dominio personalizado
4. Actualiza las URLs en Supabase

### 2. Configurar Redirects y Rewrites
El archivo `vercel.json` ya está configurado con:
- Headers de seguridad
- Cache para assets estáticos
- CORS para APIs

### 3. Monitoreo y Analytics
1. **Vercel Analytics**: Habilitado automáticamente
2. **Vercel Speed Insights**: Ve a Settings → Speed Insights
3. **Error Monitoring**: Considera integrar Sentry

## 🔍 Verificaciones Post-Despliegue

### Lista de Verificación:
- [ ] La aplicación carga correctamente
- [ ] El login/registro funciona
- [ ] Las páginas protegidas requieren autenticación
- [ ] Los datos se cargan desde Supabase
- [ ] Las imágenes se muestran correctamente
- [ ] Los formularios funcionan (crear/editar/eliminar)
- [ ] La navegación entre páginas es fluida
- [ ] No hay errores en la consola del navegador

### URLs de Prueba:
```
https://tu-app.vercel.app/login
https://tu-app.vercel.app/dashboard
https://tu-app.vercel.app/students
https://tu-app.vercel.app/incidents
```

## 🚨 Solución de Problemas Comunes

### Error: "Invalid API Key"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de usar `NEXT_PUBLIC_` para variables del cliente

### Error: "CORS"
- Verifica la configuración de URLs en Supabase
- Revisa que el dominio esté en la lista de URLs permitidas

### Error: "Build Failed"
- Ejecuta `npm run build` localmente para identificar errores
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Vercel

### Error: "Database Connection"
- Verifica las credenciales de Supabase
- Asegúrate de que las políticas RLS permitan el acceso
- Revisa que las tablas existan en la base de datos

## 📊 Optimizaciones de Rendimiento

### Configuraciones Aplicadas:
- ✅ Compresión habilitada
- ✅ Optimización de imágenes (WebP/AVIF)
- ✅ Headers de cache para assets estáticos
- ✅ Minificación de CSS/JS
- ✅ Tree shaking automático
- ✅ Code splitting por rutas

### Métricas a Monitorear:
- **Core Web Vitals** en Vercel Analytics
- **Bundle Size** (actualmente ~273kB para dashboard)
- **API Response Times**
- **Error Rate**

## 🔄 Actualizaciones Futuras

### Despliegue Automático:
Cada push a la rama `main` desplegará automáticamente a producción.

### Preview Deployments:
Cada PR creará un deployment de preview para testing.

### Rollback:
En caso de problemas, puedes hacer rollback desde el dashboard de Vercel.

## 📞 Soporte

Si encuentras problemas durante el despliegue:
1. Revisa los logs en Vercel Dashboard
2. Verifica la configuración de Supabase
3. Consulta la [documentación de Vercel](https://vercel.com/docs)
4. Revisa la [documentación de Supabase](https://supabase.com/docs)

---

**¡Tu aplicación Alerta Educativa está lista para producción! 🎉**