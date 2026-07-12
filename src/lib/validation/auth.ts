import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must include a special character');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((value) => value, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { key: 'number', label: 'Includes a number', test: (value: string) => /[0-9]/.test(value) },
  {
    key: 'special',
    label: 'Includes a special character',
    test: (value: string) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
  },
] as const;

export const TRAINER_SIGNUP_STEPS = ['Account', 'Verify', 'Sign in'] as const;
