export type AppUserRole = 'admin' | 'trainer' | 'client';

/** Post-login landing path for a role. Defaults to /client when role is missing. */
export function homeForRole(role: AppUserRole | null | undefined): string {
  if (role === 'trainer') return '/trainer/dashboard';
  if (role === 'admin') return '/admin';
  return '/client';
}
