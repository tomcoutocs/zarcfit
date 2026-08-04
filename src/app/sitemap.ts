import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';
import { getPublishedBlogPosts, blogPostHref } from '@/lib/blog';

// CA-504: static marketing routes + best-effort published blog posts.
// getPublishedBlogPosts() resolves to [] (no throw) when Supabase env vars
// are unset, so this stays safe in environments without a configured DB.
const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/main/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/main/plans', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/main/compare', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/main/compare/truecoach', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/main/compare/everfit', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/main/faq', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/main/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/main/blog', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPublishedBlogPosts();
    blogEntries = posts.map((post) => ({
      url: `${siteUrl}${blogPostHref(post)}`,
      lastModified: new Date(post.updated_at || post.created_at),
      changeFrequency: 'monthly',
      priority: 0.5,
    }));
  } catch {
    blogEntries = [];
  }

  return [...staticEntries, ...blogEntries];
}
