import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-client';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin client not available' },
        { status: 500 }
      );
    }

    console.log('🔄 Fetching profiles via admin API...');
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, dni')
      .order('name');

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} profiles`);
    return NextResponse.json({ data: data || [] });
    
  } catch (error) {
    console.error('💥 Unexpected error in profiles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}