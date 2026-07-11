'use client';

import React from 'react';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import Aurora from '@/components/Aurora';
import AnimatedContent from '@/components/AnimatedContent';
import CountUp from '@/components/CountUp';

interface AuthShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <Aurora colorStops={['#1a1f26', '#3d5566', '#1e2428']} amplitude={0.8} blend={0.5} speed={0.4} />
        </div>
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />

        <AnimatedContent distance={30} duration={0.6} className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">ZarcFit</span>
          </Link>
        </AnimatedContent>

        <AnimatedContent distance={40} delay={0.1} duration={0.7} className="relative z-10 p-10">
          <blockquote className="max-w-md">
            <p className="text-2xl font-semibold leading-snug tracking-tight">
              &ldquo;Transform your body, transform your life.&rdquo;
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">
              Personalized coaching for every fitness journey
            </footer>
          </blockquote>
        </AnimatedContent>

        <AnimatedContent distance={30} delay={0.2} duration={0.7} className="relative z-10 p-10">
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
        </AnimatedContent>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-background p-4 md:p-8">
        <AnimatedContent distance={24} duration={0.55} className="mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Dumbbell className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-semibold">ZarcFit</span>
          </Link>
        </AnimatedContent>

        {(title || subtitle) && (
          <AnimatedContent distance={24} delay={0.05} duration={0.55} className="mb-6 max-w-md text-center lg:hidden">
            {title && <h1 className="text-2xl font-semibold">{title}</h1>}
            {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
          </AnimatedContent>
        )}

        <AnimatedContent distance={30} delay={0.1} duration={0.6} className="w-full max-w-md">
          {children}
        </AnimatedContent>
      </div>
    </div>
  );
}
