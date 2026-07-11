import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageHero from '@/components/layout/PageHero';
import AnimatedPage from '@/components/layout/AnimatedPage';

export const metadata = {
  title: 'Privacy Policy | ZarcFit',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <PageHero
          badge="Legal"
          title="Privacy Policy"
          subtitle="How we collect, use, and protect your information"
          size="compact"
        />
        <AnimatedPage>
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <div className="space-y-8 text-muted-foreground">
            <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
              <p>
                We collect information you provide directly, such as your name, email address, and profile details,
                as well as fitness data you choose to track (workouts, meals, sleep, goals, and progress). We also
                collect basic usage information to help us operate and improve the Service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
              <p>
                Your information is used to provide and personalize the Service, connect you with your trainer or
                clients, send important account notifications, and improve the reliability and features of ZarcFit.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">3. Sharing Your Information</h2>
              <p>
                If you are a client, your trainer can view the fitness data relevant to your coaching relationship.
                We do not sell your personal information. We may share data with service providers (such as our
                hosting and database provider) strictly to operate the Service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
              <p>
                We use industry-standard practices, including row-level access controls on our database, to protect
                your data. However, no method of transmission or storage is 100% secure.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">5. Your Choices</h2>
              <p>
                You can review, update, or delete much of your personal information directly from your profile
                settings. You may also contact us to request deletion of your account and associated data.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">6. Cookies</h2>
              <p>
                We use cookies to keep you signed in and to remember your preferences. You can control cookies
                through your browser settings, though disabling them may affect the Service&apos;s functionality.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">7. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of material changes by posting
                the new policy on this page.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">8. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please reach out through our{' '}
                <a href="/main/contact" className="text-primary hover:underline">contact page</a>.
              </p>
            </section>
          </div>
        </div>
        </AnimatedPage>
      </main>
      <Footer />
    </div>
  );
}
