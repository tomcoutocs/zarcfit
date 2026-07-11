'use client';

import { Activity, BarChart3, Brain, Dumbbell, Moon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedContent from '@/components/AnimatedContent';
import SpotlightCard from '@/components/SpotlightCard';
import SplitText from '@/components/SplitText';

const FEATURES = [
  {
    icon: Dumbbell,
    title: 'Personalized programs',
    description: 'Training plans built around your schedule, equipment, and goals — not generic templates.',
    className: 'md:col-span-2',
  },
  {
    icon: BarChart3,
    title: 'Progress tracking',
    description: 'Log workouts, sleep, and metrics in one dashboard.',
    className: '',
  },
  {
    icon: Brain,
    title: 'Expert coaching',
    description: 'CSCS-certified guidance with form cues and progression built in.',
    className: '',
  },
  {
    icon: Moon,
    title: 'Recovery insights',
    description: 'Sleep tracking and recovery trends so you train hard and rest smart.',
    className: 'md:col-span-2',
  },
  {
    icon: Users,
    title: 'Community support',
    description: 'Stay motivated alongside members on the same journey.',
    className: '',
  },
  {
    icon: Activity,
    title: 'Adaptive intensity',
    description: 'Programs that scale from beginner foundations to advanced performance.',
    className: '',
  },
];

const SPOTLIGHT = 'rgba(72, 120, 150, 0.12)';

export default function LandingFeatures() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <AnimatedContent distance={40} duration={0.7}>
            <p className="section-label mb-3">Why ZarcFit</p>
          </AnimatedContent>
          <SplitText
            text="Everything you need to reach your goals"
            tag="h2"
            className="mb-4 block text-3xl font-semibold tracking-tight md:text-4xl"
            splitType="words"
            delay={60}
            duration={0.9}
            textAlign="center"
          />
          <AnimatedContent distance={30} delay={0.1} duration={0.7}>
            <p className="text-muted-foreground">
              Science-backed programming, modern tracking tools, and coaching that adapts to you.
            </p>
          </AnimatedContent>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, className }, index) => (
            <AnimatedContent
              key={title}
              distance={60}
              delay={index * 0.06}
              duration={0.75}
              className={cn(className)}
            >
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
          ))}
        </div>
      </div>
    </section>
  );
}
