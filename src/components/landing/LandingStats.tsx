'use client';

import AnimatedContent from '@/components/AnimatedContent';
import CountUp from '@/components/CountUp';

const STATS = [
  { value: 500, suffix: '+', label: 'Active members' },
  { value: 40, suffix: '+', label: 'Training programs' },
  { value: 98, suffix: '%', label: 'Client satisfaction' },
  { value: 12, suffix: 'k', label: 'Workouts logged' },
];

export default function LandingStats() {
  return (
    <section className="relative border-y border-border bg-card/40 py-14 md:py-16">
      <div className="container mx-auto px-4">
        <AnimatedContent distance={40} duration={0.7}>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="section-label">Built for real progress</p>
          </div>
        </AnimatedContent>

        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat, index) => (
            <AnimatedContent key={stat.label} distance={50} delay={index * 0.08} duration={0.7}>
              <div className="text-center">
                <p className="text-3xl font-semibold tracking-tight md:text-4xl">
                  <CountUp to={stat.value} duration={2.2} />
                  {stat.suffix}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
