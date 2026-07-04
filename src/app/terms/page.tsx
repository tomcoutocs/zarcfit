import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageHero from '@/components/layout/PageHero';

export const metadata = {
  title: 'Terms of Service | ZarcFit',
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <PageHero
          badge="Legal"
          title="Terms of Service"
          subtitle="Please read these terms carefully before using ZarcFit"
          size="compact"
        />
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <div className="space-y-8 text-muted-foreground">
            <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By creating an account or otherwise using ZarcFit (&quot;the Service&quot;), you agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
              <p>
                ZarcFit provides tools for fitness tracking, coaching, nutrition planning, and communication between
                trainers and clients. Features and availability may change over time.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">3. Your Account</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all
                activity that occurs under your account. Notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">4. Health Disclaimer</h2>
              <p>
                ZarcFit is not a substitute for professional medical advice. Consult a physician before beginning any
                new exercise or nutrition program, particularly if you have any pre-existing health conditions.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">5. Trainer-Client Relationships</h2>
              <p>
                Trainers using ZarcFit are independent professionals. ZarcFit facilitates the connection and
                communication between trainers and clients but is not a party to any coaching agreement between them.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">6. Termination</h2>
              <p>
                We may suspend or terminate your access to the Service at any time for conduct that violates these
                terms or is otherwise harmful to other users or the Service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">7. Changes to These Terms</h2>
              <p>
                We may update these Terms of Service from time to time. Continued use of the Service after changes
                take effect constitutes acceptance of the revised terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">8. Contact Us</h2>
              <p>
                If you have any questions about these Terms of Service, please reach out through our{' '}
                <a href="/main/contact" className="text-primary hover:underline">contact page</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
