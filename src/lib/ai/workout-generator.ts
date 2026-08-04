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

export type ExerciseDifficultyRating = {
  exercise_id: string;
  avg_difficulty: number;
  log_count: number;
};

export function easierExercise(
  exercises: Exercise[],
  currentId: string
): Exercise | undefined {
  const current = exercises.find((e) => e.id === currentId);
  if (!current) return undefined;
  const sameMuscle = exercises.filter(
    (e) =>
      e.id !== currentId &&
      e.muscle_group === current.muscle_group &&
      (e.difficulty === 'beginner' || e.equipment?.toLowerCase().includes('bodyweight'))
  );
  return sameMuscle[0] || swapExerciseSuggestion(exercises, currentId)[0];
}

export function harderExercise(
  exercises: Exercise[],
  currentId: string
): Exercise | undefined {
  const current = exercises.find((e) => e.id === currentId);
  if (!current) return undefined;
  return exercises.find(
    (e) =>
      e.id !== currentId &&
      e.muscle_group === current.muscle_group &&
      e.difficulty === 'advanced'
  );
}

export function regenerateWeekFromRatings(input: {
  sessions: WorkoutDraft['sessions'];
  exercises: Exercise[];
  ratings: ExerciseDifficultyRating[];
}): { sessions: WorkoutDraft['sessions']; adjustments: string[] } {
  const ratingMap = new Map(input.ratings.map((r) => [r.exercise_id, r]));
  const adjustments: string[] = [];

  const sessions = input.sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((ex) => {
      const rating = ratingMap.get(ex.exercise_id);
      if (!rating || rating.log_count < 1) return ex;

      if (rating.avg_difficulty >= 4) {
        const swap = easierExercise(input.exercises, ex.exercise_id);
        if (swap?.id) {
          adjustments.push(
            `${swap.name}: swapped (client rated ${rating.avg_difficulty.toFixed(1)}/5 hard)`
          );
          return {
            ...ex,
            exercise_id: swap.id,
            sets: Math.max(2, (ex.sets || 3) - 1),
            rest_seconds: Math.min(180, (ex.rest_seconds || 60) + 30),
            notes: 'Regenerated — reduced load after high difficulty ratings',
          };
        }
        return {
          ...ex,
          sets: Math.max(2, (ex.sets || 3) - 1),
          rest_seconds: Math.min(180, (ex.rest_seconds || 60) + 30),
          notes: 'Regenerated — easier volume after high difficulty ratings',
        };
      }

      if (rating.avg_difficulty <= 2 && rating.log_count >= 2) {
        const swap = harderExercise(input.exercises, ex.exercise_id);
        if (swap?.id) {
          adjustments.push(
            `${swap.name}: progressed (client rated ${rating.avg_difficulty.toFixed(1)}/5 easy)`
          );
          return {
            ...ex,
            exercise_id: swap.id,
            sets: Math.min(5, (ex.sets || 3) + 1),
            notes: 'Regenerated — progressed after easy difficulty ratings',
          };
        }
        return {
          ...ex,
          sets: Math.min(5, (ex.sets || 3) + 1),
          notes: 'Regenerated — added volume after easy ratings',
        };
      }

      return ex;
    }),
  }));

  return { sessions, adjustments };
}
