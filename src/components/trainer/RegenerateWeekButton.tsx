'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { workoutSessionsApi } from '@/lib/supabase/dashboard-api';

type Props = {
  programId: string;
  weekNumber: number;
  onApplied: () => void;
};

type SessionUpdate = {
  session_id: string;
  name: string;
  exercises: {
    exercise_id: string;
    sets: number;
    reps: string;
    rest_seconds: number;
    notes?: string;
  }[];
};

export default function RegenerateWeekButton({ programId, weekNumber, onApplied }: Props) {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    adjustments: string[];
    ratings_used: number;
    session_updates: SessionUpdate[];
  } | null>(null);

  if (!clientId) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch('/api/ai/regenerate-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          week_number: weekNumber,
          client_id: clientId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Regeneration failed');
      setPreview(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Regeneration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      for (const session of preview.session_updates) {
        const detail = await workoutSessionsApi.getSessionWithExercises(session.session_id);
        const existing = detail?.exercises || [];
        for (const ex of existing) {
          if (ex.id) await workoutSessionsApi.deleteExercise(ex.id);
        }
        for (const [i, ex] of session.exercises.entries()) {
          await workoutSessionsApi.addExercise({
            workout_session_id: session.session_id,
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            order_index: i,
            notes: ex.notes,
          });
        }
      }
      toast.success(`Week ${weekNumber} updated from client difficulty ratings`);
      setOpen(false);
      setPreview(null);
      onApplied();
    } catch {
      toast.error('Failed to apply week changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1 h-8"
        onClick={() => setOpen(true)}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Regenerate week
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate week {weekNumber}</DialogTitle>
            <DialogDescription>
              Adjusts volume and swaps exercises based on this client&apos;s difficulty ratings (1–5).
            </DialogDescription>
          </DialogHeader>

          {preview ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Used {preview.ratings_used} rated exercise{preview.ratings_used !== 1 ? 's' : ''}.
              </p>
              {preview.adjustments.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground max-h-40 overflow-y-auto">
                  {preview.adjustments.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No changes suggested — ratings are in normal range.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Requires the client to have logged workouts with difficulty ratings for exercises in this week.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setPreview(null); }}>
              Cancel
            </Button>
            {!preview ? (
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? 'Analyzing…' : 'Analyze ratings'}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setPreview(null)}>Back</Button>
                <Button onClick={handleApply} disabled={loading || preview.adjustments.length === 0}>
                  Apply to week
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
