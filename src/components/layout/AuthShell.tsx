'use client';

import React from 'react';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import AnimatedContent from '@/components/AnimatedContent';

interface AuthShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="relative z-10 hidden w-1/2 border-r border-border bg-muted/30 lg:flex lg:items-center lg:justify-end">
        <div className="w-full max-w-md space-y-10 px-10 pr-14 xl:pr-24">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl font-semibold tracking-tight">ZarcFit</span>
          </Link>

          <blockquote>
            <p className="font-display text-2xl font-semibold leading-snug tracking-tight">
              Run your coaching business from one place.
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">
              Programs, clients, messaging, and progress — built for independent trainers.
            </footer>
          </blockquote>

          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Build and assign workout programs
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Meal plans with macro tracking
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Clients join through your invitation
            </li>
          </ul>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-10 xl:px-14">
        <AnimatedContent distance={24} duration={0.55} className="relative mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-primary">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="font-display text-xl font-semibold">ZarcFit</span>
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
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </AnimatedContent>
        )}

        <div className="relative w-full max-w-[32rem]">{children}</div>
      </div>
    </div>
  );
}
