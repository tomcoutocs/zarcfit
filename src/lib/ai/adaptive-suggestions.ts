import type { Exercise } from '@/lib/supabase/dashboard-api';
import { easierExercise } from './workout-generator';

/**
 * Aggregate difficulty stats for one exercise for one client. `hard_count` /
 * `easy_count` are counts of individual logs rated >=4 or <=2 respectively —
 * distinct from `avg_difficulty`, which can hide a mixed rating history.
 */
export type ExerciseRatingAggregate = {
  exercise_id: string;
  exercise_name: string;
  muscle_group?: string;
  avg_difficulty: number;
  log_count: number;
  hard_count: number;
  easy_count: number;
  last_rated_at?: string;
};

export type SwapSuggestion = {
  exercise_id: string;
  exercise_name: string;
  suggested_exercise_id: string;
  suggested_exercise_name: string;
  reason: string;
  avg_difficulty: number;
  hard_count: number;
};

/** Client must have rated an exercise "hard" (>=4/5) at least this many times before we suggest a swap. */
export const MIN_HARD_RATINGS_FOR_SWAP = 2;

/**
 * CA-603 — after 2+ hard ratings for the same exercise, suggest an easier
 * substitute from the exercise library. This never mutates a program; it
 * only returns preview suggestions for a trainer to review and apply.
 */
export function suggestSwapsForRatings(
  exercises: Exercise[],
  ratings: ExerciseRatingAggregate[]
): SwapSuggestion[] {
  const suggestions: SwapSuggestion[] = [];

  for (const rating of ratings) {
    if (rating.hard_count < MIN_HARD_RATINGS_FOR_SWAP) continue;

    const current = exercises.find((e) => e.id === rating.exercise_id);
    if (!current) continue;

    const swap = easierExercise(exercises, rating.exercise_id);
    if (!swap?.id || swap.id === rating.exercise_id) continue;

    suggestions.push({
      exercise_id: rating.exercise_id,
      exercise_name: current.name,
      suggested_exercise_id: swap.id,
      suggested_exercise_name: swap.name,
      reason: `Rated hard ${rating.hard_count}× (avg ${rating.avg_difficulty.toFixed(1)}/5)`,
      avg_difficulty: rating.avg_difficulty,
      hard_count: rating.hard_count,
    });
  }

  return suggestions.sort(
    (a, b) => b.hard_count - a.hard_count || b.avg_difficulty - a.avg_difficulty
  );
}
