import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { type Session } from '@supabase/supabase-js';

export interface ConnectionStatus {
  connected: boolean;
  responseTimeMs: number;
  authSessionValid: boolean;
  error: string | null;
  authError: string | null;
  authUidValid?: boolean;
}

export interface ResetResult {
  success: boolean;
  message: string;
  newStatus: ConnectionStatus;
}

/**
 * Checks the Supabase connection status
 */
export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  const startTime = performance.now();
  const supabase = createClientComponentClient();
  
  try {
    // Test the connection by retrieving the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if auth.uid is working
    let authUidValid = false;
    let authError: string | null = null;
    
    try {
      const { error: uidError } = await supabase.rpc('get_auth_uid');
      if (!uidError) {
        authUidValid = true;
      } else {
        authError = uidError.message || 'Unknown auth.uid error';
        console.warn('Auth.uid error:', uidError);
      }
    } catch (e) {
      authError = e instanceof Error ? e.message : 'Unknown auth.uid error';
      console.warn('Failed to check auth.uid function:', e);
    }
    
    const responseTime = performance.now() - startTime;
    
    return {
      connected: true,
      responseTimeMs: responseTime,
      authSessionValid: !!session,
      error: null,
      authError,
      authUidValid
    };
  } catch (e) {
    const responseTime = performance.now() - startTime;
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    
    return {
      connected: false,
      responseTimeMs: responseTime,
      authSessionValid: false,
      error: errorMessage,
      authError: null
    };
  }
}

/**
 * Attempts to reset the Supabase connection by:
 * 1. Clearing local storage
 * 2. Refreshing the auth session
 * 3. Checking the connection again
 */
export async function resetSupabaseConnection(): Promise<ResetResult> {
  const supabase = createClientComponentClient();
  let message = 'Connection reset process completed.';
  let session: Session | null = null;
  
  try {
    // Clear any local storage keys that might be corrupted
    if (typeof window !== 'undefined') {
      // Preserve some keys if needed
      const keysToKeep: Record<string, string> = {};
      
      // Backup the current session
      const { data } = await supabase.auth.getSession();
      session = data.session;
      
      // Clear all Supabase-related keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('_keep_')) {
          try {
            keysToKeep[key] = localStorage.getItem(key) || '';
          } catch (e) {
            console.warn(`Failed to backup localStorage key: ${key}`, e);
          }
        }
      }
      
      // Clear relevant localStorage items
      for (const key in keysToKeep) {
        if (key.includes('supabase') || key.includes('auth')) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove localStorage key: ${key}`, e);
          }
        }
      }
      
      message += ' Local storage cleared.';
    }
    
    // Try to refresh the session
    if (session) {
      try {
        await supabase.auth.refreshSession();
        message += ' Session refreshed.';
      } catch (refreshError) {
        console.warn('Failed to refresh session:', refreshError);
        message += ' Session refresh failed.';
      }
    }
    
    // Attempt to fix auth.uid function by clearing caches
    try {
      await supabase.functions.invoke('clear-rpc-cache', {
        body: { function_name: 'get_auth_uid' }
      });
      message += ' RPC cache cleared.';
    } catch (e) {
      // This is optional and may fail if the function doesn't exist
      console.warn('Failed to clear RPC cache:', e);
    }
    
    // Check if the connection is working again
    const newStatus = await checkSupabaseConnection();
    
    return {
      success: newStatus.connected && newStatus.authSessionValid,
      message,
      newStatus
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error('Error during connection reset:', e);
    
    // Check the connection status after the error
    const newStatus = await checkSupabaseConnection();
    
    return {
      success: false,
      message: `Reset failed: ${errorMessage}`,
      newStatus
    };
  }
}

/**
 * Special function to help debug the auth.uid function
 */
export async function checkAuthUidFunction(): Promise<{ 
  exists: boolean; 
  working: boolean; 
  error: string | null; 
}> {
  const supabase = createClientComponentClient();
  
  try {
    // First check if the function exists
    const { data: functions, error: functionsError } = await supabase
      .from('pg_catalog.pg_proc')
      .select('proname')
      .eq('proname', 'get_auth_uid')
      .single();
      
    if (functionsError) {
      return { 
        exists: false, 
        working: false, 
        error: `Couldn't check if function exists: ${functionsError.message}` 
      };
    }
    
    const exists = !!functions;
    
    // Now try to execute it
    const { error: executionError } = await supabase.rpc('get_auth_uid');
    
    return {
      exists,
      working: !executionError,
      error: executionError ? executionError.message : null
    };
  } catch (e) {
    return {
      exists: false,
      working: false,
      error: e instanceof Error ? e.message : 'Unknown error checking auth.uid function'
    };
  }
} 