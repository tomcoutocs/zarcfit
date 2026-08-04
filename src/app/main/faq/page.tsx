import type { Metadata } from 'next';
import FAQPageClient from './FAQPageClient';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Answers about the ZarcFit coaching platform — how flexible dieting works, billing, plans, and how coaches and clients use the product.',
};

export default function FAQPage() {
  return <FAQPageClient />;
}
