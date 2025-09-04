// Script para verificar la estructura de la tabla profiles
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkTableStructure() {
  try {
    console.log('🔍 Checking profiles table structure...')
    
    // Obtener información de las columnas de la tabla profiles
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' })
    
    if (error) {
      console.log('Using alternative method to check structure...')
      
      // Método alternativo: obtener un registro y ver sus campos
      const { data: sampleData, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        .single()
      
      if (sampleError) {
        console.error('❌ Error getting sample data:', sampleError)
      } else {
        console.log('✅ Sample profile structure:')
        console.log('Available columns:', Object.keys(sampleData))
        console.log('Sample data:', sampleData)
      }
    } else {
      console.log('✅ Table columns:', data)
    }
    
  } catch (error) {
    console.error('💥 Error checking table structure:', error)
  }
}

checkTableStructure()