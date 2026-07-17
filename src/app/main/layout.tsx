import React from 'react';
import SplitPillNav from '@/components/layout/SplitPillNav';
import Footer from '@/components/layout/Footer';
import AnimatedPage from '@/components/layout/AnimatedPage';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell flex min-h-screen flex-col bg-background">
      <SplitPillNav />
      <main className="relative flex-1 pt-20">
        <AnimatedPage ambient={false}>{children}</AnimatedPage>
      </main>
      <Footer />
    </div>
  );
}
