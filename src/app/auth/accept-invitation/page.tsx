'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { invitationApi, InvitationPreview } from '@/lib/supabase/trainer-api';
import AuthShell from '@/components/layout/AuthShell';
import { CheckCircle2, XCircle, UserPlus } from 'lucide-react';

type Step = 'loading' | 'invalid' | 'ready' | 'accepting' | 'accepted' | 'error';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const { user, signUp, refreshRole } = useAuth();

  const [step, setStep] = useState<Step>('loading');
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [checkEmailNotice, setCheckEmailNotice] = useState(false);

  // Load invitation preview
  useEffect(() => {
    let isMounted = true;

    async function loadInvitation() {
      if (!token) {
        setStep('invalid');
        setErrorMessage('This invitation link is missing a token.');
        return;
      }

      const preview = await invitationApi.getInvitationByToken(token);

      if (!isMounted) return;

      if (!preview) {
        setStep('invalid');
        setErrorMessage('We couldn\u2019t find this invitation. It may have been removed.');
        return;
      }

      if (preview.status === 'accepted') {
        setStep('accepted');
        setInvitation(preview);
        return;
      }

      if (preview.status === 'expired' || new Date(preview.expires_at) < new Date()) {
        setStep('invalid');
        setErrorMessage('This invitation has expired. Please ask your trainer to send a new one.');
        return;
      }

      if (preview.status === 'cancelled') {
        setStep('invalid');
        setErrorMessage('This invitation has been cancelled.');
        return;
      }

      setInvitation(preview);
      setFirstName(preview.first_name || '');
      setLastName(preview.last_name || '');
      setStep('ready');
    }

    loadInvitation();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const acceptNow = useCallback(async () => {
    setStep('accepting');
    const result = await invitationApi.acceptInvitation(token);

    if (result === 'success') {
      await refreshRole();
      setStep('accepted');
    } else if (result === 'already_accepted') {
      setStep('accepted');
    } else if (result === 'expired') {
      setStep('invalid');
      setErrorMessage('This invitation has expired. Please ask your trainer to send a new one.');
    } else if (result === 'not_authenticated') {
      setStep('ready');
      setAuthError('Please sign in or create an account to accept this invitation.');
    } else if (result === 'email_mismatch') {
      setStep('error');
      setErrorMessage(
        `This invitation was sent to ${invitation?.email}. Please sign out and sign in with that email address to accept it.`
      );
    } else {
      setStep('error');
      setErrorMessage('Something went wrong accepting this invitation. Please try again.');
    }
  }, [token, refreshRole, invitation?.email]);

  // Once the user is authenticated (either they already had a session, or
  // they just signed up/logged in on this page), automatically accept.
  useEffect(() => {
    if (user && invitation && (step === 'ready')) {
      acceptNow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, invitation]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!firstName.trim() || !lastName.trim()) {
      setAuthError('Please enter your first and last name.');
      return;
    }
    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthLoading(true);
    const { error } = await signUp(
      invitation!.email,
      password,
      { firstName, lastName, invitationSignup: 'true' },
      'client'
    );
    setAuthLoading(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    // If email confirmation is required, there's no session yet — ask the
    // user to verify then log in from this same page to finish accepting.
    setCheckEmailNotice(true);
    setAuthMode('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: invitation!.email,
      password,
    });

    setAuthLoading(false);

    if (error) {
      setAuthError(error.message);
    }
    // On success, the `user` effect above will fire automatically and accept.
  };

  const trainerName =
    invitation?.trainer_business_name ||
    [invitation?.trainer_first_name, invitation?.trainer_last_name].filter(Boolean).join(' ') ||
    'your trainer';

  return (
    <AuthShell title="You're Invited" subtitle="Join your trainer on ZarcFit">
      <Card className="glass-card w-full border-border/60 shadow-xl">
        {step === 'loading' && (
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading invitation...</p>
          </CardContent>
        )}

        {step === 'invalid' && (
          <>
            <CardHeader className="text-center">
              <XCircle className="mx-auto mb-2 h-10 w-10 text-destructive" />
              <CardTitle>Invitation Unavailable</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button variant="outline" className="w-full">Return Home</Button>
              </Link>
            </CardContent>
          </>
        )}

        {step === 'error' && (
          <>
            <CardHeader className="text-center">
              <XCircle className="mx-auto mb-2 h-10 w-10 text-destructive" />
              <CardTitle>Something Went Wrong</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setStep('ready')}>Try Again</Button>
            </CardContent>
          </>
        )}

        {step === 'accepting' && (
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            <p className="text-sm text-muted-foreground">Accepting invitation...</p>
          </CardContent>
        )}

        {step === 'accepted' && (
          <>
            <CardHeader className="text-center">
              <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-primary" />
              <CardTitle>You&apos;re All Set!</CardTitle>
              <CardDescription>
                You&apos;re now connected with {trainerName} on ZarcFit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push('/client')}>
                Go to Your Dashboard
              </Button>
            </CardContent>
          </>
        )}

        {step === 'ready' && invitation && (
          <>
            <CardHeader className="text-center">
              <UserPlus className="mx-auto mb-2 h-10 w-10 text-primary" />
              <CardTitle>Join {trainerName} on ZarcFit</CardTitle>
              <CardDescription>
                {invitation.personal_message ||
                  `${trainerName} has invited you to train together on ZarcFit.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authError && (
                <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              {checkEmailNotice && (
                <Alert>
                  <AlertDescription>
                    We sent a verification link to {invitation.email}. Once you&apos;ve verified your
                    email, log in below to finish joining {trainerName}.
                  </AlertDescription>
                </Alert>
              )}

              {!user && !checkEmailNotice && (
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                      authMode === 'signup' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                      authMode === 'login' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    I Have an Account
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={invitation.email} disabled />
              </div>

              {authMode === 'signup' && !checkEmailNotice ? (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={authLoading}>
                    {authLoading ? 'Creating Account...' : 'Create Account & Join'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginPassword">Password</Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={authLoading}>
                    {authLoading ? 'Signing In...' : 'Sign In & Join'}
                  </Button>
                </form>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </AuthShell>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
