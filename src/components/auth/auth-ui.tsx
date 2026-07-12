'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Eye, EyeOff, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SpotlightCard from '@/components/SpotlightCard';
import ShinyText from '@/components/ShinyText';
import { cn } from '@/lib/utils';
import { PASSWORD_REQUIREMENTS } from '@/lib/validation/auth';

export function AuthSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex justify-center py-10', className)}>
      <motion.div
        className="h-11 w-11 rounded-full border-2 border-primary/20 border-t-primary"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

type AuthProgressProps = {
  steps: readonly string[];
  currentStep: number;
};

export function AuthProgress({ steps, currentStep }: AuthProgressProps) {
  return (
    <div className="mb-5 flex items-start justify-center gap-1">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <React.Fragment key={step}>
            <div className="flex w-[4.5rem] flex-col items-center gap-1.5">
              <motion.div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
                  isComplete && 'bg-primary text-primary-foreground shadow-[0_0_24px_oklch(0.58_0.08_200_/_0.35)]',
                  isCurrent &&
                    'border border-primary/40 bg-primary/10 text-primary shadow-[0_0_28px_oklch(0.58_0.08_200_/_0.2)]',
                  !isComplete &&
                    !isCurrent &&
                    'border border-border/50 bg-background/20 text-muted-foreground'
                )}
                animate={isCurrent ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={{ duration: 2.2, repeat: isCurrent ? Infinity : 0, ease: 'easeInOut' }}
              >
                {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
              </motion.div>
              <span
                className={cn(
                  'text-center text-[11px] font-medium leading-tight',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mt-[1.125rem] h-px w-6 shrink-0 rounded-full transition-all duration-500',
                  stepNumber < currentStep
                    ? 'bg-gradient-to-r from-primary/70 to-primary/20'
                    : 'bg-border/60'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

type AuthFormCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  progress?: AuthProgressProps;
};

export function AuthFormCard({ title, description, children, footer, progress }: AuthFormCardProps) {
  return (
    <SpotlightCard className="p-0">
      <div className="space-y-2 border-b border-border/20 px-6 pb-5 pt-6 text-center md:px-8">
        {progress && <AuthProgress {...progress} />}
        <h2 className="text-2xl font-bold tracking-tight">
          <ShinyText
            text={title}
            speed={3.2}
            color="oklch(0.92 0.004 260)"
            shineColor="oklch(0.72 0.08 200)"
            spread={100}
            className="text-2xl font-bold"
          />
        </h2>
        {description && (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="px-6 py-5 md:px-8">{children}</div>

      {footer && (
        <div className="flex flex-col gap-4 border-t border-border/20 px-6 pb-6 pt-5 md:px-8">
          {footer}
        </div>
      )}
    </SpotlightCard>
  );
}

type AuthStepViewProps = {
  stepKey: string;
  children: React.ReactNode;
  className?: string;
};

export function AuthStepView({ stepKey, children, className }: AuthStepViewProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className={cn('flex flex-col gap-5', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  showRequirements?: boolean;
  autoComplete?: string;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  showRequirements = false,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2.5">
      {(label || onBlur !== undefined) && (
        <div className="flex items-center justify-between">
          {label ? (
            <label htmlFor={id} className="text-sm font-medium leading-none text-foreground/90">
              {label}
            </label>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>
      )}
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className="auth-input"
      />
      {showRequirements && value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {PASSWORD_REQUIREMENTS.map((requirement) => {
            const met = requirement.test(value);
            return (
              <span
                key={requirement.key}
                className={cn(
                  'auth-pill',
                  met
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Check className={cn('h-3 w-3', !met && 'opacity-25')} />
                {requirement.label}
              </span>
            );
          })}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function AuthFieldInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn('auth-input', props.className)} />;
}

export function AuthInfoAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3.5">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export function SocialAuthDivider({ label = 'Or continue with' }: { label?: string }) {
  return (
    <div className="relative py-2">
      <div className="organic-divider" />
      <div className="relative flex justify-center">
        <span className="bg-card/80 px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

type SocialAuthButtonsProps = {
  onGoogle: () => void;
  onApple: () => void;
  loadingProvider: string | null;
  disabled?: boolean;
};

export function SocialAuthButtons({
  onGoogle,
  onApple,
  loadingProvider,
  disabled,
}: SocialAuthButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        type="button"
        onClick={onGoogle}
        disabled={disabled || !!loadingProvider}
        className="h-12 rounded-2xl border-border/50 bg-background/30 hover:bg-background/50"
      >
        {loadingProvider === 'google' ? 'Connecting...' : 'Google'}
      </Button>
      <Button
        variant="outline"
        type="button"
        onClick={onApple}
        disabled={disabled || !!loadingProvider}
        className="h-12 rounded-2xl border-border/50 bg-background/30 hover:bg-background/50"
      >
        {loadingProvider === 'apple' ? 'Connecting...' : 'Apple'}
      </Button>
    </div>
  );
}

type AuthStatusPanelProps = {
  icon?: 'mail' | 'shield';
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
};

export function AuthStatusPanel({
  icon = 'mail',
  title,
  description,
  action,
  secondaryAction,
}: AuthStatusPanelProps) {
  const Icon = icon === 'shield' ? ShieldCheck : Mail;

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="relative mb-5">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-6 w-full">{action}</div>}
      {secondaryAction && <div className="mt-3 w-full">{secondaryAction}</div>}
    </div>
  );
}

export function AuthFooterLink({
  prompt,
  href,
  label,
  className,
}: {
  prompt: string;
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('text-center text-sm', className)}>
      <p className="text-muted-foreground">
        {prompt}{' '}
        <Link href={href} className="font-medium text-primary transition-colors hover:text-primary/80">
          {label}
        </Link>
      </p>
    </div>
  );
}

export function AuthPrimaryButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="white"
      className="h-12 w-full rounded-2xl font-semibold shadow-[0_12px_40px_-18px_oklch(1_0_0_/_0.8)]"
      {...props}
    />
  );
}
