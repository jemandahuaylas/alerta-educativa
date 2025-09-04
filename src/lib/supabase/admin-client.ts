import { createClient } from '@supabase/supabase-js'

// Cliente administrativo con service role key para operaciones privilegiadas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Solo crear el cliente admin si estamos en el servidor y tenemos la service key
let supabaseAdmin: ReturnType<typeof createClient> | null = null

if (typeof window === 'undefined' && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-client-info': 'alerta-educativa-admin@1.0.0',
      },
    },
  })
}

export { supabaseAdmin }