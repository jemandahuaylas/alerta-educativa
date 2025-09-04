// Script de prueba para verificar la conexión a Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Service Key exists:', !!supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  try {
    console.log('\n🔍 Testing profiles table access...')
    
    // Test 1: List all profiles
    const { data: profiles, error: listError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (listError) {
      console.error('❌ Error listing profiles:', listError)
    } else {
      console.log('✅ Profiles found:', profiles?.length || 0)
      if (profiles && profiles.length > 0) {
        console.log('First profile:', profiles[0])
      }
    }
    
    // Test 2: Try to update a profile if one exists
    if (profiles && profiles.length > 0) {
      const testProfile = profiles[0]
      console.log('\n🔄 Testing profile update...')
      
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testProfile.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Error updating profile:', updateError)
      } else {
        console.log('✅ Profile updated successfully:', updateData)
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

testConnection()