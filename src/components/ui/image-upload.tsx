'use client';

import React, { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { uploadUserImage, UploadFolder } from '@/lib/supabase/storage';
import { Camera, Loader2 } from 'lucide-react';

type ImageUploadProps = {
  userId: string;
  folder: UploadFolder;
  currentUrl?: string;
  fallback: string;
  onUploaded: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

export function ImageUpload({
  userId,
  folder,
  currentUrl,
  fallback,
  onUploaded,
  size = 'md',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentUrl || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const { url, error: uploadError } = await uploadUserImage(userId, file, folder);
    setUploading(false);

    if (uploadError || !url) {
      setError(uploadError || 'Upload failed');
      return;
    }

    setPreview(url);
    onUploaded(url);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={preview || currentUrl} />
          <AvatarFallback className="text-xl">{fallback}</AvatarFallback>
        </Avatar>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {error && <p className="text-xs text-destructive text-center max-w-[200px]">{error}</p>}
    </div>
  );
}
