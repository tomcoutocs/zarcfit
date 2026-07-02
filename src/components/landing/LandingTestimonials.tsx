'use client';

import { Star } from 'lucide-react';

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

export default function LandingTestimonials() {
  return (
    <section className="relative border-t border-border/40 bg-card/20 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Success stories</p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Real results from real people</h2>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              className="glass-card flex flex-col rounded-2xl p-6 transition-all hover:border-primary/20"
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
