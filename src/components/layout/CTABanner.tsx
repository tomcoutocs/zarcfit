'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import AnimatedContent from '@/components/AnimatedContent';
import SplitText from '@/components/SplitText';

interface CTABannerProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function CTABanner({ title, description, children, className }: CTABannerProps) {
  return (
    <AnimatedContent distance={40} duration={0.65}>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border bg-card p-8 text-center md:p-12',
          className
        )}
      >
        <div className="relative">
          <SplitText
            text={title}
            tag="h2"
            className="mb-3 block text-2xl font-semibold md:text-3xl"
            splitType="words"
            delay={45}
            duration={0.75}
            textAlign="center"
          />
          {description && (
            <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">{description}</p>
          )}
          {children}
        </div>
      </div>
    </AnimatedContent>
  );
}
