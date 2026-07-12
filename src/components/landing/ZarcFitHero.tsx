'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import MagnetButton from '@/components/layout/MagnetButton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import Aurora from '@/components/Aurora';
import SplitText from '@/components/SplitText';
import AnimatedContent from '@/components/AnimatedContent';
import CountUp from '@/components/CountUp';

const SOCIAL_AVATARS = [
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=32',
  'https://i.pravatar.cc/150?img=45',
  'https://i.pravatar.cc/150?img=68',
];

export default function ZarcFitHero() {
  const { user } = useAuth();
  const router = useRouter();

  const primaryCta = user
    ? { label: 'Go to Dashboard', href: '/client' }
    : { label: 'Become a trainer', href: '/auth/signup' };

  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden py-12 pb-20 md:py-16 md:pb-28 lg:py-20 lg:pb-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-30">
          <Aurora
            colorStops={['#1a1f26', '#3d5566', '#1e2428']}
            amplitude={0.85}
            blend={0.55}
            speed={0.5}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_var(--background)_92%)]" />
        <div className="absolute inset-0 gradient-mesh opacity-35" />
      </div>

      <div className="container relative z-10 mx-auto flex flex-1 flex-col justify-center px-4 py-6">
        <div className="mx-auto w-full max-w-4xl text-center">
          <AnimatedContent distance={40} duration={0.6}>
            <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              CSCS-certified coaching
            </span>
          </AnimatedContent>

          <SplitText
            text="Train smarter."
            tag="h1"
            className="mb-2 block text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            splitType="words"
            delay={80}
            duration={1}
            textAlign="center"
          />

          <SplitText
            text="Anywhere. Anytime."
            tag="h1"
            className="mb-6 block text-4xl font-semibold leading-[1.1] tracking-tight text-muted-foreground sm:text-5xl md:text-6xl lg:text-7xl"
            splitType="words"
            delay={100}
            duration={1}
            textAlign="center"
          />

          <AnimatedContent distance={50} delay={0.15} duration={0.7}>
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            The coaching platform for trainers — build programs, manage clients, track progress,
            and grow your business with plans that scale as your roster does.
          </p>
          </AnimatedContent>

          <AnimatedContent distance={40} delay={0.25} duration={0.7}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <MagnetButton
                size="lg"
                className="h-12 gap-2 rounded-2xl px-8 text-base font-medium"
                onClick={() => router.push(primaryCta.href)}
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </MagnetButton>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-2xl border-border/60 bg-card/40 px-8 text-base backdrop-blur-sm"
                onClick={() => router.push('/main/plans')}
              >
                Browse plans
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">*Free to explore — no credit card required</p>
          </AnimatedContent>

          <AnimatedContent distance={30} delay={0.35} duration={0.7}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3 pb-4 md:mt-14 md:pb-6">
              <div className="flex -space-x-3">
                {SOCIAL_AVATARS.map((src) => (
                  <Avatar key={src} className="h-9 w-9 border-2 border-background">
                    <AvatarImage src={src} alt="" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Join{' '}
                <span className="font-medium text-foreground">
                  <CountUp to={500} duration={2.5} className="inline" />+
                </span>{' '}
                members training with ZarcFit
              </p>
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
