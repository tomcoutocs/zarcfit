'use client';

import { useDraggable } from '@dnd-kit/core';
import type { Exercise } from '@/lib/supabase/dashboard-api';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GripVertical, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

function DraggableExercise({ exercise }: { exercise: Exercise }) {
  const id = exercise.id || exercise.name;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${id}`,
    data: { type: 'library', exercise },
  });

  // No transform on the source — DragOverlay owns the cursor-following preview.
  // Applying both causes the ghost to drift away from the pointer.
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-background px-2 py-2 text-sm cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40'
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{exercise.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[exercise.muscle_group, exercise.equipment].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  );
}

type Props = {
  exercises: Exercise[];
  search: string;
  muscle: string;
  equipment: string;
  onSearchChange: (v: string) => void;
  onMuscleChange: (v: string) => void;
  onEquipmentChange: (v: string) => void;
  muscleGroups: string[];
  equipmentList: string[];
};

export function ExerciseLibraryPane({
  exercises,
  search,
  muscle,
  equipment,
  onSearchChange,
  onMuscleChange,
  onEquipmentChange,
  muscleGroups,
  equipmentList,
}: Props) {
  return (
    <aside className="flex max-h-[min(70vh,720px)] flex-col overflow-hidden rounded-lg border bg-card lg:max-h-[calc(100vh-6rem)]">
      <div className="shrink-0 space-y-2 border-b p-3">
        <p className="text-sm font-semibold">Exercise database</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search exercises…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={muscle} onValueChange={onMuscleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Muscle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All muscles</SelectItem>
              {muscleGroups.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={equipment} onValueChange={onEquipmentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All equipment</SelectItem>
              {equipmentList.map((eq) => (
                <SelectItem key={eq} value={eq}>
                  {eq}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Drag an exercise onto a session on the left
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-2">
        {exercises.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">No matches</p>
        ) : (
          exercises.map((ex) => <DraggableExercise key={ex.id || ex.name} exercise={ex} />)
        )}
      </div>
    </aside>
  );
}
