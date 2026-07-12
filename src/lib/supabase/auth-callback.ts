import type { EmailOtpType, SupabaseClient } from '@supabase/supabase-js';

export type AuthCallbackResult = {
  error: string | null;
  /** True when URL contained auth params and we attempted to establish a session */
  handled: boolean;
};

/** True when the current URL contains Supabase auth callback parameters. */
export function hasAuthCallbackParams(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const url = new URL(window.location.href);

  if (url.searchParams.get('code')) return true;
  if (url.searchParams.get('token_hash')) return true;
  if (url.searchParams.get('token') && url.searchParams.get('email')) return true;

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  if (!hash) return false;

  const params = new URLSearchParams(hash);
  return !!(params.get('access_token') && params.get('refresh_token'));
}

/**
 * Completes Supabase auth from the current browser URL after email confirm,
 * magic links, password reset, or OAuth redirects.
 */
export async function completeAuthFromUrl(
  supabase: SupabaseClient
): Promise<AuthCallbackResult> {
  if (typeof window === 'undefined') {
    return { error: null, handled: false };
  }

  const url = new URL(window.location.href);

  const code = url.searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return { error: error?.message ?? null, handled: true };
  }

  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    return { error: error?.message ?? null, handled: true };
  }

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  if (hash) {
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return { error: error?.message ?? null, handled: true };
    }

    const errorDescription =
      params.get('error_description') ?? params.get('error');
    if (errorDescription) {
      return { error: errorDescription, handled: true };
    }
  }

  const email = url.searchParams.get('email');
  const token = url.searchParams.get('token');
  if (email && token) {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error: error?.message ?? null, handled: true };
  }

  return { error: null, handled: false };
}
