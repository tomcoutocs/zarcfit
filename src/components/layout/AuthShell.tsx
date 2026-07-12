'use client';

import React from 'react';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import AnimatedContent from '@/components/AnimatedContent';
import CountUp from '@/components/CountUp';
import ShinyText from '@/components/ShinyText';

interface AuthShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="auth-ambient relative flex min-h-screen overflow-hidden">
      <div className="relative z-10 hidden w-1/2 lg:flex lg:items-center lg:justify-end">
        <div className="w-full max-w-md space-y-10 px-10 pr-14 xl:pr-24">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/40 bg-background/20 backdrop-blur-sm">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">ZarcFit</span>
          </Link>

          <blockquote>
            <p className="text-2xl font-semibold leading-snug tracking-tight">
              &ldquo;Transform your body, transform your life.&rdquo;
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">
              Personalized coaching for every fitness journey
            </footer>
          </blockquote>

          <div className="flex gap-8 text-sm text-muted-foreground">
            <div>
              <p className="text-2xl font-semibold text-foreground">
                <CountUp to={500} duration={2} className="inline" />+
              </p>
              <p>Active members</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                <CountUp to={8} duration={2} className="inline" />+
              </p>
              <p>Years experience</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-10 xl:px-14">
        <AnimatedContent distance={24} duration={0.55} className="relative mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border/40 bg-background/20 backdrop-blur-sm">
              <Dumbbell className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-semibold">ZarcFit</span>
          </Link>
        </AnimatedContent>

        {(title || subtitle) && (
          <AnimatedContent
            distance={24}
            delay={0.05}
            duration={0.55}
            className="relative mb-6 max-w-md text-center"
          >
            {title && (
              <h1 className="text-2xl font-semibold tracking-tight">
                <ShinyText
                  text={title}
                  speed={3.5}
                  color="oklch(0.94 0.004 260)"
                  shineColor="oklch(0.72 0.08 200)"
                  className="text-2xl font-semibold"
                />
              </h1>
            )}
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </AnimatedContent>
        )}

        <div className="relative w-full max-w-[32rem]">
          {children}
        </div>
      </div>
    </div>
  );
}
