import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AppUserRole } from '@/lib/auth-routes';

function readIntendedSignupRole(user: User): AppUserRole | null {
  const meta = user.user_metadata ?? {};
  const signupRole = meta.signup_role ?? meta.role;

  if (signupRole === 'trainer' || signupRole === 'admin') {
    return signupRole;
  }

  if (
    signupRole === 'client' &&
    (meta.invitation_signup === 'true' || meta.invitation_signup === true)
  ) {
    return 'client';
  }

  return null;
}

export async function fetchOrEnsureUserRole(
  supabase: SupabaseClient,
  user: User
): Promise<AppUserRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user role:', error);
  } else if (data?.role) {
    return data.role as AppUserRole;
  }

  const intendedRole = readIntendedSignupRole(user);
  if (!intendedRole) {
    return null;
  }

  const { data: rpcRole, error: rpcError } = await supabase.rpc('ensure_signup_role');
  if (!rpcError && rpcRole) {
    return rpcRole as AppUserRole;
  }

  const { error: insertError } = await supabase.from('user_roles').insert({
    user_id: user.id,
    role: intendedRole,
  });

  if (insertError) {
    console.warn('Role assignment from signup metadata failed:', insertError);

    const { data: retry } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    return (retry?.role as AppUserRole | undefined) ?? null;
  }

  return intendedRole;
}
