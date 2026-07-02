'use client';

import { Activity, BarChart3, Brain, Dumbbell, Moon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function LandingFeatures() {
  return (
    <section className="relative border-t border-border/40 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Why ZarcFit</p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to reach your goals
          </h2>
          <p className="text-muted-foreground">
            Science-backed programming, modern tracking tools, and coaching that adapts to you.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, className }) => (
            <div
              key={title}
              className={cn(
                'glass-card group rounded-2xl p-6 transition-all duration-300 hover:border-primary/25 hover:shadow-[0_0_28px_-6px_var(--accent-glow)]',
                className
              )}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20 transition-colors group-hover:bg-primary/25">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
