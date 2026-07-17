'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { homeForRole } from '@/lib/auth-routes';
import { Reveal } from './Reveal';

export default function LandingCta() {
  const { user, role } = useAuth();
  const router = useRouter();
  const href = user ? homeForRole(role) : '/auth/signup';
  const label = user ? 'Open dashboard' : 'Create trainer account';

  return (
    <section className="hm-cta-strip hm-container">
      <Reveal>
        <h2>Ready to coach on ZarcFit?</h2>
        <p>
          Set up your account, invite your first client, and assign a program — all from the trainer dashboard.
        </p>
        <button type="button" className="hm-btn hm-btn--primary hm-btn--lg" onClick={() => router.push(href)}>
          {label}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </Reveal>
    </section>
  );
}
