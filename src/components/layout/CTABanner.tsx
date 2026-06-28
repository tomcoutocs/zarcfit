import React from 'react';
import { cn } from '@/lib/utils';

interface CTABannerProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function CTABanner({ title, description, children, className }: CTABannerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8 text-center md:p-12',
        className
      )}
    >
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative">
        <h2 className="mb-3 text-2xl font-bold md:text-3xl">{title}</h2>
        {description && (
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
