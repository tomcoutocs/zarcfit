'use client';

import AnimatedContent from '@/components/AnimatedContent';

type AnimatedPageProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  delay?: number;
};

export default function AnimatedPage({
  children,
  className,
  distance = 24,
  delay = 0,
}: AnimatedPageProps) {
  return (
    <AnimatedContent
      distance={distance}
      delay={delay}
      duration={0.55}
      threshold={0.05}
      className={className}
    >
      {children}
    </AnimatedContent>
  );
}
