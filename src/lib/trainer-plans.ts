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

/** Resolve Stripe price ID from env (client-safe NEXT_PUBLIC_* or server STRIPE_PRICE_*). */
export function getPlanStripePriceId(planId: string): string | undefined {
  const envMap: Record<string, string | undefined> = {
    starter:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ||
      process.env.STRIPE_PRICE_STARTER,
    growth:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH ||
      process.env.STRIPE_PRICE_PRO,
    pro:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ||
      process.env.STRIPE_PRICE_ENTERPRISE,
  };
  return envMap[planId];
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
    price: 59,
    clientLimit: 20,
    popular: true,
    features: [
      'Up to 20 active clients',
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
    price: 99,
    clientLimit: 50,
    features: [
      'Up to 50 active clients',
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
