export type TrainerPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  clientLimit: number;
  popular?: boolean;
  features: string[];
  stripePriceId?: string;
};

/** Minimal shape needed to resolve a trainer's effective client limit. */
export type ClientLimitSource = {
  max_clients?: number | null;
  subscription_tier?: string | null;
};

/**
 * Resolve a trainer's effective client limit (PF-312).
 * Priority: an explicit per-trainer override (`trainer_profiles.max_clients`),
 * then the plan's limit for their subscription tier, then the free-tier default.
 */
export function resolveClientLimit(profile: ClientLimitSource | null | undefined): number {
  if (profile?.max_clients != null && profile.max_clients > 0) {
    return profile.max_clients;
  }
  const plan = TRAINER_PLANS.find((p) => p.id === profile?.subscription_tier);
  if (plan) return plan.clientLimit;
  return FREE_TIER_CLIENT_LIMIT;
}

export const FREE_TIER_CLIENT_LIMIT = 5;

/** Resolve Stripe price ID from env (client-safe NEXT_PUBLIC_* or server STRIPE_PRICE_*). */
export function getPlanStripePriceId(planId: string): string | undefined {
  const envMap: Record<string, string | undefined> = {
    starter:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ||
      process.env.STRIPE_PRICE_STARTER,
    growth:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH ||
      process.env.STRIPE_PRICE_GROWTH ||
      process.env.STRIPE_PRICE_PRO,
    pro:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ||
      process.env.STRIPE_PRICE_PRO ||
      process.env.STRIPE_PRICE_ENTERPRISE,
  };
  return envMap[planId];
}

/** Map a Stripe price ID back to a subscription tier slug. */
export function tierFromStripePriceId(priceId: string | null | undefined): string {
  if (!priceId) return 'free';
  const tiers = ['starter', 'growth', 'pro'] as const;
  for (const tier of tiers) {
    const id = getPlanStripePriceId(tier);
    if (id && id === priceId) return tier;
  }
  return 'starter';
}

/** Collect all configured Stripe price IDs (for webhook tier detection). */
export function allStripePriceIds(): string[] {
  return ['starter', 'growth', 'pro']
    .map((id) => getPlanStripePriceId(id))
    .filter((id): id is string => Boolean(id));
}

export const TRAINER_PLANS: TrainerPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For coaches getting their first clients onboard',
    price: 29,
    clientLimit: 5,
    features: [
      'Up to 5 active clients',
      'Workout program builder',
      'Assign programs to clients',
      'Client workout logging',
      'In-app messaging',
      'Client invitations',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For trainers scaling their client roster',
    price: 79,
    clientLimit: 50,
    popular: true,
    features: [
      'Up to 50 active clients',
      'Everything in Starter',
      'Meal plan templates & builder',
      'Reusable program templates',
      'Client activity feed',
      'Schedule & session requests',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For established coaches managing larger rosters',
    price: 149,
    clientLimit: 200,
    features: [
      'Up to 200 active clients',
      'Everything in Growth',
      'Priority email support',
      'Advanced client progress views',
      'Sleep & goal tracking insights',
      'Early access to new features',
    ],
  },
];

export const ENTERPRISE_PLAN = {
  name: 'Enterprise',
  description: 'Custom limits, onboarding, and support for larger teams.',
  features: [
    'Unlimited or custom client limits',
    'Dedicated onboarding',
    'Priority support',
    'Custom integrations (coming soon)',
  ],
};
