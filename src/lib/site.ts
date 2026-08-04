/**
 * Shared site metadata helpers (CA-504/CA-505).
 *
 * Resolves the canonical site URL for sitemap/robots/OG generation. Priority:
 * explicit NEXT_PUBLIC_APP_URL -> existing NEXT_PUBLIC_SITE_URL (used by
 * auth email redirects elsewhere in the app) -> Vercel's auto-injected
 * VERCEL_URL -> hardcoded production fallback.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, '')}`;

  return 'https://zarcfit.vercel.app';
}

export const SITE_NAME = 'ZarcFit';

export const SITE_TAGLINE = 'Coaching software for solo fitness trainers';

export const SITE_DESCRIPTION =
  'ZarcFit is the all-in-one platform independent fitness coaches use to build programs, plan nutrition, message clients, and track progress — without stitching together five different apps.';
