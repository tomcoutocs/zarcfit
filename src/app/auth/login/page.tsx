'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/context/auth-context';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { completeAuthFromUrl, hasAuthCallbackParams } from '@/lib/supabase/auth-callback';
import AuthShell from '@/components/layout/AuthShell';
import {
  AuthFieldInput,
  AuthFooterLink,
  AuthFormCard,
  AuthInfoAlert,
  AuthPrimaryButton,
  AuthSpinner,
  AuthStepView,
  PasswordField,
  SocialAuthButtons,
  SocialAuthDivider,
} from '@/components/auth/auth-ui';
import { loginSchema, type LoginFormValues } from '@/lib/validation/auth';

function LoginContent() {
  const [formError, setFormError] = useState('');
  const [verifiedBanner, setVerifiedBanner] = useState(false);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signIn, signInWithProvider } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      if (!hasAuthCallbackParams()) {
        return;
      }

      setIsConfirmingEmail(true);

      try {
        const supabase = createSupabaseBrowserClient();
        const { error: callbackError, handled } = await completeAuthFromUrl(supabase);

        if (!handled) {
          return;
        }

        if (callbackError) {
          setFormError(callbackError);
          return;
        }

        await supabase.auth.signOut({ scope: 'local' });
        setVerifiedBanner(true);
        window.history.replaceState({}, '', '/auth/login');
      } catch (err) {
        console.error('Email confirmation error:', err);
        setFormError('We could not verify your email. The link may have expired.');
      } finally {
        setIsConfirmingEmail(false);
      }
    };

    handleEmailConfirmation();
  }, []);

  const onSubmit = async (values: LoginFormValues) => {
    setFormError('');

    try {
      const { error } = await signIn(values.email, values.password);
      if (error) {
        setFormError(error.message);
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error(err);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    try {
      setSocialLoading(provider);
      setFormError('');
      await signInWithProvider(provider);
    } catch (err) {
      setFormError('An error occurred with social sign-in. Please try again.');
      console.error(err);
      setSocialLoading(null);
    }
  };

  return (
    <AuthShell title="Sign in to ZarcFit" subtitle="Access your personalized dashboard">
      <AuthFormCard
        title="Sign in to ZarcFit"
        description={
          isConfirmingEmail
            ? 'Confirming your email...'
            : 'Enter your email and password to access your account'
        }
        footer={
          !isConfirmingEmail ? (
            <>
              <SocialAuthDivider />
              <SocialAuthButtons
                onGoogle={() => handleSocialSignIn('google')}
                onApple={() => handleSocialSignIn('apple')}
                loadingProvider={socialLoading}
                disabled={form.formState.isSubmitting}
              />
            </>
          ) : undefined
        }
      >
        {isConfirmingEmail ? (
          <AuthSpinner />
        ) : (
          <AuthStepView stepKey="login-form">
            <AuthInfoAlert>
              Clients need an invitation from their trainer to join ZarcFit. If you received an
              invite, use the link in your email to create your account.
            </AuthInfoAlert>

            {verifiedBanner && (
              <Alert className="mb-4">
                <AlertDescription>
                  Your email has been verified. Please sign in with your password.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <AuthFieldInput type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link
                          href="/auth/forgot-password"
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <PasswordField
                        id="password"
                        label=""
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        autoComplete="current-password"
                      />
                    </FormItem>
                  )}
                />

                <AuthPrimaryButton type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
                </AuthPrimaryButton>
              </form>
            </Form>

            <AuthFooterLink
              prompt="Are you a trainer?"
              href="/auth/signup"
              label="Create a trainer account"
            />
          </AuthStepView>
        )}
      </AuthFormCard>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSpinner className="min-h-screen" />}>
      <LoginContent />
    </Suspense>
  );
}
