'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';

const PROGRAMS = [
  {
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=500&fit=crop',
    category: 'BEGINNER',
    title: 'Foundation strength',
    href: '/main/programs',
  },
  {
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=500&fit=crop',
    category: 'INTERMEDIATE',
    title: 'Core stability flow',
    href: '/main/programs',
  },
  {
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=500&fit=crop',
    category: 'ADVANCED',
    title: 'Performance sprint',
    href: '/main/programs',
  },
  {
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=500&fit=crop',
    category: 'ALL LEVELS',
    title: 'Full-body bootcamp',
    href: '/main/programs',
  },
  {
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=500&fit=crop',
    category: 'RECOVERY',
    title: 'Mobility & recovery',
    href: '/main/programs',
  },
];

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
    : { label: 'Start training', href: '/auth/signup' };

  return (
    <section className="relative overflow-hidden pb-8 pt-8 md:pt-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-[100px]" />
        <div className="animate-float-delayed absolute -right-24 top-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="animate-float absolute bottom-32 left-1/3 h-72 w-72 rounded-full bg-teal-400/10 blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_var(--background)_72%)]" />
        <div className="absolute inset-0 gradient-mesh opacity-60" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            CSCS-certified coaching
          </span>

          <h1 className="text-gradient mb-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Train smarter.
            <br />
            <span className="text-foreground/90">Anywhere. Anytime.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Guided fitness programs tailored to your goals — strength, endurance, or recovery.
            Structured coaching, real progress tracking, and a community that keeps you accountable.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="glow-primary h-12 gap-2 px-8 text-base font-semibold"
              onClick={() => router.push(primaryCta.href)}
            >
              {primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-border/60 bg-card/40 px-8 text-base backdrop-blur-sm"
              onClick={() => router.push('/main/programs')}
            >
              Browse programs
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">*Free to explore — no credit card required</p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <div className="flex -space-x-3">
              {SOCIAL_AVATARS.map((src) => (
                <Avatar key={src} className="h-9 w-9 border-2 border-background">
                  <AvatarImage src={src} alt="" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Join <span className="font-medium text-foreground">500+</span> members training with ZarcFit
            </p>
          </div>
        </div>

        <div className="relative mt-16 md:mt-20">
          <div className="mb-6 flex items-end justify-between gap-4 px-1">
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Featured programs</p>
              <h2 className="mt-1 text-xl font-bold md:text-2xl">Pick your next challenge</h2>
            </div>
            <Link
              href="/main/programs"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PROGRAMS.map((program) => (
              <Link
                key={program.title}
                href={program.href}
                className="group relative w-[220px] shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-[0_0_30px_-8px_var(--accent-glow)] sm:w-[260px]"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="260px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-[10px] font-bold tracking-widest text-primary">{program.category}</span>
                    <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{program.title}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
