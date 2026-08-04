'use client';

import { useEffect } from 'react';

// CA-202: registers the static /sw.js service worker. Only runs in
// production builds — a caching SW fighting Turbopack's dev HMR is a classic
// footgun, so local `next dev` stays uncached. Test the offline shell and
// push notifications against `next build && next start`.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  }, []);

  return null;
}
