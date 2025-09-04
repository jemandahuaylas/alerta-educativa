import { createClient } from '@supabase/supabase-js'

// IMPORTANT: These are placeholder variables.
// You will need to create a .env.local file in the root of your project
// and add your Supabase URL and Anon Key to it.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Mejorar persistencia de sesión
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configurar storage para cookies
    storage: {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key)
        }
        return null
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value)
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key)
        }
      },
    },
  },
  global: {
    headers: {
      'x-client-info': 'alerta-educativa@1.0.0',
    },
  },
})
