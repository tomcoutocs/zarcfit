'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import AnimatedContent from '@/components/AnimatedContent';
import SpotlightCard from '@/components/SpotlightCard';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  delay?: number;
}

const SPOTLIGHT = 'rgba(72, 120, 150, 0.12)';

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  delay = 0,
}: FeatureCardProps) {
  return (
    <AnimatedContent distance={40} delay={delay} duration={0.6} className={className}>
      <SpotlightCard
        spotlightColor={SPOTLIGHT}
        className="!h-full !rounded-xl !border-border !bg-card !p-6 transition-colors hover:!border-primary/30"
      >
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="mb-2 text-base font-medium">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </SpotlightCard>
    </AnimatedContent>
  );
}
