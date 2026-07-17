'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { homeForRole } from '@/lib/auth-routes';
import { Reveal } from './Reveal';

function DashboardPreview() {
  return (
    <figure className="hm-panel">
      <div className="hm-panel__header">
        <p className="hm-panel__title">Trainer dashboard</p>
        <span className="hm-panel__meta">Live view</span>
      </div>
      <div className="hm-panel__body">
        <div className="hm-mock-rows">
          <div className="hm-mock-row">
            <div>
              <p className="hm-mock-row__label">Client roster</p>
              <p className="hm-mock-row__sub">3 sessions today · 2 pending invites</p>
            </div>
            <span className="hm-mock-badge hm-mock-badge--live">Active</span>
          </div>
          <div className="hm-mock-row">
            <div>
              <p className="hm-mock-row__label">Upper body · Week 4</p>
              <p className="hm-mock-row__sub">Assigned to 6 clients</p>
            </div>
            <span className="hm-mock-badge">Program</span>
          </div>
          <div className="hm-mock-bars" aria-hidden="true">
            <div className="hm-mock-bar" style={{ height: '45%' }} />
            <div className="hm-mock-bar hm-mock-bar--accent" style={{ height: '72%' }} />
            <div className="hm-mock-bar" style={{ height: '58%' }} />
            <div className="hm-mock-bar hm-mock-bar--accent" style={{ height: '85%' }} />
            <div className="hm-mock-bar" style={{ height: '64%' }} />
            <div className="hm-mock-bar" style={{ height: '48%' }} />
          </div>
        </div>
      </div>
    </figure>
  );
}

export default function LandingHero() {
  const { user, role } = useAuth();
  const router = useRouter();
  const primaryHref = user ? homeForRole(role) : '/auth/signup';
  const primaryLabel = user ? 'Open dashboard' : 'Start coaching';

  return (
    <section className="hm-hero hm-container">
      <Reveal>
        <div className="hm-hero__grid">
          <div>
            <h1 style={{ fontSize: 'var(--text-display)', lineHeight: 1.05, marginBottom: 'var(--space-md)' }}>
              Run your coaching business from one place.
            </h1>
            <p className="hm-hero__lede">
              Build programs, invite clients, track workouts and progress — without juggling spreadsheets,
              PDFs, and five different apps.
            </p>
            <div className="hm-hero__actions">
              <button type="button" className="hm-btn hm-btn--primary hm-btn--lg" onClick={() => router.push(primaryHref)}>
                {primaryLabel}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button type="button" className="hm-btn hm-btn--outline hm-btn--lg" onClick={() => router.push('/main/plans')}>
                View plans
              </button>
            </div>
            <p className="hm-hero__note">Free to explore. Clients join through your invitation.</p>
          </div>
          <DashboardPreview />
        </div>
      </Reveal>
    </section>
  );
}
