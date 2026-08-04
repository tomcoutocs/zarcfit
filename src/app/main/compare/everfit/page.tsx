import type { Metadata } from 'next';
import CompetitorCompareLayout from '@/components/main/CompetitorCompareLayout';
import { COMPETITORS } from '@/lib/competitor-comparison';

export const metadata: Metadata = {
  title: 'ZarcFit vs Everfit',
  description:
    'An honest, feature-by-feature comparison of ZarcFit and Everfit for solo fitness coaches — pricing, nutrition add-ons, automation, and where each platform is stronger.',
};

export default function CompareEverfitPage() {
  return <CompetitorCompareLayout competitor={COMPETITORS.everfit} />;
}
