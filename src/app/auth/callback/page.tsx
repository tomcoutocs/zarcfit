'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { completeAuthFromUrl } from '@/lib/supabase/auth-callback';
import { homeForRole } from '@/lib/auth-routes';
import { fetchOrEnsureUserRole } from '@/lib/supabase/ensure-user-role';
import AuthShell from '@/components/layout/AuthShell';
import { AuthFormCard, AuthSpinner, AuthStepView } from '@/components/auth/auth-ui';

function AuthCallbackContent() {
  const [message, setMessage] = useState('Processing your sign-in...');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const redirectAfterAuth = async (supabase: ReturnType<typeof createSupabaseBrowserClient>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const role = await fetchOrEnsureUserRole(supabase, user);
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
    <AuthShell title="Signing you in" subtitle="Completing authentication">
      <AuthFormCard
        title="Authentication"
        description={error ? 'Authentication error' : 'Completing your sign-in'}
      >
        <AuthStepView stepKey={error ? 'error' : 'loading'}>
          <div className="flex flex-col items-center space-y-4 py-4">
            {!error && <AuthSpinner className="py-4" />}
            <p
              className={
                error ? 'text-center text-sm text-destructive' : 'text-center text-sm text-muted-foreground'
              }
            >
              {error || message}
            </p>
            {error && (
              <Button
                variant="outline"
                className="mt-2 w-full rounded-2xl"
                onClick={() => router.push('/auth/login')}
              >
                Return to login
              </Button>
            )}
          </div>
        </AuthStepView>
      </AuthFormCard>
    </AuthShell>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthSpinner className="min-h-screen" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
