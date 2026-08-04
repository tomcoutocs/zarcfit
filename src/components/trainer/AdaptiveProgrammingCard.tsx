'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, RefreshCw, ArrowRightLeft, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { adaptiveApi, type ExerciseRatingAggregate } from '@/lib/supabase/adaptive-api';
import { suggestSwapsForRatings, type SwapSuggestion } from '@/lib/ai/adaptive-suggestions';
import {
  exercisesApi,
  workoutProgramsApi,
  workoutSessionsApi,
  type Exercise,
  type WorkoutProgram,
} from '@/lib/supabase/dashboard-api';

type Props = {
  readonly clientId: string;
  readonly programs: WorkoutProgram[];
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

type RegenPreview = {
  adjustments: string[];
  ratings_used: number;
  session_updates: SessionUpdate[];
};

export function AdaptiveProgrammingCard({ clientId, programs }: Props) {
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<ExerciseRatingAggregate[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [weeks, setWeeks] = useState<number[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<RegenPreview | null>(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);

  const activePrograms = useMemo(
    () => programs.filter((p) => p.is_active && p.id),
    [programs]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [summary, library] = await Promise.all([
        adaptiveApi.getClientDifficultySummary(clientId),
        exercisesApi.getAll(),
      ]);
      if (cancelled) return;
      setRatings(summary);
      setExerciseLibrary(library);
      setLoading(false);
    }
    if (clientId) load();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!selectedProgramId && activePrograms.length > 0) {
      setSelectedProgramId(activePrograms[0].id as string);
    }
  }, [activePrograms, selectedProgramId]);

  useEffect(() => {
    let cancelled = false;
    async function loadWeeks() {
      if (!selectedProgramId) {
        setWeeks([]);
        setSelectedWeek(null);
        return;
      }
      const sessions = await workoutProgramsApi.getProgramSessions(selectedProgramId);
      if (cancelled) return;
      const weekNumbers = Array.from(
        new Set(sessions.map((s) => s.week_number || 1))
      ).sort((a, b) => a - b);
      setWeeks(weekNumbers);
      setSelectedWeek((prev) =>
        prev && weekNumbers.includes(prev) ? prev : weekNumbers.at(-1) ?? null
      );
    }
    loadWeeks();
    return () => {
      cancelled = true;
    };
  }, [selectedProgramId]);

  const flagged = useMemo(
    () => ratings.filter((r) => r.hard_count >= 2 || r.easy_count >= 2),
    [ratings]
  );

  const hardCount = useMemo(() => flagged.filter((r) => r.hard_count >= 2).length, [flagged]);
  const easyCount = useMemo(() => flagged.filter((r) => r.easy_count >= 2).length, [flagged]);
  const exercisePlural = hardCount === 1 ? '' : 's';
  const cardSummary =
    flagged.length > 0
      ? `${hardCount} exercise${exercisePlural} rated too hard, ${easyCount} too easy`
      : 'Ratings are in a healthy range — no changes suggested right now';

  const swapSuggestions: SwapSuggestion[] = useMemo(
    () => suggestSwapsForRatings(exerciseLibrary, flagged),
    [exerciseLibrary, flagged]
  );

  const openDialog = () => {
    setPreview(null);
    setDialogOpen(true);
  };

  const handleGenerate = async () => {
    if (!selectedProgramId || !selectedWeek) return;
    setGenerating(true);
    setPreview(null);
    try {
      const res = await fetch('/api/ai/regenerate-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: selectedProgramId,
          week_number: selectedWeek,
          client_id: clientId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Regeneration failed');
      setPreview(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Regeneration failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      for (const session of preview.session_updates) {
        const detail = await workoutSessionsApi.getSessionWithExercises(session.session_id);
        for (const ex of detail?.exercises || []) {
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
      toast.success(`Week ${selectedWeek} updated from difficulty ratings`);
      setDialogOpen(false);
      setPreview(null);
    } catch {
      toast.error('Failed to apply week changes');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Adaptive Programming
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ratings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Adaptive Programming
          </CardTitle>
          <CardDescription>Suggestions based on this client&apos;s difficulty ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8 text-sm">
            No difficulty ratings logged yet. Once this client rates exercises after a workout,
            adaptive suggestions will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Adaptive Programming
        </CardTitle>
        <CardDescription>{cardSummary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {flagged.length > 0 && (
          <div className="space-y-2">
            {flagged.slice(0, 5).map((r) => (
              <div
                key={r.exercise_id}
                className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.exercise_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Avg {r.avg_difficulty.toFixed(1)}/5 across {r.log_count} log
                    {r.log_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant={r.hard_count >= 2 ? 'destructive' : 'secondary'} className="shrink-0">
                  {r.hard_count >= 2 ? 'Too hard' : 'Too easy'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {swapSuggestions.length > 0 && (
          <div className="space-y-1.5 rounded-md border border-dashed p-3">
            <p className="flex items-center gap-1 text-xs font-medium uppercase text-muted-foreground">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Suggested swaps
            </p>
            {swapSuggestions.slice(0, 3).map((s) => (
              <p key={s.exercise_id} className="text-sm">
                <span className="font-medium">{s.exercise_name}</span>
                <span className="text-muted-foreground"> → try </span>
                <span className="font-medium">{s.suggested_exercise_name}</span>
                <span className="text-muted-foreground"> ({s.reason})</span>
              </p>
            ))}
          </div>
        )}

        {activePrograms.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {activePrograms.length > 1 && (
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent>
                  {activePrograms.map((p) => (
                    <SelectItem key={p.id} value={p.id as string}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {weeks.length > 1 && (
              <Select
                value={selectedWeek ? String(selectedWeek) : ''}
                onValueChange={(v) => setSelectedWeek(Number(v))}
              >
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue placeholder="Week" />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((w) => (
                    <SelectItem key={w} value={String(w)}>
                      Week {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              size="sm"
              className="h-8 gap-1"
              onClick={openDialog}
              disabled={!selectedWeek}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate {selectedWeek ? `week ${selectedWeek}` : 'week'}
            </Button>
            <Link href={`/trainer/programs/${selectedProgramId}/builder?client=${clientId}`}>
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <ExternalLink className="h-3.5 w-3.5" />
                Open in builder
              </Button>
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Assign an active program to this client to enable one-click regeneration.
          </p>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate week {selectedWeek}</DialogTitle>
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
              Analyzes this week&apos;s exercises against the client&apos;s logged difficulty ratings.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setPreview(null);
              }}
            >
              Cancel
            </Button>
            {!preview ? (
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? 'Analyzing…' : 'Analyze ratings'}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Back
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={applying || preview.adjustments.length === 0}
                >
                  {applying ? 'Applying…' : 'Apply to week'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
