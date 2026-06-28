import React from 'react';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

interface AuthShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--accent-glow)_0%,_transparent_45%)] opacity-40" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />

        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ZarcFit</span>
          </Link>
        </div>

        <div className="relative z-10 p-10">
          <blockquote className="max-w-md">
            <p className="text-2xl font-semibold leading-snug tracking-tight">
              &ldquo;Transform your body, transform your life.&rdquo;
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">
              Personalized coaching for every fitness journey
            </footer>
          </blockquote>
        </div>

        <div className="relative z-10 p-10">
          <div className="flex gap-8 text-sm text-muted-foreground">
            <div>
              <p className="text-2xl font-bold text-primary">500+</p>
              <p>Active members</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">8+</p>
              <p>Years experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-4 md:p-8">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
              <Dumbbell className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-bold">ZarcFit</span>
          </Link>
        </div>

        {(title || subtitle) && (
          <div className="mb-6 max-w-md text-center lg:hidden">
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
          </div>
        )}

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
