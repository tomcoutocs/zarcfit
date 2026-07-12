import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnimatedPage from '@/components/layout/AnimatedPage';
import AppAmbient from '@/components/layout/AppAmbient';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell flex min-h-screen flex-col bg-background">
      <AppAmbient />
      <Header />
      <main className="relative flex-1">
        <AnimatedPage ambient={false}>{children}</AnimatedPage>
      </main>
      <Footer />
    </div>
  );
}
