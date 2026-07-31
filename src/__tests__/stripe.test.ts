import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tierFromStripePriceId, getPlanStripePriceId, resolveClientLimit, TRAINER_PLANS } from '@/lib/trainer-plans';

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

describe('PF-311 retier', () => {
  it('has the new Starter/Growth/Pro client limits and prices', () => {
    const [starter, growth, pro] = TRAINER_PLANS;
    expect(starter).toMatchObject({ id: 'starter', price: 29, clientLimit: 5 });
    expect(growth).toMatchObject({ id: 'growth', price: 79, clientLimit: 50 });
    expect(pro).toMatchObject({ id: 'pro', price: 149, clientLimit: 200 });
  });
});

describe('PF-312 resolveClientLimit', () => {
  it('prefers an explicit max_clients override', () => {
    expect(resolveClientLimit({ max_clients: 7, subscription_tier: 'starter' })).toBe(7);
  });

  it('ignores a zero or negative override and falls back to the plan', () => {
    expect(resolveClientLimit({ max_clients: 0, subscription_tier: 'growth' })).toBe(50);
    expect(resolveClientLimit({ max_clients: -1, subscription_tier: 'pro' })).toBe(200);
  });

  it('falls back to the plan limit for the subscription tier', () => {
    expect(resolveClientLimit({ subscription_tier: 'starter' })).toBe(5);
    expect(resolveClientLimit({ subscription_tier: 'growth' })).toBe(50);
    expect(resolveClientLimit({ subscription_tier: 'pro' })).toBe(200);
  });

  it('defaults to 5 for free/unknown tiers or a missing profile', () => {
    expect(resolveClientLimit({ subscription_tier: 'free' })).toBe(5);
    expect(resolveClientLimit({ subscription_tier: null })).toBe(5);
    expect(resolveClientLimit(null)).toBe(5);
  });
});
