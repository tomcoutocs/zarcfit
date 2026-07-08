'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { completeAuthFromUrl } from '@/lib/supabase/auth-callback';
import { homeForRole, type AppUserRole } from '@/lib/auth-routes';

function AuthCallbackContent() {
  const [message, setMessage] = useState('Processing your sign-in...');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const redirectAfterAuth = async (supabase: ReturnType<typeof createSupabaseBrowserClient>) => {
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .maybeSingle();

      let role = roleRow?.role as AppUserRole | undefined;
      if (!role) {
        const { data: ensuredRole } = await supabase.rpc('ensure_client_role');
        role = (ensuredRole as AppUserRole | null) ?? 'client';
      }

      router.replace(homeForRole(role));
    };

    const handleCallback = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: callbackError, handled } = await completeAuthFromUrl(supabase);

        if (!handled) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            setError(sessionError.message);
            return;
          }
          if (session) {
            setMessage('Sign-in successful! Redirecting...');
            await redirectAfterAuth(supabase);
            return;
          }
          setError('No authentication data found. Please try signing in again.');
          return;
        }

        if (callbackError) {
          setError(callbackError);
          return;
        }

        setMessage('Sign-in successful! Redirecting...');
        window.history.replaceState({}, '', '/auth/callback');
        await redirectAfterAuth(supabase);
      } catch (err) {
        console.error('Error during auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="glass-card w-full max-w-md border-border/60">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Authentication</CardTitle>
          <CardDescription>
            {error ? 'Authentication Error' : 'Completing your sign-in'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {!error && (
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
          )}

          <p className={error ? 'text-destructive text-center text-sm' : 'text-center text-sm text-muted-foreground'}>
            {error || message}
          </p>

          {error && (
            <Button variant="outline" className="mt-4 w-full" onClick={() => router.push('/auth/login')}>
              Return to login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
