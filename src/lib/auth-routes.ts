export type AppUserRole = 'admin' | 'trainer' | 'client';

const ROLE_PRIORITY: Record<AppUserRole, number> = {
  admin: 3,
  trainer: 2,
  client: 1,
};

/** When a user has multiple roles, pick the highest-privilege one for routing. */
export function pickPrimaryRole(
  roles: Array<AppUserRole | string | null | undefined>
): AppUserRole | null {
  let best: AppUserRole | null = null;
  let bestPriority = 0;

  for (const role of roles) {
    if (role !== 'admin' && role !== 'trainer' && role !== 'client') continue;
    const priority = ROLE_PRIORITY[role];
    if (priority > bestPriority) {
      best = role;
      bestPriority = priority;
    }
  }

  return best;
}

/** Post-login landing path for a role. Users without a role go to the home page. */
export function homeForRole(role: AppUserRole | null | undefined): string {
  if (role === 'trainer') return '/trainer/dashboard';
  if (role === 'admin') return '/admin';
  if (role === 'client') return '/client';
  return '/';
}
