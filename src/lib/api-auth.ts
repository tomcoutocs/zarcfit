import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function getSessionClient() {
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
        // Session refresh is handled by middleware.
      },
    },
  });
}

type AuthSuccess = {
  supabase: NonNullable<Awaited<ReturnType<typeof getSessionClient>>>;
  user: { id: string; email?: string };
};

type AuthFailure = { response: NextResponse };

export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const supabase = await getSessionClient();
  if (!supabase) {
    return { response: NextResponse.json({ error: 'Server not configured' }, { status: 500 }) };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { supabase, user: { id: user.id, email: user.email } };
}

export async function requireTrainer(): Promise<AuthSuccess | AuthFailure> {
  const auth = await requireAuth();
  if ('response' in auth) return auth;

  const { data: roles } = await auth.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', auth.user.id);

  const allowed = roles?.some((row) => row.role === 'trainer' || row.role === 'admin');
  if (!allowed) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return auth;
}

export function verifyInternalSecret(request: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get('x-internal-secret');
  return header === secret;
}
