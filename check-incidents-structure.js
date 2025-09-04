const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncidentsStructure() {
  try {
    console.log('🔍 Checking incidents table structure...');
    
    // Try to get one record to see the structure
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying incidents table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Incidents table exists with data');
      console.log('Available columns:', Object.keys(data[0]));
      console.log('Sample data:', data[0]);
    } else {
      console.log('⚠️ Incidents table exists but is empty');
      
      // Try to insert a test record to see what columns are expected
      const { error: insertError } = await supabase
        .from('incidents')
        .insert({})
        .select();
      
      if (insertError) {
        console.log('Insert error reveals expected structure:', insertError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkIncidentsStructure();