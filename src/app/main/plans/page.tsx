'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, Users } from 'lucide-react';
import PageHero from '@/components/layout/PageHero';
import { TRAINER_PLANS, ENTERPRISE_PLAN } from '@/lib/trainer-plans';
import AnimatedContent from '@/components/AnimatedContent';
import SpotlightCard from '@/components/SpotlightCard';

const SPOTLIGHT = 'rgba(72, 120, 150, 0.12)';

export default function PlansPage() {
  const router = useRouter();

  return (
    <>
      <PageHero
        badge="Trainer pricing"
        title="Plans for coaches"
        subtitle="Planned monthly tiers for coaches — free to explore while billing is in early access."
        size="compact"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-8 rounded-lg border border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
            Trainer accounts are free during early access. Paid subscriptions and online checkout are coming soon — create your account now to start coaching.
          </p>
          <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {TRAINER_PLANS.map((plan, index) => (
              <AnimatedContent key={plan.id} distance={50} delay={index * 0.08} duration={0.7}>
              <SpotlightCard
                spotlightColor={SPOTLIGHT}
                className={`flex h-full flex-col !rounded-xl !border-border !bg-card !p-0 ${plan.popular ? 'relative overflow-hidden !border-primary' : ''}`}
              >
              <Card
                key={plan.id}
                className={`flex flex-col border-0 bg-transparent shadow-none ${plan.popular ? 'relative overflow-hidden' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute left-0 right-0 top-0 bg-primary py-1 text-center text-sm font-medium text-primary-foreground">
                    Most popular
                  </div>
                )}
                <CardHeader className={plan.popular ? 'pt-8' : undefined}>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1 font-normal">
                      <Users className="h-3.5 w-3.5" />
                      Up to {plan.clientLimit} clients
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-semibold">${plan.price}</span>
                    <span className="text-muted-foreground"> / month</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full font-medium"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => router.push('/auth/signup')}
                  >
                    Start as trainer
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
              </SpotlightCard>
              </AnimatedContent>
            ))}
          </div>

          <AnimatedContent distance={40} delay={0.2} duration={0.7}>
          <Card className="mb-12 border-dashed">
            <CardHeader>
              <CardTitle>{ENTERPRISE_PLAN.name}</CardTitle>
              <CardDescription>{ENTERPRISE_PLAN.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {ENTERPRISE_PLAN.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push('/main/contact')}>
                Contact sales
              </Button>
            </CardFooter>
          </Card>
          </AnimatedContent>

          <AnimatedContent distance={40} delay={0.25} duration={0.7}>
          <div className="rounded-xl border border-border bg-card p-8">
            <h2 className="mb-6 text-center text-xl font-semibold tracking-tight">
              Compare plans at a glance
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Feature</th>
                    {TRAINER_PLANS.map((plan) => (
                      <th key={plan.id} className="pb-3 pr-4 font-medium">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    { label: 'Monthly price', values: TRAINER_PLANS.map((p) => `$${p.price}`) },
                    { label: 'Active clients', values: TRAINER_PLANS.map((p) => String(p.clientLimit)) },
                    { label: 'Workout builder', values: ['Yes', 'Yes', 'Yes'] },
                    { label: 'Meal plan builder', values: ['—', 'Yes', 'Yes'] },
                    { label: 'Plan templates', values: ['—', 'Yes', 'Yes'] },
                    { label: 'Activity feed', values: ['—', 'Yes', 'Yes'] },
                    { label: 'Priority support', values: ['—', '—', 'Yes'] },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-border/60">
                      <td className="py-3 pr-4 text-foreground">{row.label}</td>
                      {row.values.map((value, index) => (
                        <td key={`${row.label}-${index}`} className="py-3 pr-4">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </AnimatedContent>

          <AnimatedContent distance={40} delay={0.3} duration={0.7}>
          <div className="mt-12 rounded-xl border border-border bg-card p-8 text-center">
            <h2 className="mb-3 text-2xl font-semibold tracking-tight">Ready to coach on ZarcFit?</h2>
            <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
              Create your free trainer account and start inviting clients. Choose a plan when paid billing launches.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => router.push('/auth/signup')}>
                Become a trainer
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/main/contact')}>
                Questions? Contact us
              </Button>
            </div>
          </div>
          </AnimatedContent>
        </div>
      </div>
    </>
  );
}
