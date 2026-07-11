'use client';

import { Star } from 'lucide-react';
import AnimatedContent from '@/components/AnimatedContent';
import SpotlightCard from '@/components/SpotlightCard';
import SplitText from '@/components/SplitText';

const TESTIMONIALS = [
  {
    quote:
      "ZarcFit completely changed how I train. The structured programs and sleep tracking helped me lose 30 pounds while getting stronger.",
    author: 'Sarah M.',
    role: 'Member · 8 months',
  },
  {
    quote:
      'Having a real coach in my pocket — with programs that actually fit my life — is the difference between quitting and staying consistent.',
    author: 'Michael T.',
    role: 'Member · 1 year',
  },
  {
    quote:
      'The dashboard keeps me honest. I can see my progress week over week, and the programming pushes me without burning out.',
    author: 'James R.',
    role: 'Member · 5 months',
  },
];

const SPOTLIGHT = 'rgba(72, 120, 150, 0.1)';

export default function LandingTestimonials() {
  return (
    <section className="relative border-t border-border/40 bg-card/20 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <AnimatedContent distance={40} duration={0.7}>
            <p className="section-label mb-3">Success stories</p>
          </AnimatedContent>
          <SplitText
            text="Real results from real people"
            tag="h2"
            className="block text-3xl font-semibold tracking-tight md:text-4xl"
            splitType="words"
            delay={60}
            duration={0.9}
            textAlign="center"
          />
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, index) => (
            <AnimatedContent key={t.author} distance={50} delay={index * 0.1} duration={0.75}>
              <SpotlightCard
                spotlightColor={SPOTLIGHT}
                className="!flex !h-full !flex-col !rounded-xl !border-border !bg-card !p-6"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="mb-6 flex-1 text-sm leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-primary">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
