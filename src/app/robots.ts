import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

// CA-504: allow marketing routes, keep authenticated app surfaces (trainer/
// client/admin dashboards, auth flows, and API routes) out of the crawl.
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/trainer/', '/client/', '/admin/', '/auth/', '/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
