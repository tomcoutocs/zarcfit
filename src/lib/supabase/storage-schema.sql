-- ============================================
-- SUPABASE STORAGE: avatars + progress photos
-- Run in Supabase SQL Editor
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Users can upload/read/delete their own files under {user_id}/
CREATE POLICY "Users upload own files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

CREATE POLICY "Users read own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

CREATE POLICY "Public read user uploads"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'user-uploads');

CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

CREATE POLICY "Users update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);
