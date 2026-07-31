'use client';

import { useEffect, useState } from 'react';
import type { WorkoutExercise, Exercise } from '@/lib/supabase/dashboard-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type SessionExercise = WorkoutExercise & { exercises?: Exercise };

type Props = {
  exercise: SessionExercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: SessionExercise) => void;
};

export function ExerciseEditDialog({ exercise, open, onOpenChange, onSave }: Props) {
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [rest, setRest] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!exercise || !open) return;
    setSets(exercise.sets != null ? String(exercise.sets) : '');
    setReps(exercise.reps || '');
    setRest(exercise.rest_seconds != null ? String(exercise.rest_seconds) : '');
    setNotes(exercise.notes || '');
  }, [exercise, open]);

  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{exercise.exercises?.name || 'Edit exercise'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Sets</Label>
            <Input type="number" min={1} value={sets} onChange={(e) => setSets(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reps</Label>
            <Input value={reps} placeholder="8-10" onChange={(e) => setReps(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Rest (sec)</Label>
            <Input type="number" min={0} value={rest} onChange={(e) => setRest(e.target.value)} />
          </div>
          <div className="col-span-3 space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Input value={notes} placeholder="Optional cue" onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave({
                ...exercise,
                sets: sets ? Number(sets) : undefined,
                reps: reps || undefined,
                rest_seconds: rest ? Number(rest) : undefined,
                notes: notes.trim() || undefined,
              });
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
