'use client';

import React from 'react';
import Magnet from '@/components/Magnet';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';

type MagnetButtonProps = React.ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants> & {
    magnetStrength?: number;
  };

export default function MagnetButton({
  children,
  className,
  magnetStrength = 1.5,
  ...props
}: MagnetButtonProps) {
  return (
    <Magnet magnetStrength={magnetStrength} padding={80}>
      <Button className={cn('rounded-2xl', className)} {...props}>
        {children}
      </Button>
    </Magnet>
  );
}
