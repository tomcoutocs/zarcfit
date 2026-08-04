/**
 * Reference data for the CA-503/CA-506 "real cost" comparison pages.
 *
 * Figures are drawn from publicly published pricing pages and the internal
 * competitive audit (COMPETITIVE_AUDIT.md) as of August 2026. Competitor
 * pricing changes often — treat these as directional estimates, not quotes,
 * and each comparison page carries a disclaimer pointing back to this.
 */

export type CompetitorId = 'everfit' | 'trainerize' | 'truecoach';

export type Competitor = {
  id: CompetitorId;
  name: string;
  bestFor: string;
  basePriceLabel: string;
  addOns: { label: string; typicalCost: string }[];
  realisticMonthlyLabel: string;
  realisticMonthlyNote: string;
  zarcfitStrengths: string[];
  competitorStrengths: string[];
};

export const COMPETITORS: Record<CompetitorId, Competitor> = {
  everfit: {
    id: 'everfit',
    name: 'Everfit',
    bestFor: 'Online & hybrid coaches, small studios',
    basePriceLabel: 'Free up to 5 clients, then ~$16+/mo',
    addOns: [
      { label: 'Meal planning / nutrition', typicalCost: '~$30–45/mo (often bundled at higher tiers only)' },
      { label: 'Autoflow automation', typicalCost: 'Included only on paid tiers' },
    ],
    realisticMonthlyLabel: '~$45–90+/mo',
    realisticMonthlyNote: 'for a coach with 20–30 clients who wants nutrition tools and automation included',
    zarcfitStrengths: [
      'Nutrition (full + flexible dieting) included, not a separate tier',
      'Transparent flat pricing by client count, no feature gating',
      'Adaptive programming from client difficulty ratings',
    ],
    competitorStrengths: [
      'Autoflow habit/check-in automation is more mature',
      'Larger exercise library (1,500+ vs ~72 today)',
      'Native iOS/Android apps with branded logo & colors',
    ],
  },
  trainerize: {
    id: 'trainerize',
    name: 'Trainerize',
    bestFor: 'Studios and gyms scaling multiple trainers',
    basePriceLabel: 'Free for 1 client, then ~$9+/mo, studio tiers scale up fast',
    addOns: [
      { label: 'Nutrition (MyFitnessPal integration or meal plans)', typicalCost: 'Add-on or separate MFP subscription' },
      { label: 'Zapier automation / habit coaching', typicalCost: 'Add-on on higher tiers' },
      { label: 'Branded client app', typicalCost: 'Premium tier required' },
    ],
    realisticMonthlyLabel: '~$60–100+/mo',
    realisticMonthlyNote: 'once nutrition, automation, and a branded app are added for a 20–30 client roster',
    zarcfitStrengths: [
      'One flat monthly price — no studio-oriented upsell ladder',
      'Nutrition and flexible dieting bundled at Growth and Pro',
      'Built for solo coaches, not multi-trainer gym administration',
    ],
    competitorStrengths: [
      'Deep, mature workout builder with a decade of iteration',
      '1,000+ exercise demos out of the box',
      'Native apps + white-label branded apps (premium)',
    ],
  },
  truecoach: {
    id: 'truecoach',
    name: 'TrueCoach',
    bestFor: 'Solo coaches and small teams (closest positioning to ZarcFit)',
    basePriceLabel: '~$19–20/mo for up to 5 clients, scales with roster size',
    addOns: [
      { label: 'Nutrition guidance', typicalCost: 'Basic / limited at every tier' },
      { label: 'AI program assistance', typicalCost: 'Not offered' },
    ],
    realisticMonthlyLabel: '~$19–60+/mo',
    realisticMonthlyNote: 'for a comparable roster — TrueCoach avoids heavy upsells, but nutrition stays basic at every tier',
    zarcfitStrengths: [
      'Full + flexible dieting nutrition, not "basic guidance"',
      'AI-assisted program and meal drafts with dietary rule checks',
      'Adaptive programming from workout difficulty ratings',
    ],
    competitorStrengths: [
      'Longer track record and larger existing coach community',
      '1,000+ exercise demo library',
      'Native iOS/Android apps',
    ],
  },
};

export const ZARCFIT_SNAPSHOT = {
  name: 'ZarcFit',
  basePriceLabel: '$29–$149/mo flat, by client cap (5 / 50 / 200)',
  includedByDefault: [
    'Program builder + client workout logging',
    'Full meal plans and flexible dieting (macros-only) — Growth & Pro',
    'In-app messaging and schedule/session requests',
    'AI-assisted program & meal drafts with difficulty-based regeneration',
  ],
  honestGaps: [
    'No native iOS/Android apps yet (responsive web only)',
    'Exercise library is smaller (~72 vs 1,000–1,500+ at established platforms)',
    'No habit/check-in automation engine yet (planned)',
    'No white-label branded client apps',
  ],
};

export const COMPARISON_DISCLAIMER =
  'Competitor pricing and feature availability change often and vary by promotion, region, and negotiated deals. Figures above are directional estimates from publicly available pricing pages as of August 2026 — verify current pricing directly with each vendor before making a purchasing decision. This is not a paid or sponsored comparison.';
