import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a standard Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Create an admin Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const sleepRecord = await request.json();
    
    // Debug info
    console.log('TEST API: Environment Check:', { 
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0
    });
    
    console.log('TEST API: Received data:', {
      ...sleepRecord,
      user_id: sleepRecord.user_id ? `${sleepRecord.user_id.substring(0, 3)}...` : undefined
    });
    
    // Validate the record
    if (!sleepRecord || !sleepRecord.user_id || !sleepRecord.date) {
      return NextResponse.json(
        { error: 'Invalid sleep record data' }, 
        { status: 400 }
      );
    }
    
    // First try with regular client - this will respect RLS
    const regularResult = await supabase
      .from('sleep_tracking')
      .insert([sleepRecord])
      .select()
      .single();
      
    console.log('Regular client result:', {
      success: !regularResult.error,
      error: regularResult.error?.message,
      data: regularResult.data ? 'Has data' : 'No data'
    });
    
    // Then try with admin client - this should bypass RLS
    const adminResult = await supabaseAdmin
      .from('sleep_tracking')
      .insert([sleepRecord])
      .select()
      .single();
      
    console.log('Admin client result:', {
      success: !adminResult.error,
      error: adminResult.error?.message,
      data: adminResult.data ? 'Has data' : 'No data'
    });
    
    // Return success or error based on admin result
    if (adminResult.error) {
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: adminResult.error.message,
          regularClientError: regularResult.error?.message 
        }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      adminResult: adminResult.data,
      regularClientWorked: !regularResult.error
    });
    
  } catch (e) {
    console.error('TEST API Exception:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Server error', message: errorMessage }, 
      { status: 500 }
    );
  }
} 