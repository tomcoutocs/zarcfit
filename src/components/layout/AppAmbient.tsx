'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export default function AppAmbient({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="auth-ambient absolute inset-0 opacity-80" />
      <div className="auth-orb animate-float right-[6%] top-[8%] h-64 w-64 bg-primary/8" />
      <div className="auth-orb animate-float-delayed bottom-[12%] left-[10%] h-48 w-48 bg-primary/5" />
      <div className="auth-orb animate-float bottom-[35%] right-[20%] h-32 w-32 bg-primary/6" />
    </div>
  );
}
