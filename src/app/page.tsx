'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Dumbbell, Target, Users, Zap, ArrowRight, Star } from 'lucide-react';
import FeatureCard from '@/components/layout/FeatureCard';
import Section from '@/components/layout/Section';
import CTABanner from '@/components/layout/CTABanner';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_var(--background)_70%)]" />

        {!user && (
          <div className="absolute right-4 top-4 z-20 flex gap-2 md:right-8 md:top-8">
            <Button variant="outline" className="border-border/60 bg-card/50 backdrop-blur-sm" onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
            <Button className="glow-primary font-semibold" onClick={() => router.push('/auth/signup')}>
              Get Started
            </Button>
          </div>
        )}

        <div className="container relative z-10 mx-auto flex flex-col items-center px-4 py-24 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Zap className="h-3.5 w-3.5" />
            Professional Fitness Coaching
          </span>

          <h1 className="text-gradient mb-6 max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Transform Your Body, Transform Your Life
          </h1>

          <p className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Join ZarcFit for personalized training programs, expert coaching, and a supportive community to help you achieve your fitness goals.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <>
                <Button size="lg" className="glow-primary gap-2 font-semibold" onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-border/60 bg-card/50" onClick={() => router.push('/main/programs')}>
                  Browse Programs
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="glow-primary gap-2 font-semibold" onClick={() => router.push('/auth/signup')}>
                  Start Your Journey
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-border/60 bg-card/50" onClick={() => router.push('/main/programs')}>
                  View Programs
                </Button>
              </>
            )}
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <span>500+ happy members</span>
            </div>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <span>Certified CSCS coaching</span>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <span>Personalized programs</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <Section variant="muted">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Why Choose ZarcFit?</h2>
          <p className="text-muted-foreground">Everything you need to reach your goals, backed by science and real coaching experience.</p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard icon={Target} title="Personalized Programs" description="Custom training plans designed specifically for your goals, fitness level, and preferences." />
          <FeatureCard icon={Dumbbell} title="Expert Coaching" description="Guidance from certified fitness professionals with years of hands-on experience." />
          <FeatureCard icon={Users} title="Community Support" description="Join a community of like-minded individuals on the same journey to better health." />
        </div>
      </Section>

      {/* Testimonials */}
      <Section>
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Success Stories</h2>
          <p className="text-muted-foreground">Real results from real people.</p>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {[
            { quote: "ZarcFit completely transformed my approach to fitness. I've lost 30 pounds and feel stronger than ever!", author: 'Sarah M.' },
            { quote: 'The personalized workout plans and nutrition guidance helped me achieve results I never thought possible.', author: 'Michael T.' },
          ].map((t) => (
            <div key={t.author} className="glass-card rounded-2xl p-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4 text-lg leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <p className="font-semibold text-primary">{t.author}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="accent">
        <div className="mx-auto max-w-3xl">
          <CTABanner
            title="Ready to Start Your Fitness Journey?"
            description="Join ZarcFit today and take the first step toward a healthier, stronger you."
          >
            {user ? (
              <Button size="lg" className="glow-primary font-semibold" onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            ) : (
              <Button size="lg" className="glow-primary font-semibold" onClick={() => router.push('/auth/signup')}>
                Join ZarcFit Now
              </Button>
            )}
          </CTABanner>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/20 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">ZarcFit</span>
              </div>
              <p className="text-sm text-muted-foreground">Professional fitness coaching for everyone.</p>
            </div>
            {[
              { title: 'Programs', links: [['Strength Training', '/main/programs'], ['Weight Loss', '/main/programs'], ['Muscle Building', '/main/programs']] },
              { title: 'Resources', links: [['Blog', '/main/blog'], ['FAQ', '/main/faq'], ['Contact Us', '/main/contact']] },
              { title: 'Legal', links: [['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">{col.title}</h3>
                <ul className="space-y-2 text-sm">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-muted-foreground hover:text-primary">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ZarcFit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
