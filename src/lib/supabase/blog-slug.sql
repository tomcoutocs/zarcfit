-- Add slug column for public blog URLs (ZF-301 / ZF-302)
-- Safe to re-run

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs from titles for existing rows
UPDATE blog_posts
SET slug = lower(regexp_replace(regexp_replace(trim(title), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
