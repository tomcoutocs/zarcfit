'use client';

import { AuthProvider } from '@/context/auth-context';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
} 