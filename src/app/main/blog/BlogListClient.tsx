'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import PageHero from '@/components/layout/PageHero';
import { blogPostHref, type BlogPost } from '@/lib/blog';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50e?w=1200&h=800&fit=crop';

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
      {children}
    </span>
  );
}

type BlogListProps = {
  posts: BlogPost[];
};

export default function BlogListClient({ posts }: BlogListProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchesQuery =
        !query ||
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        (post.excerpt || '').toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || post.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [posts, query, category]);

  const [featured, ...rest] = filtered;

  return (
    <>
      <PageHero
        badge="Fitness Insights"
        title="Fitness Blog"
        subtitle="Expert advice on fitness, nutrition, and wellness"
        size="compact"
      />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={`rounded-full px-3 py-1 text-sm ${!category ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3 py-1 text-sm ${category === cat ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                className="w-full border-border/60 bg-card/50 pl-9 md:w-[250px]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              {posts.length === 0
                ? 'No published articles yet. Check back soon!'
                : 'No articles match your search.'}
            </p>
          ) : (
            <>
              {featured && (
                <div className="mb-16">
                  <Link href={blogPostHref(featured)} className="group block overflow-hidden rounded-lg border shadow-sm">
                    <div className="relative h-[300px] md:h-[400px]">
                      <Image
                        src={featured.featured_image || FALLBACK_IMAGE}
                        alt={featured.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        unoptimized={!featured.featured_image?.includes('unsplash')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 p-6 text-white">
                        {featured.category && <Badge>{featured.category}</Badge>}
                        <h2 className="mt-2 text-2xl font-bold md:text-3xl">{featured.title}</h2>
                        <p className="mt-2 line-clamp-2 text-white/80">{featured.excerpt}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <Card key={post.id} className="overflow-hidden">
                    <div className="relative h-48">
                      <Image
                        src={post.featured_image || FALLBACK_IMAGE}
                        alt={post.title}
                        fill
                        className="object-cover"
                        unoptimized={!post.featured_image?.includes('unsplash')}
                      />
                    </div>
                    <CardHeader>
                      {post.category && <Badge>{post.category}</Badge>}
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                    </CardContent>
                    <CardFooter>
                      <Link href={blogPostHref(post)} className="text-sm font-medium text-primary hover:underline">
                        Read More →
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
