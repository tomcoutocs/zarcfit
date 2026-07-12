'use client';

import AnimatedContent from '@/components/AnimatedContent';
import AppAmbient from '@/components/layout/AppAmbient';

type AnimatedPageProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  delay?: number;
  ambient?: boolean;
};

export default function AnimatedPage({
  children,
  className,
  distance = 24,
  delay = 0,
  ambient = true,
}: AnimatedPageProps) {
  return (
    <div className="relative">
      {ambient && <AppAmbient />}
      <AnimatedContent
        distance={distance}
        delay={delay}
        duration={0.55}
        threshold={0.05}
        className={className}
      >
        {children}
      </AnimatedContent>
    </div>
  );
}
