'use client';

import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import PageHero from '@/components/layout/PageHero';

type FaqItem = {
  id: string;
  question: string;
  answer: React.ReactNode;
  category: 'general' | 'billing' | 'coaching' | 'technical';
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'general-1',
    category: 'general',
    question: 'What is ZarcFit, exactly?',
    answer: (
      <>
        <p className="mb-4">ZarcFit is a coaching platform, not a coaching service — it&apos;s the software independent trainers use to run their own client roster. If you&apos;re a client, you&apos;ll use it because your coach invited you onto it.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Program builder your coach uses to assign your workouts</li>
          <li>Nutrition tools — full meal plans or flexible, macros-first tracking</li>
          <li>Direct messaging with your coach</li>
          <li>One app for workouts, meals, sleep, and progress</li>
        </ul>
      </>
    ),
  },
  {
    id: 'general-2',
    category: 'general',
    question: 'How long does it take to see results with a program on ZarcFit?',
    answer: (
      <p className="mb-4">That depends on the program your coach builds for you and how consistently you follow it — ZarcFit is the platform, your coach sets the plan. Most people following a consistent program notice energy improvements in 2–4 weeks and visible changes in 8–12 weeks.</p>
    ),
  },
  {
    id: 'general-3',
    category: 'general',
    question: 'Do I need special equipment for my workouts?',
    answer: (
      <p>Equipment depends on the program your coach assigns — home workouts may need minimal gear, gym programs use standard equipment, and bodyweight-only options are common too.</p>
    ),
  },
  {
    id: 'general-4',
    category: 'general',
    question: 'Does ZarcFit support flexible dieting, or only full meal plans?',
    answer: (
      <p>Both. Coaches can build full meal plans with specific foods, or set flexible dieting targets (calories and macros only) and let clients choose their own foods within those numbers via the food diary. Neither mode costs extra — nutrition tools are included on Growth and Pro plans.</p>
    ),
  },
  {
    id: 'billing-1',
    category: 'billing',
    question: 'How does trainer pricing work?',
    answer: (
      <p className="mb-4">
        Review tiers on our <a href="/main/plans" className="text-primary underline">Plans page</a>. Creating a trainer account is free; paid tiers checkout via Stripe.
      </p>
    ),
  },
  {
    id: 'billing-2',
    category: 'billing',
    question: 'Can I pause or cancel my membership?',
    answer: (
      <p>
        Manage your subscription from <a href="/trainer/settings" className="text-primary underline">Trainer Settings → Billing</a>. Stripe&apos;s customer portal supports pause, cancel, and payment updates.
      </p>
    ),
  },
  {
    id: 'billing-3',
    category: 'billing',
    question: 'Do you offer refunds if I\'m not satisfied?',
    answer: (
      <p>
        We offer a 14-day satisfaction guarantee on paid trainer plans. Contact support within 14 days of your first charge. See our <a href="/terms" className="text-primary underline">Terms of Service</a>.
      </p>
    ),
  },
  {
    id: 'coaching-1',
    category: 'coaching',
    question: 'How can I contact customer support?',
    answer: (
      <p>
        Email support@zarcfit.com or use our <Link href="/main/contact" className="text-primary underline">contact form</Link>. We typically respond within 24–48 hours.
      </p>
    ),
  },
  {
    id: 'coaching-2',
    category: 'coaching',
    question: 'Does ZarcFit vet or certify the coaches who use the platform?',
    answer: (
      <p>ZarcFit is software, not a coaching marketplace — trainers bring their own certifications and client relationships to the platform. If you were invited by a coach, ask them directly about their credentials and experience.</p>
    ),
  },
  {
    id: 'tech-1',
    category: 'technical',
    question: 'Which devices is your app compatible with?',
    answer: (
      <p>ZarcFit runs in any modern web browser on desktop and mobile. Native iOS/Android apps are on the roadmap.</p>
    ),
  },
  {
    id: 'tech-2',
    category: 'technical',
    question: 'Can I download workouts for offline use?',
    answer: (
      <p>Offline workout downloads are planned for a future mobile release. Today, use the web app with an internet connection.</p>
    ),
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'general', label: 'Platform & Programs' },
  { id: 'billing', label: 'Billing' },
  { id: 'coaching', label: 'Coaching' },
  { id: 'technical', label: 'Technical' },
] as const;

export default function FAQPageClient() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      if (!q) return matchesCategory;
      const haystack = `${item.question} ${typeof item.answer === 'string' ? item.answer : item.id}`.toLowerCase();
      return matchesCategory && haystack.includes(q);
    });
  }, [query, category]);

  const grouped = useMemo(() => {
    const groups: Record<string, FaqItem[]> = {};
    filtered.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filtered]);

  const categoryTitles: Record<string, string> = {
    general: 'General Questions',
    billing: 'Membership & Billing',
    coaching: 'Coaching & Support',
    technical: 'Technical Questions',
  };

  return (
    <>
      <PageHero
        badge="Help Center"
        title="Frequently Asked Questions"
        subtitle="Answers about the ZarcFit coaching platform, billing, and how coaches and clients use it"
        size="compact"
      >
        <div className="relative mx-auto max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for answers..."
            className="border-border/60 bg-card/50 pl-10 backdrop-blur-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </PageHero>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={category === cat.id ? 'outline' : 'ghost'}
                className="rounded-full"
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No matching questions. Try a different search or category.</p>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="mb-12">
                <h2 className="text-2xl font-bold mb-6">{categoryTitles[cat] || cat}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {items.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent>{item.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}

          <div className="bg-primary/10 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
            <p className="mb-6 max-w-md mx-auto">Our support team is ready to help.</p>
            <Button asChild>
              <Link href="/main/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
