import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Security note: this route previously inserted records using the Supabase
// service role key while trusting a `user_id` field from the request body —
// meaning any caller could write sleep data for any user in the database,
// completely bypassing RLS. It now authenticates the request via the
// caller's own session cookies and always inserts as that user, so the
// normal `auth.uid() = user_id` RLS policy on `sleep_tracking` does its job.
async function getSessionClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

  if (!url || !anonKey) return null;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Route handlers can't set cookies on the incoming request; the
        // session is refreshed by middleware, not here.
      },
    },
  });
}

const handleError = (error: unknown) => {
  const err = error as { message?: string; code?: string; details?: unknown };
  return {
    error: 'Database error',
    message: err?.message || 'Unknown error',
    code: err?.code || 'NO_CODE',
    details: err?.details || {},
  };
};

export async function POST(request: Request) {
  try {
    const supabase = await getSessionClient();

    if (!supabase) {
      return NextResponse.json({
        error: 'Configuration error',
        message: 'The server is missing Supabase environment variables.',
      }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'You must be signed in to create a sleep record.',
      }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        error: 'Invalid request',
        message: 'Could not parse request body as JSON',
      }, { status: 400 });
    }

    if (!body || !body.date || body.sleep_duration_hours === undefined) {
      return NextResponse.json({
        error: 'Invalid sleep record data',
        message: 'Missing required fields in sleep record',
        receivedFields: Object.keys(body || {}),
      }, { status: 400 });
    }

    // Always insert as the authenticated caller — never trust a user_id
    // supplied by the client.
    const sleepRecord = { ...body, user_id: user.id };

    const { data, error } = await supabase
      .from('sleep_tracking')
      .insert([sleepRecord])
      .select()
      .single();

    if (error) {
      console.error('Error inserting sleep record:', error);
      return NextResponse.json(handleError(error), { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error('Unhandled exception in sleep records endpoint:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';

    return NextResponse.json({
      error: 'Server error',
      message: errorMessage,
    }, { status: 500 });
  }
}
