'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { completeAuthFromUrl } from '@/lib/supabase/auth-callback';
import AuthShell from '@/components/layout/AuthShell';

function EmailVerificationContent() {
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: callbackError, handled } = await completeAuthFromUrl(supabase);

        if (!handled) {
          // User landed here after signup — no link params yet
          setAwaitingEmail(true);
          setIsVerified(false);
          return;
        }

        if (callbackError) {
          setError(callbackError);
          setIsVerified(false);
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setIsVerified(true);
            // Clean tokens from the URL bar
            window.history.replaceState({}, '', '/auth/email-verification');
          } else {
            setError('Verification succeeded but no session was created. Try signing in.');
          }
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, []);

  const handleContinue = () => {
    router.push(isVerified ? '/client' : '/auth/login');
  };

  return (
    <AuthShell title="Email Verification" subtitle="Confirm your account to get started">
      <Card className="glass-card w-full border-border/60 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            {isVerifying
              ? 'Verifying your email address...'
              : isVerified
                ? 'Your email has been verified!'
                : awaitingEmail
                  ? 'Check your inbox'
                  : 'Email verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {isVerifying ? (
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
          ) : isVerified ? (
            <CheckCircle className="h-16 w-16 text-primary" />
          ) : awaitingEmail ? (
            <CheckCircle className="h-16 w-16 text-muted-foreground" />
          ) : (
            <XCircle className="h-16 w-16 text-destructive" />
          )}

          {error && (
            <Alert variant="destructive" className="mt-4 w-full">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isVerifying && (
            <div className="mt-6 w-full text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                {isVerified
                  ? 'Thank you for verifying your email. You can now access your ZarcFit dashboard.'
                  : awaitingEmail
                    ? 'We sent a confirmation link to your email. Click the link in that message to activate your account.'
                    : 'We were unable to verify your email. Try signing in — your link may have expired — or sign up again.'}
              </p>
              <Button onClick={handleContinue} className="w-full">
                {isVerified ? 'Continue to Dashboard' : 'Back to Login'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      }
    >
      <EmailVerificationContent />
    </Suspense>
  );
}
