import type { Metadata } from 'next';
import CompetitorCompareLayout from '@/components/main/CompetitorCompareLayout';
import { COMPETITORS } from '@/lib/competitor-comparison';

export const metadata: Metadata = {
  title: 'ZarcFit vs TrueCoach',
  description:
    'An honest, feature-by-feature comparison of ZarcFit and TrueCoach for solo fitness coaches — pricing, nutrition tools, and where each platform is stronger.',
};

export default function CompareTrueCoachPage() {
  return <CompetitorCompareLayout competitor={COMPETITORS.truecoach} />;
}
