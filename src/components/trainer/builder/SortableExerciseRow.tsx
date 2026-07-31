'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SessionExercise } from './ExerciseEditDialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { ExerciseFormVideo } from '@/components/workout/ExerciseFormVideo';
import { GripVertical, Pencil, Shuffle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/lib/supabase/dashboard-api';

type Props = {
  exercise: SessionExercise;
  swapOptions: Exercise[];
  onEdit: () => void;
  onDelete: () => void;
  onSwap: (newExerciseId: string) => void;
};

export function SortableExerciseRow({
  exercise,
  swapOptions,
  onEdit,
  onDelete,
  onSwap,
}: Props) {
  const id = exercise.id!;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: 'session-exercise', exercise },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm',
        isDragging && 'z-10 opacity-60 shadow-md'
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{exercise.exercises?.name || 'Exercise'}</p>
        <p className="truncate text-xs text-muted-foreground">
          {exercise.sets ?? '—'}×{exercise.reps || '—'}
          {exercise.rest_seconds != null ? ` · ${exercise.rest_seconds}s` : ''}
        </p>
      </div>
      <ExerciseFormVideo
        videoUrl={exercise.exercises?.video_url}
        exerciseName={exercise.exercises?.name || 'Exercise'}
      />
      {swapOptions.length > 0 && (
        <Select onValueChange={onSwap}>
          <SelectTrigger className="h-8 w-8 border-0 p-0 shadow-none" aria-label="Swap exercise">
            <Shuffle className="mx-auto h-4 w-4" />
          </SelectTrigger>
          <SelectContent>
            {swapOptions.map((alt) => (
              <SelectItem key={alt.id} value={alt.id!}>
                {alt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} aria-label="Edit">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onDelete} aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
