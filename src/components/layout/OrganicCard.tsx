'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import SpotlightCard from '@/components/SpotlightCard';

const SPOTLIGHT = 'rgba(88, 160, 180, 0.18)';

type OrganicCardProps = {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

const paddingMap = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function OrganicCard({
  children,
  className,
  interactive = true,
  padding = 'md',
}: OrganicCardProps) {
  if (!interactive) {
    return (
      <div className={cn('organic-surface rounded-[1.75rem] border border-border/40 bg-card/40 backdrop-blur-xl', paddingMap[padding], className)}>
        {children}
      </div>
    );
  }

  return (
    <SpotlightCard
      spotlightColor={SPOTLIGHT}
      className={cn('!rounded-[1.75rem] !border-border/40 !bg-card/40 !p-0 backdrop-blur-xl', className)}
    >
      <div className={paddingMap[padding]}>{children}</div>
    </SpotlightCard>
  );
}
