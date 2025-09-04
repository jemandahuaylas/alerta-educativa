const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkPermissionsTable() {
  console.log('🔍 Checking permissions table structure...');
  
  try {
    // Try to get table columns using RPC
    console.log('\n1. Trying to get table columns using RPC...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_table_columns', { table_name: 'permissions' });
    
    if (rpcError) {
      console.log('❌ RPC method failed:', rpcError.message);
    } else {
      console.log('✅ RPC columns:', rpcData);
    }
    
    // Try information_schema approach
    console.log('\n2. Trying information_schema approach...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'permissions')
      .eq('table_schema', 'public');
    
    if (schemaError) {
      console.log('❌ Schema query failed:', schemaError.message);
    } else {
      console.log('✅ Schema columns:', schemaData);
    }
    
    // Try different column combinations to find what works
    console.log('\n3. Testing different column combinations...');
    const testColumns = [
      ['id'],
      ['id', 'student_id'],
      ['id', 'student_id', 'request_date'],
      ['id', 'student_id', 'date'],
      ['id', 'student_id', 'status'],
      ['id', 'student_id', 'created_at'],
      ['id', 'student_id', 'updated_at'],
      ['id', 'student_id', 'deleted_at'],
      ['id', 'student_id', 'description'],
      ['id', 'student_id', 'type'],
      ['id', 'student_id', 'permission_type'],
      ['id', 'student_id', 'permission_types'],
      ['id', 'student_id', 'registered_by'],
      ['id', 'student_id', 'approved_by'],
      ['id', 'student_id', 'approved_at'],
      ['id', 'student_id', 'type', 'date', 'status'],
      ['id', 'student_id', 'type', 'reason'],
      ['id', 'student_id', 'reason']
    ];
    
    for (const columns of testColumns) {
      try {
        const { data, error } = await supabase
          .from('permissions')
          .select(columns.join(', '))
          .limit(0);
        
        if (!error) {
          console.log(`✅ Valid columns: ${columns.join(', ')}`);
        }
      } catch (e) {
        // Silent fail for testing
      }
    }
    
    // Try SELECT * with RLS bypass
    console.log('\n4. Trying SELECT * with RLS bypass...');
    const { data: allData, error: allError } = await supabase
      .from('permissions')
      .select('*')
      .limit(1);
    
    if (allError) {
      console.log('❌ SELECT * failed:', allError.message);
    } else {
      console.log('✅ SELECT * succeeded');
      if (allData && allData.length > 0) {
        console.log('📋 Sample record structure:', Object.keys(allData[0]));
        console.log('📋 Sample data:', allData[0]);
      } else {
        console.log('📋 Table is empty, attempting test insertion...');
        
        // Try test insertion to reveal schema
        const testRecord = {
          student_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
          type: 'Salida temprana',
          reason: 'Cita médica',
          date: new Date().toISOString().split('T')[0]
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('permissions')
          .insert(testRecord)
          .select()
          .single();
        
        if (insertError) {
          console.log('❌ Test insertion failed:', insertError.message);
          console.log('💡 This error reveals expected schema');
        } else {
          console.log('✅ Test insertion succeeded');
          console.log('📋 Inserted record structure:', Object.keys(insertData));
          console.log('📋 Full schema from insertion:', insertData);
          
          // Clean up test record
          await supabase
            .from('permissions')
            .delete()
            .eq('id', insertData.id);
          console.log('🧹 Test record deleted');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPermissionsTable().then(() => {
  console.log('\n✅ Permissions table check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});