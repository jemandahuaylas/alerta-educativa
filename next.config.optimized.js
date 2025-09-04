// next.config.optimized.js
// Configuración optimizada para mantener la aplicación dentro de los límites gratuitos

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar compresión automática para reducir bandwidth
  compress: true,
  
  // Configuración de imágenes optimizada
  images: {
    // Formatos modernos para menor tamaño
    formats: ['image/webp', 'image/avif'],
    
    // Caché largo para imágenes
    minimumCacheTTL: 31536000, // 1 año
    
    // Tamaños optimizados para diferentes dispositivos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Calidad reducida para ahorrar bandwidth
    quality: 75,
    
    // Dominios permitidos (agregar si usas imágenes externas)
    domains: [
      // 'your-supabase-project.supabase.co', // Para Storage de Supabase
    ],
  },
  
  // Configuraciones experimentales para optimización
  experimental: {
    // Optimizar CSS
    optimizeCss: true,
    
    // Optimizar imports de paquetes específicos
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'recharts',
      'date-fns',
    ],
    
    // Habilitar Server Components cuando sea posible
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  
  // Headers de caché optimizados
  async headers() {
    return [
      {
        // Caché para assets estáticos
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Caché para imágenes
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Caché corto para páginas
        source: '/((?!api).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Caché para API routes
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
  
  // Redirects para optimizar SEO y evitar duplicados
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  
  // Configuración de Webpack optimizada
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimizaciones para el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Tree shaking mejorado
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
      
      // Split chunks optimizado
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk separado para librerías grandes
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          // Chunk separado para Supabase
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            priority: 20,
            chunks: 'all',
          },
          // Chunk separado para UI components
          ui: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'ui',
            priority: 20,
            chunks: 'all',
          },
          // Chunk separado para charts
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            name: 'charts',
            priority: 20,
            chunks: 'all',
          },
        },
      },
    };
    
    // Plugin para analizar bundle size en desarrollo
    if (dev && process.env.ANALYZE_BUNDLE) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BUNDLE_ANALYZE': JSON.stringify(true),
        })
      );
    }
    
    // Optimización de módulos
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
          plugins: [
            // Plugin para remover console.log en producción
            ...(dev ? [] : [['transform-remove-console', { exclude: ['error', 'warn'] }]]),
          ],
        },
      },
    });
    
    return config;
  },
  
  // Configuración de output para optimizar el build
  output: 'standalone',
  
  // Configuración de TypeScript
  typescript: {
    // Ignorar errores de TypeScript en build (solo para emergencias)
    ignoreBuildErrors: false,
  },
  
  // Configuración de ESLint
  eslint: {
    // Ignorar errores de ESLint en build (solo para emergencias)
    ignoreDuringBuilds: false,
  },
  
  // Variables de entorno públicas optimizadas
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Configuración de páginas para pre-renderizado
  async generateStaticParams() {
    // Pre-generar páginas estáticas cuando sea posible
    return [
      { slug: 'dashboard' },
      { slug: 'students' },
      { slug: 'incidents' },
    ];
  },
  
  // Configuración de revalidación
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite para optimizar rutas de API
        {
          source: '/api/v1/:path*',
          destination: '/api/:path*',
        },
      ],
    };
  },
  
  // Configuración de PoweredByHeader
  poweredByHeader: false,
  
  // Configuración de trailing slash
  trailingSlash: false,
  
  // Configuración de reactStrictMode
  reactStrictMode: true,
  
  // Configuración de SWC minify
  swcMinify: true,
  
  // Configuración de compiler
  compiler: {
    // Remover console.log en producción
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    
    // Optimizar styled-components si se usa
    styledComponents: true,
  },
  
  // Configuración de modularizeImports para optimizar imports
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },
};

// Configuración específica para diferentes entornos
if (process.env.NODE_ENV === 'development') {
  // Configuraciones solo para desarrollo
  nextConfig.experimental = {
    ...nextConfig.experimental,
    // Habilitar fast refresh
    fastRefresh: true,
  };
}

if (process.env.NODE_ENV === 'production') {
  // Configuraciones solo para producción
  nextConfig.experimental = {
    ...nextConfig.experimental,
    // Optimizaciones adicionales para producción
    optimizeServerReact: true,
  };
}

// Exportar configuración con bundle analyzer
module.exports = withBundleAnalyzer(nextConfig);

// Configuración adicional para monitoreo
if (process.env.MONITOR_BUNDLE_SIZE) {
  const originalConfig = module.exports;
  
  module.exports = (phase, { defaultConfig }) => {
    const config = typeof originalConfig === 'function' 
      ? originalConfig(phase, { defaultConfig })
      : originalConfig;
    
    // Agregar plugin personalizado para monitorear tamaño
    const originalWebpack = config.webpack;
    config.webpack = (webpackConfig, options) => {
      if (originalWebpack) {
        webpackConfig = originalWebpack(webpackConfig, options);
      }
      
      // Plugin personalizado para reportar tamaño de bundle
      webpackConfig.plugins.push({
        apply: (compiler) => {
          compiler.hooks.done.tap('BundleSizeMonitor', (stats) => {
            const assets = stats.toJson().assets;
            const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
            const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
            
            console.log(`📦 Bundle total size: ${totalSizeMB}MB`);
            
            // Alertar si el bundle es muy grande
            if (totalSize > 5 * 1024 * 1024) { // 5MB
              console.warn('⚠️  Bundle size is larger than 5MB!');
            }
          });
        },
      });
      
      return webpackConfig;
    };
    
    return config;
  };
}