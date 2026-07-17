'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { workoutSessionsApi } from '@/lib/supabase/dashboard-api';
import type { WorkoutDraft } from '@/lib/ai/schemas';

type Props = {
  programId: string;
  defaultGoal?: string;
  defaultSessionsPerWeek?: number;
  defaultDurationWeeks?: number;
  onApplied: () => void;
};

export default function GenerateWorkoutDraftButton({
  programId,
  defaultGoal = '',
  defaultSessionsPerWeek = 3,
  defaultDurationWeeks = 4,
  onApplied,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<WorkoutDraft | null>(null);
  const [goal, setGoal] = useState(defaultGoal);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [sessionsPerWeek, setSessionsPerWeek] = useState(String(defaultSessionsPerWeek));
  const [durationWeeks, setDurationWeeks] = useState(String(defaultDurationWeeks));
  const [equipment, setEquipment] = useState<'gym' | 'home' | 'any'>('any');

  const handleGenerate = async () => {
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch('/api/ai/workout-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          goal,
          difficulty,
          sessions_per_week: Number(sessionsPerWeek),
          duration_weeks: Number(durationWeeks),
          equipment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Generation failed');
      setPreview(data.draft);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      for (const session of preview.sessions) {
        const created = await workoutSessionsApi.createSession({
          program_id: programId,
          name: session.name,
          day_of_week: session.day_of_week,
          week_number: session.week_number,
          notes: session.notes,
        });
        if (!created?.id) continue;
        for (const [i, ex] of session.exercises.entries()) {
          await workoutSessionsApi.addExercise({
            workout_session_id: created.id,
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            order_index: i,
            notes: ex.notes,
          });
        }
      }
      toast.success('Draft applied — review and adjust sessions');
      setOpen(false);
      setPreview(null);
      onApplied();
    } catch {
      toast.error('Failed to apply draft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4" />
        Generate draft
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate workout draft</DialogTitle>
            <DialogDescription>
              Creates sessions from the exercise library. Review before assigning to clients.
            </DialogDescription>
          </DialogHeader>

          {!preview ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Goal</Label>
                <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Build upper body strength" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Equipment</Label>
                  <Select value={equipment} onValueChange={(v) => setEquipment(v as typeof equipment)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="gym">Gym</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Days / week</Label>
                  <Input type="number" min={1} max={7} value={sessionsPerWeek} onChange={(e) => setSessionsPerWeek(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Weeks</Label>
                  <Input type="number" min={1} max={12} value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{preview.summary}</p>
              <p className="font-medium">{preview.sessions.length} sessions · {preview.sessions.reduce((n, s) => n + s.exercises.length, 0)} exercises</p>
              <ul className="max-h-48 overflow-y-auto space-y-1 text-muted-foreground">
                {preview.sessions.slice(0, 8).map((s, i) => (
                  <li key={i}>{s.name} — {s.exercises.length} exercises</li>
                ))}
                {preview.sessions.length > 8 && <li>…and {preview.sessions.length - 8} more</li>}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setPreview(null); }}>Cancel</Button>
            {!preview ? (
              <Button onClick={handleGenerate} disabled={loading || !goal.trim()}>
                {loading ? 'Generating…' : 'Generate'}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setPreview(null)}>Back</Button>
                <Button onClick={handleApply} disabled={loading}>Apply to builder</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
