import { createClient } from '@supabase/supabase-js'

// IMPORTANT: These are placeholder variables.
// You will need to create a .env.local file in the root of your project
// and add your Supabase URL and Anon Key to it.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!


// Storage personalizado con manejo de errores mejorado
const customStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = window.localStorage.getItem(key);
      // Verificar si el token es válido antes de devolverlo
      if (item && key.includes('auth-token')) {
        const parsed = JSON.parse(item);
        // Si el refresh_token está corrupto o expirado, limpiar
        if (parsed.refresh_token && parsed.refresh_token === 'undefined') {
          console.warn('🧹 Refresh token corrupto detectado, limpiando...');
          window.localStorage.removeItem(key);
          return null;
        }
      }
      return item;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      // Si hay error leyendo, limpiar la clave corrupta
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.error('Error removing corrupted key:', e);
      }
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      // Validar que el valor no sea undefined o null antes de guardar
      if (value && value !== 'undefined' && value !== 'null') {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Mejorar persistencia de sesión
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configurar storage personalizado con manejo de errores
    storage: customStorage,
    // Configurar manejo de errores de refresh token
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-client-info': 'alerta-educativa@1.0.0',
    },
  },
})

// Agregar listener para manejar errores de autenticación
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('✅ Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
      console.log('🚪 User signed out, clearing storage...');
      // Limpiar storage cuando el usuario se desconecta
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error('Error clearing storage on sign out:', error);
      }
    }
  });

  // Función para limpiar completamente la autenticación
  const clearAuthCompletely = async () => {
    console.warn('🧹 Clearing all authentication data...');
    
    try {
      // Primero intentar sign out normal
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Sign out failed, proceeding with manual cleanup:', error);
    }
    
    // Limpiar localStorage completamente
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // También limpiar sessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  // Manejar errores globales de autenticación
  window.addEventListener('unhandledrejection', async (event) => {
    if (event.reason?.message?.includes('Invalid Refresh Token') || 
        event.reason?.message?.includes('Refresh Token Not Found') ||
        event.reason?.message?.includes('AuthApiError')) {
      console.warn('🔄 Authentication error detected:', event.reason?.message);
      
      // Prevenir que el error se propague inmediatamente
      event.preventDefault();
      
      // Limpiar autenticación completamente
      await clearAuthCompletely();
      
      // Redirigir a login después de limpiar
      setTimeout(() => {
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          console.log('🔄 Redirecting to login...');
          window.location.href = '/login';
        }
      }, 500);
    }
  });
  
  // También manejar errores de fetch que puedan contener errores de auth
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Si la respuesta contiene errores de autenticación
      if (!response.ok && response.status === 401) {
        const text = await response.clone().text();
        if (text.includes('Invalid Refresh Token') || text.includes('Refresh Token Not Found')) {
          console.warn('🔄 Auth error in fetch response, clearing session...');
          await clearAuthCompletely();
          
          setTimeout(() => {
            if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
              window.location.href = '/login';
            }
          }, 500);
        }
      }
      
      return response;
    } catch (error) {
      return originalFetch(...args);
    }
  };
}
