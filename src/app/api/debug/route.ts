import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check connection to Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('count(*)')
      .limit(1);
    
    if (connectionError) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to connect to Supabase',
        error: connectionError
      }, { status: 500 });
    }
    
    // Check if user_profiles table exists and get record count
    const { error: tableError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    // Check authentication
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      status: 'success',
      connection: connectionTest ? 'ok' : 'failed',
      tables: {
        user_profiles: tableError ? 'error' : 'ok'
      },
      auth: authError ? 'error' : 'ok',
      user: authData?.user ? 'authenticated' : 'not authenticated',
      details: {
        connectionError,
        tableError,
        authError
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error in debug endpoint',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 