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
              title="Ready to coach on ZarcFit?"
              description="Create your trainer account to manage clients, build programs, and track their progress. Clients join through your invitation."
            >
              {user ? (
                <Button
                  size="lg"
                  className="glow-primary font-semibold"
                  onClick={() => router.push('/client')}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="glow-primary font-semibold"
                  onClick={() => router.push('/auth/signup')}
                >
                  Become a trainer
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
