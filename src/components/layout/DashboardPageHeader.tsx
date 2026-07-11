'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import AnimatedContent from '@/components/AnimatedContent';
import SplitText from '@/components/SplitText';

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
        <SplitText
          text={title}
          tag="h1"
          className="block text-2xl font-semibold tracking-tight md:text-3xl"
          splitType="words"
          delay={40}
          duration={0.7}
          textAlign="left"
        />
        {description && (
          <p className="mt-1 text-sm text-muted-foreground md:text-base">{description}</p>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </AnimatedContent>
  );
}
