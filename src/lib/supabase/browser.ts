import { createBrowserClient } from '@supabase/ssr';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
    );
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL looks invalid. It should be https://YOUR_PROJECT_REF.supabase.co'
    );
  }

  return { url, anonKey };
}

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}

export function isSupabaseConfigured(): boolean {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}

export function getSupabaseConfigError(): string | null {
  try {
    getSupabaseConfig();
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : 'Supabase configuration error';
  }
}

/** Map low-level network failures to a user-readable auth error message. */
export function toAuthNetworkError(err: unknown): { message: string; name: string; status: number } {
  const message =
    err instanceof TypeError && /fetch|network|failed/i.test(err.message)
      ? 'Cannot reach Supabase. Your project URL may be wrong, deleted, or paused — check .env.local and the Supabase dashboard.'
      : err instanceof Error
        ? err.message
        : 'An unexpected error occurred.';

  return { message, name: 'AuthNetworkError', status: 503 };
}
