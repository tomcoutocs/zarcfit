'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormField,
  FormItem,
} from '@/components/ui/form';
import { useAuth } from '@/context/auth-context';
import AuthShell from '@/components/layout/AuthShell';
import {
  AuthFormCard,
  AuthPrimaryButton,
  AuthSpinner,
  AuthStatusPanel,
  AuthStepView,
  PasswordField,
} from '@/components/auth/auth-ui';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { completeAuthFromUrl } from '@/lib/supabase/auth-callback';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validation/auth';

export default function ResetPasswordPage() {
  const [formError, setFormError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const { resetPassword } = useAuth();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const passwordValue = form.watch('password');

  useEffect(() => {
    const establishSession = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: callbackError, handled } = await completeAuthFromUrl(supabase);

        if (handled && callbackError) {
          setFormError(callbackError);
          setSessionReady(false);
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          setSessionReady(!!session);
          if (handled && session) {
            window.history.replaceState({}, '', '/auth/reset-password');
          }
        }
      } catch (err) {
        console.error(err);
        setFormError('Invalid or expired reset link. Please request a new one.');
      } finally {
        setCheckingLink(false);
      }
    };

    establishSession();
  }, []);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setFormError('');

    try {
      const { error } = await resetPassword(values.password);
      if (error) {
        setFormError(error.message);
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error(err);
    }
  };

  return (
    <AuthShell title="Set new password" subtitle="Choose a strong password for your account">
      <AuthFormCard
        title="Create new password"
        description={
          checkingLink
            ? 'Validating your reset link...'
            : sessionReady
              ? 'Enter a new password for your account'
              : 'This reset link is no longer valid'
        }
      >
        {checkingLink ? (
          <AuthSpinner />
        ) : (
          <AuthStepView stepKey={sessionReady ? 'form' : 'invalid'}>
            {!sessionReady ? (
              <AuthStatusPanel
                icon="shield"
                title="Link expired"
                description={
                  formError ||
                  'This reset link is invalid or has expired. Request a new link to continue.'
                }
                action={
                  <Button asChild className="w-full">
                    <Link href="/auth/forgot-password">Request new reset link</Link>
                  </Button>
                }
                secondaryAction={
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/login">Back to login</Link>
                  </Button>
                }
              />
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {formError && (
                    <Alert variant="destructive">
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <PasswordField
                          id="password"
                          label="New Password"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          showRequirements
                          autoComplete="new-password"
                        />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <PasswordField
                          id="confirmPassword"
                          label="Confirm Password"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                          autoComplete="new-password"
                        />
                      </FormItem>
                    )}
                  />

                  <AuthPrimaryButton
                    type="submit"
                    disabled={form.formState.isSubmitting || !passwordValue}
                  >
                    {form.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </AuthPrimaryButton>
                </form>
              </Form>
            )}
          </AuthStepView>
        )}
      </AuthFormCard>
    </AuthShell>
  );
}
