'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Aurora from '@/components/Aurora';
import SplitText from '@/components/SplitText';
import AnimatedContent from '@/components/AnimatedContent';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
  size?: 'default' | 'large' | 'compact';
}

export default function PageHero({
  title,
  subtitle,
  badge,
  children,
  className,
  size = 'default',
}: PageHeroProps) {
  const sizeClasses = {
    large: 'py-24 md:py-32',
    default: 'py-16 md:py-24',
    compact: 'py-12 md:py-16',
  };

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border bg-card/30',
        sizeClasses[size],
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <Aurora colorStops={['#1a1f26', '#3d5566', '#1e2428']} amplitude={0.75} blend={0.5} speed={0.4} />
      </div>
      <div className="absolute inset-0 gradient-mesh opacity-40" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {badge && (
            <AnimatedContent distance={30} duration={0.5}>
              <span className="mb-4 inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
                {badge}
              </span>
            </AnimatedContent>
          )}
          <SplitText
            text={title}
            tag="h1"
            className="mb-4 block text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl"
            splitType="words"
            delay={50}
            duration={0.85}
            textAlign="center"
          />
          {subtitle && (
            <AnimatedContent distance={35} delay={0.08} duration={0.6}>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">{subtitle}</p>
            </AnimatedContent>
          )}
          {children && (
            <AnimatedContent distance={30} delay={0.15} duration={0.6} className="mt-8">
              {children}
            </AnimatedContent>
          )}
        </div>
      </div>
    </section>
  );
}
