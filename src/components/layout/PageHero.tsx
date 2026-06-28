import React from 'react';
import { cn } from '@/lib/utils';

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
        'relative overflow-hidden border-b border-border/50',
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute inset-0 gradient-mesh opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-glow)_0%,_transparent_50%)] opacity-30" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {badge && (
            <span className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              {badge}
            </span>
          )}
          <h1 className="text-gradient mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}
