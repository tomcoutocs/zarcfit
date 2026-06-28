import { createBrowserClient } from '@supabase/ssr';

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder';

function readSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  return { url, anonKey };
}

function getSupabaseConfig() {
  const { url, anonKey } = readSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.'
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
  try {
    const { url, anonKey } = getSupabaseConfig();
    return createBrowserClient(url, anonKey);
  } catch {
    // Allow production builds when env vars are not yet set (e.g. first Vercel deploy).
    return createBrowserClient(PLACEHOLDER_URL, PLACEHOLDER_KEY);
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = readSupabaseEnv();
  return Boolean(url && anonKey && url.includes('.supabase.co'));
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
