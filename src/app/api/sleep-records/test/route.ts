import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getRegularClient() {
  if (!supabaseUrl || !anonKey) return null;
  return createClient(supabaseUrl, anonKey);
}

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: Request) {
  try {
    const sleepRecord = await request.json();
    const supabase = getRegularClient();
    const supabaseAdmin = getAdminClient();

    console.log('TEST API: Environment Check:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!anonKey,
      hasServiceKey: !!serviceRoleKey,
    });

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.',
        },
        { status: 500 }
      );
    }

    if (!sleepRecord || !sleepRecord.user_id || !sleepRecord.date) {
      return NextResponse.json({ error: 'Invalid sleep record data' }, { status: 400 });
    }

    const regularResult = supabase
      ? await supabase.from('sleep_tracking').insert([sleepRecord]).select().single()
      : { data: null, error: { message: 'Anon client not configured' } };

    const adminResult = await supabaseAdmin
      .from('sleep_tracking')
      .insert([sleepRecord])
      .select()
      .single();

    if (adminResult.error) {
      return NextResponse.json(
        {
          error: 'Database error',
          message: adminResult.error.message,
          regularClientError: regularResult.error?.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      adminResult: adminResult.data,
      regularClientWorked: !regularResult.error,
    });
  } catch (e) {
    console.error('TEST API Exception:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';

    return NextResponse.json({ error: 'Server error', message: errorMessage }, { status: 500 });
  }
}
