'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pin, Target, Activity } from 'lucide-react';
import type { ClientNote } from '@/lib/supabase/trainer-api';
import type { WorkoutLog } from '@/lib/supabase/dashboard-api';

type Props = {
  notes: ClientNote[];
  logs: WorkoutLog[];
  diaryDaysLogged?: number;
};

export function ClientActivitySummary({ notes, logs, diaryDaysLogged = 0 }: Props) {
  const pinnedNotes = useMemo(() => notes.filter((n) => n.is_pinned).slice(0, 3), [notes]);
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const recentLogs = useMemo(
    () => logs.filter((l) => new Date(l.date) >= weekAgo),
    [logs, weekAgo]
  );

  const summaryLines = useMemo(() => {
    const lines: string[] = [];
    if (recentLogs.length > 0) {
      lines.push(`${recentLogs.length} workout${recentLogs.length !== 1 ? 's' : ''} logged in the last 7 days`);
    } else {
      lines.push('No workouts logged in the last 7 days');
    }
    if (diaryDaysLogged > 0) {
      lines.push(`Food diary active on ${diaryDaysLogged} of 7 days`);
    }
    if (pinnedNotes.length > 0) {
      lines.push(`${pinnedNotes.length} pinned note${pinnedNotes.length !== 1 ? 's' : ''} for context`);
    }
    return lines;
  }, [recentLogs, diaryDaysLogged, pinnedNotes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Client summary
        </CardTitle>
        <CardDescription>Last 7 days — notes and activity at a glance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="text-sm space-y-1 text-muted-foreground">
          {summaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        {pinnedNotes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pinned notes</p>
            {pinnedNotes.map((note) => (
              <div key={note.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Pin className="h-3 w-3 text-primary" />
                  <Badge variant="outline" className="text-xs">{note.note_type}</Badge>
                </div>
                <p>{note.content}</p>
              </div>
            ))}
          </div>
        )}

        {recentLogs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent sessions</p>
            {recentLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="flex justify-between text-sm">
                <span>{new Date(log.date).toLocaleDateString()}</span>
                <span className="text-muted-foreground">
                  {log.duration_minutes ? `${log.duration_minutes} min` : 'Logged'}
                  {log.rating ? ` · ${log.rating}/5` : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {pinnedNotes.length === 0 && recentLogs.length === 0 && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            Add pinned notes in the Notes tab to surface injuries and preferences in builders.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
