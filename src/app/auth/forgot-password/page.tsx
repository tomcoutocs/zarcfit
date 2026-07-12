'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
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
import AuthShell from '@/components/layout/AuthShell';
import {
  AuthFieldInput,
  AuthFooterLink,
  AuthFormCard,
  AuthPrimaryButton,
  AuthStatusPanel,
  AuthStepView,
} from '@/components/auth/auth-ui';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validation/auth';

export default function ForgotPasswordPage() {
  const [formError, setFormError] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const { forgotPassword } = useAuth();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setFormError('');

    try {
      const { error } = await forgotPassword(values.email);
      if (error) {
        setFormError(error.message);
        return;
      }

      setSentEmail(values.email);
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error(err);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll send you a recovery link">
      <AuthFormCard
        title="Reset your password"
        description={
          sentEmail
            ? 'Check your inbox for the reset link'
            : "Enter your email address and we'll send you a link to reset your password"
        }
      >
        <AuthStepView stepKey={sentEmail ? 'success' : 'form'}>
          {sentEmail ? (
            <AuthStatusPanel
              icon="mail"
              title="Check your email"
              description={`We sent a password reset link to ${sentEmail}. Open the link in that message to choose a new password.`}
              action={
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSentEmail('');
                    form.reset();
                  }}
                >
                  Send to a different email
                </Button>
              }
              secondaryAction={
                <AuthFooterLink prompt="Remember your password?" href="/auth/login" label="Back to login" />
              }
            />
          ) : (
            <>
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

                  <AuthPrimaryButton type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </AuthPrimaryButton>
                </form>
              </Form>

              <AuthFooterLink
                prompt="Remember your password?"
                href="/auth/login"
                label="Back to login"
              />
            </>
          )}
        </AuthStepView>
      </AuthFormCard>
    </AuthShell>
  );
}
