import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tierFromStripePriceId, getPlanStripePriceId } from '@/lib/trainer-plans';

describe('Stripe tier mapping', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = {
      ...env,
      NEXT_PUBLIC_STRIPE_PRICE_STARTER: 'price_starter_test',
      NEXT_PUBLIC_STRIPE_PRICE_GROWTH: 'price_growth_test',
      NEXT_PUBLIC_STRIPE_PRICE_PRO: 'price_pro_test',
    };
  });

  afterEach(() => {
    process.env = env;
  });

  it('resolves price IDs from env', () => {
    expect(getPlanStripePriceId('starter')).toBe('price_starter_test');
    expect(getPlanStripePriceId('growth')).toBe('price_growth_test');
    expect(getPlanStripePriceId('pro')).toBe('price_pro_test');
  });

  it('maps price IDs back to tiers', () => {
    expect(tierFromStripePriceId('price_starter_test')).toBe('starter');
    expect(tierFromStripePriceId('price_growth_test')).toBe('growth');
    expect(tierFromStripePriceId('price_pro_test')).toBe('pro');
  });

  it('returns free for unknown price IDs', () => {
    expect(tierFromStripePriceId(undefined)).toBe('free');
    expect(tierFromStripePriceId('price_unknown')).toBe('starter');
  });
});
