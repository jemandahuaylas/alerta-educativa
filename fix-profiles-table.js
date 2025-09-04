// Script para agregar las columnas faltantes a la tabla profiles
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixProfilesTable() {
  try {
    console.log('🔧 Adding missing columns to profiles table...')
    
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync('add-missing-columns.sql', 'utf8')
    
    // Dividir en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`Executing ${commands.length} SQL commands...`)
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim()) {
        console.log(`\n${i + 1}. Executing: ${command.substring(0, 50)}...`)
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command
        })
        
        if (error) {
          // Intentar método alternativo para comandos DDL
          console.log('Trying alternative method...')
          
          try {
            // Para ALTER TABLE, usar método directo
            if (command.includes('ALTER TABLE')) {
              console.log('⚠️ DDL command detected, may need manual execution in Supabase dashboard')
              console.log('Command:', command)
            }
          } catch (altError) {
            console.error('❌ Alternative method failed:', altError)
          }
        } else {
          console.log('✅ Command executed successfully')
        }
      }
    }
    
    // Verificar que las columnas se agregaron
    console.log('\n🔍 Verifying table structure after changes...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError)
    } else {
      console.log('✅ Updated table structure:')
      console.log('Available columns:', Object.keys(verifyData))
    }
    
  } catch (error) {
    console.error('💥 Error fixing profiles table:', error)
  }
}

fixProfilesTable()