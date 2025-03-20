import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add the get_auth_uid function via RPC
export async function setupAuthUidFunction() {
  try {
    // Create the function to get auth.uid()
    const { error } = await supabase.rpc('create_get_auth_uid_function', {});
    if (error) {
      console.error('Error creating get_auth_uid function:', error);
      
      // If it fails, provide SQL for manual creation
      console.log(`
      To create the get_auth_uid function, run this SQL in your Supabase dashboard:
      
      CREATE OR REPLACE FUNCTION get_auth_uid()
      RETURNS uuid
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT auth.uid();
      $$;
      `);
    }
  } catch (e) {
    console.error('Exception setting up auth.uid function:', e);
  }
} 