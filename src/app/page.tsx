'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ZarcFitHero from '@/components/landing/ZarcFitHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingTestimonials from '@/components/landing/LandingTestimonials';
import CTABanner from '@/components/layout/CTABanner';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ZarcFitHero />
        <LandingFeatures />
        <LandingTestimonials />

        <section className="border-t border-border/40 py-20 md:py-24">
          <div className="container mx-auto max-w-3xl px-4">
            <CTABanner
              title="Ready to start your fitness journey?"
              description="Join ZarcFit today — structured programs, progress tracking, and coaching that meets you where you are."
            >
              {user ? (
                <Button
                  size="lg"
                  className="glow-primary font-semibold"
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="glow-primary font-semibold"
                  onClick={() => router.push('/auth/signup')}
                >
                  Join ZarcFit — it&apos;s free to start
                </Button>
              )}
            </CTABanner>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
