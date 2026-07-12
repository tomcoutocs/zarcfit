'use client';

import React from 'react';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import Aurora from '@/components/Aurora';
import AnimatedContent from '@/components/AnimatedContent';
import CountUp from '@/components/CountUp';
import ShinyText from '@/components/ShinyText';
import SplitText from '@/components/SplitText';

interface AuthShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="auth-orb animate-float right-[8%] top-[12%] h-56 w-56 bg-primary/10" />
      <div className="auth-orb animate-float-delayed bottom-[10%] left-[45%] h-44 w-44 bg-primary/5" />

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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/40 bg-background/20 backdrop-blur-sm">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">ZarcFit</span>
          </Link>
        </AnimatedContent>

        <AnimatedContent distance={40} delay={0.1} duration={0.7} className="relative z-10 p-10">
          <blockquote className="max-w-md">
            <SplitText
              text="&ldquo;Transform your body, transform your life.&rdquo;"
              tag="p"
              className="text-2xl font-semibold leading-snug tracking-tight"
              splitType="words"
              delay={40}
              duration={0.9}
            />
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

      <div className="auth-ambient relative flex flex-1 flex-col items-center justify-center p-4 md:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-30 lg:hidden">
          <Aurora colorStops={['#1a1f26', '#3d5566', '#1e2428']} amplitude={0.55} blend={0.45} speed={0.35} />
        </div>

        <AnimatedContent distance={24} duration={0.55} className="relative z-10 mb-8 lg:hidden">
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
            className="relative z-10 mb-6 max-w-md text-center"
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

        <AnimatedContent distance={30} delay={0.1} duration={0.6} className="relative z-10 w-full max-w-md">
          {children}
        </AnimatedContent>
      </div>
    </div>
  );
}
