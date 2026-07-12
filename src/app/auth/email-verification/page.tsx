'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { completeAuthFromUrl } from '@/lib/supabase/auth-callback';
import { useAuth } from '@/context/auth-context';
import AuthShell from '@/components/layout/AuthShell';
import {
  AuthFormCard,
  AuthSpinner,
  AuthStatusPanel,
  AuthStepView,
} from '@/components/auth/auth-ui';
import { TRAINER_SIGNUP_STEPS } from '@/lib/validation/auth';

function EmailVerificationContent() {
  const [error, setError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resendSignupConfirmation } = useAuth();
  const emailFromQuery = searchParams.get('email') ?? '';
  const [resendEmail, setResendEmail] = useState(emailFromQuery);
  const wasResent = searchParams.get('resent') === '1';

  useEffect(() => {
    setResendEmail(emailFromQuery);
  }, [emailFromQuery]);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: callbackError, handled } = await completeAuthFromUrl(supabase);

        if (!handled) {
          setAwaitingEmail(true);
          setIsVerified(false);
          return;
        }

        if (callbackError) {
          setError(callbackError);
          setIsVerified(false);
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            await supabase.auth.signOut({ scope: 'local' });
            setIsVerified(true);
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
    router.push('/auth/login');
  };

  const handleResend = async () => {
    if (!resendEmail.trim()) {
      setError('Enter the email address you used to sign up.');
      return;
    }

    setIsResending(true);
    setError('');
    setResendMessage('');

    const { error: resendError } = await resendSignupConfirmation(resendEmail.trim());
    setIsResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setResendMessage('Confirmation email sent. Check your inbox and spam folder.');
  };

  const stepKey = isVerifying ? 'verifying' : isVerified ? 'verified' : awaitingEmail ? 'awaiting' : 'failed';

  return (
    <AuthShell title="Verify your email" subtitle="One more step before you can sign in">
      <AuthFormCard
        title="Email verification"
        description={
          isVerifying
            ? 'Verifying your email address...'
            : isVerified
              ? 'Your email has been verified'
              : awaitingEmail
                ? 'Check your inbox'
                : 'Verification failed'
        }
        progress={{ steps: TRAINER_SIGNUP_STEPS, currentStep: 2 }}
      >
        <AuthStepView stepKey={stepKey}>
          {isVerifying ? (
            <AuthSpinner />
          ) : isVerified ? (
            <AuthStatusPanel
              icon="shield"
              title="Email verified"
              description="Your account is ready. Sign in with the email and password you created during registration."
              action={
                <Button className="h-11 w-full rounded-2xl" onClick={handleContinue}>
                  Continue to Sign In
                </Button>
              }
            />
          ) : awaitingEmail ? (
            <AuthStatusPanel
              icon="mail"
              title={wasResent ? 'Confirmation resent' : 'Check your inbox'}
              description={
                wasResent
                  ? `We resent a confirmation link${resendEmail ? ` to ${resendEmail}` : ''}. Click the link in that message, then sign in on the login page.`
                  : `We sent a confirmation link${resendEmail ? ` to ${resendEmail}` : ''}. Click the link in that message, then sign in on the login page.`
              }
              action={
                <div className="space-y-3">
                  {!emailFromQuery && (
                    <div className="space-y-2 text-left">
                      <Label htmlFor="resendEmail">Email address</Label>
                      <Input
                        id="resendEmail"
                        type="email"
                        placeholder="your.email@example.com"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        className="auth-input"
                      />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-2xl border-border/50 bg-background/30"
                    onClick={handleResend}
                    disabled={isResending}
                  >
                    {isResending ? 'Sending...' : 'Resend confirmation email'}
                  </Button>
                  <Button className="h-11 w-full rounded-2xl" onClick={handleContinue}>
                    Go to Sign In
                  </Button>
                </div>
              }
            />
          ) : (
            <AuthStatusPanel
              icon="shield"
              title="Verification failed"
              description={
                error ||
                'We were unable to verify your email. Try signing in — your link may have expired — or sign up again.'
              }
              action={
                <Button className="h-11 w-full rounded-2xl" onClick={handleContinue}>
                  Back to Sign In
                </Button>
              }
            />
          )}
        </AuthStepView>

        {resendMessage && (
          <Alert className="mt-4">
            <AlertDescription>{resendMessage}</AlertDescription>
          </Alert>
        )}

        {error && !isVerifying && awaitingEmail && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </AuthFormCard>
    </AuthShell>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={<AuthSpinner className="min-h-screen" />}>
      <EmailVerificationContent />
    </Suspense>
  );
}
