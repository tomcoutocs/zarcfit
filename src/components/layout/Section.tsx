import React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  variant?: 'default' | 'muted' | 'accent';
}

export default function Section({
  children,
  className,
  id,
  variant = 'default',
}: SectionProps) {
  const variants = {
    default: 'bg-background',
    muted: 'bg-muted/30',
    accent: 'bg-primary/5 border-y border-primary/10',
  };

  return (
    <section id={id} className={cn('py-16 md:py-20', variants[variant], className)}>
      <div className="container mx-auto px-4">{children}</div>
    </section>
  );
}
