import { createClient } from '@supabase/supabase-js';

export type BlogPost = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  featured_image: string | null;
  status: 'draft' | 'published';
  slug: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
};

function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function withSlug(post: Omit<BlogPost, 'slug'> & { slug?: string | null }): BlogPost {
  return {
    ...post,
    slug: post.slug || slugifyTitle(post.title),
  };
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, excerpt, content, category, featured_image, status, author_name, created_at, updated_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }

  return ((data as Omit<BlogPost, 'slug'>[]) || []).map((p) => withSlug({ ...p, slug: null }));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getPublishedBlogPosts();
  return posts.find((p) => p.slug === slug || p.id === slug) ?? null;
}

export function blogPostHref(post: BlogPost): string {
  return `/main/blog/${post.slug || slugifyTitle(post.title) || post.id}`;
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
