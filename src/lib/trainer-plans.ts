export type TrainerPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  clientLimit: number;
  popular?: boolean;
  features: string[];
};

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
