'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import AnimatedContent from '@/components/AnimatedContent';
import OrganicCard from '@/components/layout/OrganicCard';
import BlurText from '@/components/BlurText';

interface CTABannerProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function CTABanner({ title, description, children, className }: CTABannerProps) {
  return (
    <AnimatedContent distance={40} duration={0.65}>
      <OrganicCard padding="lg" className={cn('text-center', className)}>
        <BlurText
          text={title}
          className="mb-3 block text-2xl font-semibold md:text-3xl"
          animateBy="words"
          delay={80}
          direction="bottom"
        />
        {description && (
          <p className="mx-auto mb-6 max-w-2xl leading-relaxed text-muted-foreground">{description}</p>
        )}
        {children}
      </OrganicCard>
    </AnimatedContent>
  );
}
