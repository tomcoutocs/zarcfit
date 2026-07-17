'use client';

import { useRouter } from 'next/navigation';
import { TRAINER_PLANS } from '@/lib/trainer-plans';
import { Reveal } from './Reveal';

export default function LandingPricing() {
  const router = useRouter();

  return (
    <section className="hm-container hm-section" id="pricing">
      <Reveal>
        <h2 style={{ fontSize: 'var(--text-display-s)', maxWidth: '18ch' }}>Plans that scale with your roster.</h2>
        <p style={{ maxWidth: '42ch', marginTop: 'var(--space-sm)', color: 'var(--color-ink-2)' }}>
          Start on Starter, move up when you need meal plans or a larger client cap. Prices shown in USD per month.
        </p>
      </Reveal>

      <div className="hm-pricing-grid">
        {TRAINER_PLANS.map((plan) => (
          <Reveal key={plan.id}>
            <article className={`hm-price-card${plan.popular ? ' hm-price-card--featured' : ''}`}>
              {plan.popular && <span className="hm-price-card__badge">Most chosen</span>}
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '0.25rem' }}>{plan.name}</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)', marginBottom: 'var(--space-md)' }}>
                {plan.description}
              </p>
              <p className="hm-price-card__amount">
                ${plan.price}
                <span> / month</span>
              </p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                type="button"
                className={`hm-btn hm-btn--lg${plan.popular ? ' hm-btn--accent' : ' hm-btn--outline'}`}
                style={{ width: '100%' }}
                onClick={() => router.push('/auth/signup')}
              >
                Start with {plan.name}
              </button>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
