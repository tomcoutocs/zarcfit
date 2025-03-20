import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Debug environment variables - more detailed debugging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Print detailed environment info for troubleshooting
console.log('API Route - Detailed Environment Check:', { 
  hasUrl: !!supabaseUrl,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : 'missing',
  hasServiceKey: !!serviceRoleKey,
  serviceKeyLength: serviceRoleKey ? serviceRoleKey.length : 0,
  serviceKeyFirstChars: serviceRoleKey ? `${serviceRoleKey.substring(0, 4)}...` : 'missing',
  hasAnonKey: !!anonKey,
  anonKeyLength: anonKey ? anonKey.length : 0
});

// Create a test client with anon key for comparison
const regularClient = createClient(supabaseUrl, anonKey);

// Create admin client with service role key
const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

// Function to handle errors gracefully
const handleError = (error: any) => {
  console.error('API: Error details:', error);
  
  // Extract useful information from the error
  const message = error?.message || 'Unknown error';
  const code = error?.code || 'NO_CODE';
  const details = error?.details || {};
  
  return {
    error: 'Database error',
    message,
    code,
    details
  };
};

export async function POST(request: Request) {
  try {
    // Log whether we have a functioning admin client
    console.log('Sleep Records API called - Admin client check:', { 
      hasAdminClient: !!supabaseAdmin,
      hasServiceKey: !!serviceRoleKey,
      serviceKeyFirstChars: serviceRoleKey ? `${serviceRoleKey.substring(0, 4)}...` : 'none',
      anyEnvVars: Object.keys(process.env).length > 0,
      relevantEnvVars: Object.keys(process.env).filter(key => 
        key.includes('SUPABASE') || key.includes('NEXT')
      ).length
    });

    // Check if service role key is missing
    if (!supabaseAdmin) {
      console.error('API: Missing service role key - cannot create admin client');
      return NextResponse.json({
        error: 'Configuration error',
        message: 'The server is missing the SUPABASE_SERVICE_ROLE_KEY environment variable.',
        hint: 'Make sure you have added the service role key to your .env.local file and restarted the server.'
      }, { status: 500 });
    }

    // Parse the request body
    let sleepRecord;
    try {
      sleepRecord = await request.json();
    } catch (parseError) {
      console.error('API: Error parsing request body:', parseError);
      return NextResponse.json({
        error: 'Invalid request',
        message: 'Could not parse request body as JSON'
      }, { status: 400 });
    }
    
    // Log the incoming record (without sensitive data)
    console.log('API: Received sleep record:', {
      ...sleepRecord,
      user_id: sleepRecord?.user_id ? `${sleepRecord.user_id.substring(0, 3)}...` : undefined
    });
    
    // Validate the record
    if (!sleepRecord || !sleepRecord.user_id || !sleepRecord.date || sleepRecord.sleep_duration_hours === undefined) {
      console.log('API: Invalid sleep record data');
      return NextResponse.json({ 
        error: 'Invalid sleep record data', 
        message: 'Missing required fields in sleep record',
        receivedFields: Object.keys(sleepRecord || {})
      }, { status: 400 });
    }
    
    console.log('API: Inserting sleep record as service role');
    
    // First check with regular client if the issue is actually RLS
    // This helps diagnose if the problem is with RLS or something else
    try {
      const { error: regularError } = await regularClient
        .from('sleep_tracking')
        .insert([sleepRecord])
        .select()
        .single();
        
      if (regularError) {
        console.log('Regular client error (expected if RLS is working):', regularError.message);
      } else {
        console.log('Warning: Regular client insert succeeded - RLS might not be enforced');
      }
    } catch (e) {
      console.error('Error testing regular client:', e);
    }
    
    // Now try with admin client
    try {
      // Insert the record using the admin client (bypasses RLS)
      const { data, error } = await supabaseAdmin
        .from('sleep_tracking')
        .insert([sleepRecord])
        .select()
        .single();
        
      if (error) {
        console.error('API: Error inserting sleep record with admin client:', error);
        return NextResponse.json(handleError(error), { status: 500 });
      }
      
      console.log('API: Record inserted successfully:', data?.id);
      return NextResponse.json(data);
    } catch (insertError) {
      console.error('API: Exception during insert operation:', insertError);
      return NextResponse.json(handleError(insertError), { status: 500 });
    }
  } catch (e: unknown) {
    console.error('API: Unhandled exception in sleep records endpoint:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    
    return NextResponse.json({
      error: 'Server error', 
      message: errorMessage,
      type: typeof e,
      stringified: String(e)
    }, { status: 500 });
  }
} 