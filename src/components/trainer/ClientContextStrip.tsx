'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { clientNotesApi, ClientNote } from '@/lib/supabase/trainer-api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Pin } from 'lucide-react';

export function ClientContextStrip() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client');
  const { user } = useAuth();
  const [pinnedNotes, setPinnedNotes] = useState<ClientNote[]>([]);

  useEffect(() => {
    if (!user?.id || !clientId) {
      setPinnedNotes([]);
      return;
    }

    clientNotesApi.getNotes(user.id, clientId).then((notes) => {
      setPinnedNotes(notes.filter((note) => note.is_pinned));
    });
  }, [user?.id, clientId]);

  if (!clientId || pinnedNotes.length === 0) return null;

  return (
    <Alert className="border-primary/30 bg-primary/5">
      <Pin className="h-4 w-4" />
      <AlertDescription className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Pinned client notes</span>
          <Link href={`/trainer/clients/${clientId}`}>
            <Button variant="ghost" size="sm" className="h-7 gap-1">
              View client
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <ul className="space-y-2">
          {pinnedNotes.map((note) => (
            <li key={note.id} className="text-sm whitespace-pre-wrap">
              {note.note_type !== 'general' && (
                <Badge variant="outline" className="mr-2 text-xs capitalize">
                  {note.note_type}
                </Badge>
              )}
              {note.content}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
