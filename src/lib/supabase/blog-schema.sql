-- ============================================
-- BLOG POSTS SCHEMA
-- Run this AFTER schema.sql and trainer-platform-schema.sql
-- (depends on the `user_roles` table for the admin-only RLS checks below)
-- ============================================
--
-- Why this file exists:
-- The admin blog "new", "edit", and "view" pages already read/write a
-- `blog_posts` table via direct Supabase calls, but no migration ever
-- created that table — meaning blog creation/editing was silently failing
-- (or working by luck if someone created the table by hand in the
-- Supabase dashboard). This migration is the source of truth for that
-- table going forward. Safe to re-run.

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT,
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Published posts are public (needed for the marketing blog to eventually
-- read real posts); admins can see everything including drafts.
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
CREATE POLICY "Anyone can view published blog posts"
ON blog_posts FOR SELECT
USING (
  status = 'published'
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can insert blog posts" ON blog_posts;
CREATE POLICY "Admins can insert blog posts"
ON blog_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update blog posts" ON blog_posts;
CREATE POLICY "Admins can update blog posts"
ON blog_posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete blog posts" ON blog_posts;
CREATE POLICY "Admins can delete blog posts"
ON blog_posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);
