'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
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
  AuthInfoAlert,
  AuthPrimaryButton,
  AuthStepView,
  PasswordField,
  SocialAuthButtons,
  SocialAuthDivider,
} from '@/components/auth/auth-ui';
import { signupSchema, TRAINER_SIGNUP_STEPS, type SignupFormValues } from '@/lib/validation/auth';

export default function SignupPage() {
  const [formError, setFormError] = useState('');
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signUp, signInWithProvider } = useAuth();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    mode: 'onBlur',
  });

  const passwordValue = form.watch('password');

  const onSubmit = async (values: SignupFormValues) => {
    setFormError('');

    try {
      const { error: signUpError, resentConfirmation } = await signUp(
        values.email,
        values.password,
        {
          firstName: values.firstName,
          lastName: values.lastName,
        },
        'trainer'
      );

      if (signUpError) {
        let errorMessage = signUpError.message;

        if (errorMessage.includes('Database error')) {
          errorMessage =
            'Database error while creating user. Please contact support or try again later.';
        } else if (errorMessage.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please log in instead.';
        }

        setFormError(errorMessage);
        return;
      }

      router.push(
        `/auth/email-verification?email=${encodeURIComponent(values.email)}${
          resentConfirmation ? '&resent=1' : ''
        }`
      );
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      setFormError('An unexpected error occurred. Please try again.');
    }
  };

  const handleSocialSignUp = async (provider: 'google' | 'apple') => {
    const accepted = form.getValues('acceptTerms');
    if (!accepted) {
      form.setError('acceptTerms', {
        message: 'You must accept the terms and conditions',
      });
      return;
    }

    try {
      setSocialLoading(provider);
      setFormError('');
      await signInWithProvider(provider, { signupRole: 'trainer' });
    } catch (err) {
      setFormError('An error occurred with social sign-up. Please try again.');
      console.error(err);
      setSocialLoading(null);
    }
  };

  return (
    <AuthShell>
      <AuthFormCard
        title="Become a trainer"
        description="Create your coaching account on ZarcFit"
        progress={{ steps: TRAINER_SIGNUP_STEPS, currentStep: 1 }}
      >
        <AuthStepView stepKey="signup-form">
          <AuthInfoAlert>
            Looking to train with a coach? Clients join ZarcFit through an invitation from their
            trainer — you cannot create a client account here.
          </AuthInfoAlert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="gap-2">
                      <FormLabel className="text-muted-foreground">First Name</FormLabel>
                      <FormControl>
                        <AuthFieldInput placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="gap-2">
                      <FormLabel className="text-muted-foreground">Last Name</FormLabel>
                      <FormControl>
                        <AuthFieldInput placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel className="text-muted-foreground">Email</FormLabel>
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
                  <FormItem className="gap-0">
                    <PasswordField
                      id="password"
                      label="Password"
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
                  <FormItem className="gap-0">
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

              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <div className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <label className="text-sm leading-relaxed text-muted-foreground">
                        I agree to the{' '}
                        <Link href="/terms" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <AuthPrimaryButton
                  type="submit"
                  disabled={form.formState.isSubmitting || !passwordValue}
                >
                  {form.formState.isSubmitting ? 'Creating Account...' : 'Continue to Verification'}
                </AuthPrimaryButton>

                <AuthFooterLink
                  prompt="Already have an account?"
                  href="/auth/login"
                  label="Sign in"
                />
              </div>

              <div className="space-y-3 pt-2">
                <SocialAuthDivider label="Or sign up with" />
                <SocialAuthButtons
                  onGoogle={() => handleSocialSignUp('google')}
                  onApple={() => handleSocialSignUp('apple')}
                  loadingProvider={socialLoading}
                  disabled={form.formState.isSubmitting}
                />
              </div>
            </form>
          </Form>
        </AuthStepView>
      </AuthFormCard>
    </AuthShell>
  );
}
