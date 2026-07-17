import type { Exercise } from '@/lib/supabase/dashboard-api';
import type { WorkoutDraft } from './schemas';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function pickExercises(
  pool: Exercise[],
  count: number,
  equipment: 'gym' | 'home' | 'any'
): Exercise[] {
  let filtered = pool;
  if (equipment === 'home') {
    filtered = pool.filter(
      (e) =>
        e.equipment?.toLowerCase().includes('bodyweight') ||
        e.equipment?.toLowerCase().includes('dumbbell') ||
        !e.equipment
    );
  }
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function repsForDifficulty(difficulty: string): string {
  if (difficulty === 'beginner') return '10-12';
  if (difficulty === 'advanced') return '4-6';
  return '8-10';
}

function setsForDifficulty(difficulty: string): number {
  if (difficulty === 'beginner') return 3;
  if (difficulty === 'advanced') return 4;
  return 3;
}

export function generateWorkoutDraftRules(input: {
  exercises: Exercise[];
  goal: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sessionsPerWeek: number;
  durationWeeks: number;
  equipment: 'gym' | 'home' | 'any';
}): WorkoutDraft {
  const { exercises, goal, difficulty, sessionsPerWeek, durationWeeks, equipment } = input;
  const sessions: WorkoutDraft['sessions'] = [];
  const muscles = [...new Set(exercises.map((e) => e.muscle_group).filter(Boolean))] as string[];

  for (let week = 1; week <= Math.min(durationWeeks, 4); week++) {
    for (let dayIdx = 0; dayIdx < sessionsPerWeek; dayIdx++) {
      const muscle = muscles[dayIdx % muscles.length] || 'Full Body';
      const pool = exercises.filter((e) => e.muscle_group === muscle || !e.muscle_group);
      const picked = pickExercises(pool.length ? pool : exercises, 4, equipment);

      sessions.push({
        name: `Week ${week} · ${muscle}`,
        day_of_week: dayIdx + 1,
        week_number: week,
        notes: goal ? `Focus: ${goal}` : undefined,
        exercises: picked
          .filter((e) => e.id)
          .map((e, i) => ({
            exercise_id: e.id!,
            sets: setsForDifficulty(difficulty),
            reps: repsForDifficulty(difficulty),
            rest_seconds: difficulty === 'advanced' ? 90 : 60,
            notes: i === 0 ? 'Primary lift' : undefined,
          })),
      });
    }
  }

  return {
    sessions,
    summary: `Rules-based ${sessionsPerWeek}-day plan for ${durationWeeks} weeks (${DAY_NAMES.slice(0, sessionsPerWeek).join(', ')}).`,
  };
}

export function validateWorkoutDraft(
  draft: WorkoutDraft,
  validExerciseIds: Set<string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const session of draft.sessions) {
    for (const ex of session.exercises) {
      if (!validExerciseIds.has(ex.exercise_id)) {
        errors.push(`Unknown exercise_id: ${ex.exercise_id}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function swapExerciseSuggestion(
  exercises: Exercise[],
  currentExerciseId: string
): Exercise[] {
  const current = exercises.find((e) => e.id === currentExerciseId);
  if (!current?.muscle_group) return exercises.filter((e) => e.id !== currentExerciseId).slice(0, 5);
  return exercises
    .filter((e) => e.muscle_group === current.muscle_group && e.id !== currentExerciseId)
    .slice(0, 5);
}
