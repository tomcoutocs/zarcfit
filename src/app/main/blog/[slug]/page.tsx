import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlogPostBySlug, getPublishedBlogPosts } from '@/lib/blog';
import PageHero from '@/components/layout/PageHero';
import { Button } from '@/components/ui/button';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50e?w=1200&h=800&fit=crop';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts();
  return posts
    .filter((p) => p.slug)
    .map((p) => ({ slug: p.slug! }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: 'Article not found' };
  return {
    title: `${post.title} | ZarcFit Blog`,
    description: post.excerpt || undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <PageHero badge={post.category || 'Article'} title={post.title} subtitle={post.excerpt || ''} size="compact" />
      <article className="container mx-auto max-w-3xl px-4 py-12">
        <div className="relative mb-8 h-64 overflow-hidden rounded-xl md:h-96">
          <Image
            src={post.featured_image || FALLBACK_IMAGE}
            alt={post.title}
            fill
            className="object-cover"
            priority
            unoptimized={!post.featured_image?.includes('unsplash')}
          />
        </div>
        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{post.author_name || 'ZarcFit Team'}</span>
          <time dateTime={post.created_at}>
            {new Date(post.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>
        <div
          className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
        />
        <div className="mt-12">
          <Link href="/main/blog">
            <Button variant="outline">← Back to Blog</Button>
          </Link>
        </div>
      </article>
    </>
  );
}
