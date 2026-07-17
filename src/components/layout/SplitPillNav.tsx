'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Dumbbell, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { MARKETING_NAV_LINKS } from '@/lib/site-nav';
import { homeForRole } from '@/lib/auth-routes';

export default function SplitPillNav() {
  const [open, setOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const dashboardHref = homeForRole(role);

  return (
    <>
      <div className="hm-nav-bar">
        <Link href="/" className="hm-nav-chip hm-nav-chip--brand hm-nav-bar__wordmark">
          <span className="hm-nav-bar__mark" aria-hidden="true">
            <Dumbbell size={14} />
          </span>
          ZarcFit
        </Link>

        <nav className="hm-nav-chip hm-nav-chip--links" aria-label="Primary">
          <ul className="hm-nav-bar__links">
            {MARKETING_NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={pathname === link.href ? 'is-active' : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hm-nav-chip hm-nav-chip--actions">
          {user ? (
            <button type="button" className="hm-btn hm-btn--accent" onClick={() => router.push(dashboardHref)}>
              Dashboard
            </button>
          ) : (
            <>
              <button type="button" className="hm-btn hm-btn--ghost hm-btn--ghost-desktop" onClick={() => router.push('/auth/login')}>
                Sign in
              </button>
              <button type="button" className="hm-btn hm-btn--primary" onClick={() => router.push('/auth/signup')}>
                Start coaching
              </button>
            </>
          )}
          <button
            type="button"
            className="hm-menu-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="hm-mobile-drawer md:hidden" onClick={() => setOpen(false)} role="presentation">
          <div className="hm-mobile-panel" onClick={(e) => e.stopPropagation()}>
            {MARKETING_NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-rule)' }}>
              {user ? (
                <>
                  <button type="button" className="hm-btn hm-btn--accent" style={{ width: '100%' }} onClick={() => { setOpen(false); router.push(dashboardHref); }}>
                    Dashboard
                  </button>
                  <button type="button" className="hm-btn hm-btn--ghost" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => { setOpen(false); void signOut(); }}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="hm-btn hm-btn--outline" style={{ width: '100%' }} onClick={() => { setOpen(false); router.push('/auth/login'); }}>
                    Sign in
                  </button>
                  <button type="button" className="hm-btn hm-btn--primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => { setOpen(false); router.push('/auth/signup'); }}>
                    Start coaching
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
