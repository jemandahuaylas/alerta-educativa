const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncidentsTable() {
  console.log('🔍 Verificando estructura real de la tabla incidents...');
  
  try {
    // Consultar el esquema de la tabla directamente
    console.log('\n1. Consultando esquema de la tabla...');
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'incidents' })
      .single();
    
    if (schemaError) {
      console.log('❌ Error consultando esquema con RPC:', schemaError.message);
      
      // Intentar consulta directa al information_schema
      console.log('\n2. Consultando information_schema...');
      const { data: columnsData, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'incidents')
        .eq('table_schema', 'public');
      
      if (columnsError) {
        console.log('❌ Error consultando information_schema:', columnsError.message);
      } else {
        console.log('✅ Columnas encontradas en information_schema:');
        columnsData.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      }
    } else {
      console.log('✅ Esquema obtenido:', schemaData);
    }
    
    // Intentar diferentes combinaciones de columnas comunes
    const commonColumns = [
      ['id'],
      ['id', 'description'],
      ['id', 'description', 'date'],
      ['id', 'description', 'status'],
      ['id', 'description', 'created_at'],
      ['id', 'incident_types'],
      ['id', 'title'],
      ['id', 'registered_by'],
      ['id', 'approved_by']
    ];
    
    console.log('\n3. Probando combinaciones de columnas...');
    for (const columns of commonColumns) {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select(columns.join(', '))
          .limit(1);
        
        if (!error) {
          console.log(`✅ Columnas válidas: ${columns.join(', ')}`);
          if (data && data.length > 0) {
            console.log('   Datos:', data[0]);
          }
        }
      } catch (err) {
        // Ignorar errores silenciosamente
      }
    }
    
    // Intentar obtener todas las columnas usando SELECT *
    console.log('\n4. Intentando SELECT * para ver estructura...');
    const { data: allData, error: allError } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
    
    if (allError) {
      console.log('❌ Error en SELECT *:', allError.message);
    } else {
      console.log('✅ SELECT * exitoso');
      if (allData && allData.length > 0) {
        console.log('📋 Estructura de la tabla (columnas encontradas):');
        console.log(Object.keys(allData[0]));
        console.log('📄 Datos de ejemplo:', allData[0]);
      } else {
        console.log('⚠️ Tabla vacía, intentando insertar registro de prueba para ver estructura esperada...');
        
        // Intentar insertar para ver qué columnas espera
        const { data: insertData, error: insertError } = await supabase
          .from('incidents')
          .insert({
            description: 'test',
            date: new Date().toISOString(),
            incident_types: ['test'],
            status: 'Pendiente'
          })
          .select()
          .single();
          
        if (insertError) {
          console.log('❌ Error en inserción de prueba:', insertError.message);
          console.log('   Detalles:', insertError.details);
        } else {
          console.log('✅ Inserción exitosa, estructura:');
          console.log(Object.keys(insertData));
          
          // Eliminar el registro de prueba
          await supabase.from('incidents').delete().eq('id', insertData.id);
          console.log('🗑️ Registro de prueba eliminado');
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
  }
}

checkIncidentsTable();