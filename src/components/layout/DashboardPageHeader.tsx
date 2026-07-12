'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import AnimatedContent from '@/components/AnimatedContent';
import BlurText from '@/components/BlurText';

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function DashboardPageHeader({
  title,
  description,
  children,
  className,
}: DashboardPageHeaderProps) {
  return (
    <AnimatedContent
      distance={28}
      duration={0.55}
      threshold={0.05}
      className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <div>
        <BlurText
          text={title}
          className="block text-2xl font-semibold tracking-tight md:text-3xl"
          animateBy="words"
          delay={60}
          direction="bottom"
        />
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{description}</p>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </AnimatedContent>
  );
}
