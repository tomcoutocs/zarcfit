export type AppUserRole = 'admin' | 'trainer' | 'client';

/** Post-login landing path for a role. Users without a role go to the home page. */
export function homeForRole(role: AppUserRole | null | undefined): string {
  if (role === 'trainer') return '/trainer/dashboard';
  if (role === 'admin') return '/admin';
  if (role === 'client') return '/client';
  return '/';
}
