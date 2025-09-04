import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Create a service role client for admin operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  try {
    const { users } = await request.json();
    
    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: 'Users array is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Bulk importing ${users.length} users via admin API`);
    
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Process each user
    for (const user of users) {
      try {
        console.log(`📤 Creating user: ${user.email}`);
        console.log(`📤 User data:`, { 
          email: user.email, 
          name: user.name, 
          role: user.role, 
          dni: user.dni,
          password: user.password ? '***' : 'MISSING'
        });
        
        // Create user in auth (without metadata to avoid unexpected_failure error)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true // Auto-confirm email
        });

        if (authError) {
          console.error(`❌ Auth error for ${user.email}:`, authError);
          console.error(`❌ Auth error details:`, {
            message: authError.message,
            status: authError.status
          });
          
          if (authError.message.includes('already registered') || 
              authError.message.includes('duplicate') ||
              authError.message.includes('already exists')) {
            results.skipped++;
            console.log(`⏭️ User ${user.email} already exists, skipping`);
          } else {
            results.errors.push(`${user.email}: ${authError.message}`);
          }
          continue;
        }

        if (!authData.user) {
          console.error(`❌ No user data returned for ${user.email}`);
          results.errors.push(`${user.email}: No user data returned`);
          continue;
        }

        console.log(`✅ Auth user created: ${user.email} with ID: ${authData.user.id}`);

        // Update the auto-created profile with correct data
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            name: user.name,
            email: user.email,
            role: user.role,
            dni: user.dni
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error(`❌ Profile error for ${user.email}:`, profileError);
          console.error(`❌ Profile error details:`, {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          results.errors.push(`${user.email}: Profile creation failed - ${profileError.message}`);
          continue;
        }

        results.imported++;
        console.log(`✅ Successfully imported: ${user.email}`);

      } catch (error) {
        console.error(`❌ Unexpected error importing ${user.email}:`, error);
        results.errors.push(`${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`📊 Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors`);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('❌ Bulk import API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
