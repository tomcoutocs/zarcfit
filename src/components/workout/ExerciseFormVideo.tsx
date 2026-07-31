'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Play } from 'lucide-react';

type ExerciseFormVideoProps = {
  videoUrl?: string | null;
  exerciseName: string;
  /** When true and no URL, show muted "No form video" text. Default: render nothing. */
  showEmpty?: boolean;
  className?: string;
};

/** Convert watch?v= / youtu.be / shorts URLs to an embeddable YouTube URL. */
export function toYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '');

    let videoId: string | null = null;
    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/')[2] || null;
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2] || null;
      } else {
        videoId = parsed.searchParams.get('v');
      }
    }

    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

/**
 * Reusable "Watch form" control for exercise demo videos.
 * Wire into trainer program builder exercise rows when that UI is rebuilt
 * (PF-213) — import ExerciseFormVideo next to each exercise name.
 */
export function ExerciseFormVideo({
  videoUrl,
  exerciseName,
  showEmpty = false,
  className,
}: ExerciseFormVideoProps) {
  if (!videoUrl) {
    if (!showEmpty) return null;
    return <span className="text-xs text-muted-foreground">No form video</span>;
  }

  const embedUrl = toYouTubeEmbedUrl(videoUrl);
  if (!embedUrl) {
    if (!showEmpty) return null;
    return <span className="text-xs text-muted-foreground">No form video</span>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={className ?? 'gap-1.5 h-8'}>
          <Play className="h-3.5 w-3.5" />
          Watch form
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden sm:rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{exerciseName}</DialogTitle>
          <DialogDescription>Form demonstration</DialogDescription>
        </DialogHeader>
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={embedUrl}
            title={`${exerciseName} form video`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExerciseFormVideo;
