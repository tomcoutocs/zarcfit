-- Message attachment storage RLS for user-uploads bucket (NG-101)
-- Path pattern: messages/{user_id}/{filename}
-- Safe to re-run

DROP POLICY IF EXISTS "Users upload message attachments" ON storage.objects;
CREATE POLICY "Users upload message attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads'
  AND (storage.foldername(name))[1] = 'messages'
  AND (storage.foldername(name))[2] = auth.uid()::TEXT
);

DROP POLICY IF EXISTS "Users delete own message attachments" ON storage.objects;
CREATE POLICY "Users delete own message attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND (storage.foldername(name))[1] = 'messages'
  AND (storage.foldername(name))[2] = auth.uid()::TEXT
);
