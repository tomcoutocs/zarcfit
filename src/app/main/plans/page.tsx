import type { Metadata } from 'next';
import PlansPageClient from './PlansPageClient';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Transparent monthly pricing for solo and small-roster coaches. Nutrition tools included, no per-feature add-ons — see how ZarcFit compares to Everfit and Trainerize.',
};

export default function PlansPage() {
  return <PlansPageClient />;
}
