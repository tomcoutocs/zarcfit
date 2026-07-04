import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

const BUCKET = 'user-uploads';
const MAX_BYTES = 5 * 1024 * 1024;

export type UploadFolder = 'avatars' | 'progress';

export async function uploadUserImage(
  userId: string,
  file: File,
  folder: UploadFolder
): Promise<{ url: string | null; error?: string }> {
  if (!file.type.startsWith('image/')) {
    return { url: null, error: 'Please select an image file.' };
  }
  if (file.size > MAX_BYTES) {
    return { url: null, error: 'Image must be 5 MB or smaller.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${folder}/${Date.now()}.${ext}`;
  const supabase = createSupabaseBrowserClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
