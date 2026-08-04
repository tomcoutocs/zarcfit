import { describe, it, expect } from 'vitest';
import { suggestSwapsForRatings, MIN_HARD_RATINGS_FOR_SWAP } from '@/lib/ai/adaptive-suggestions';
import type { ExerciseRatingAggregate } from '@/lib/ai/adaptive-suggestions';
import type { Exercise } from '@/lib/supabase/dashboard-api';

const mockExercises: Exercise[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell', difficulty: 'advanced' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Push-Up', muscle_group: 'Chest', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Squat', muscle_group: 'Legs', equipment: 'Barbell', difficulty: 'advanced' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Bodyweight Lunge', muscle_group: 'Legs', equipment: 'Bodyweight', difficulty: 'beginner' },
];

function rating(overrides: Partial<ExerciseRatingAggregate>): ExerciseRatingAggregate {
  return {
    exercise_id: mockExercises[0].id!,
    exercise_name: mockExercises[0].name,
    avg_difficulty: 4.5,
    log_count: 2,
    hard_count: 2,
    easy_count: 0,
    ...overrides,
  };
}

describe('adaptive-suggestions', () => {
  it('suggests a swap once an exercise has 2+ hard ratings', () => {
    const suggestions = suggestSwapsForRatings(mockExercises, [rating({})]);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggested_exercise_id).toBe(mockExercises[1].id);
    expect(suggestions[0].exercise_id).toBe(mockExercises[0].id);
  });

  it('does not suggest a swap below the hard-rating threshold', () => {
    const suggestions = suggestSwapsForRatings(
      mockExercises,
      [rating({ hard_count: MIN_HARD_RATINGS_FOR_SWAP - 1 })]
    );
    expect(suggestions).toHaveLength(0);
  });

  it('does not suggest a swap for exercises that are only rated easy', () => {
    const suggestions = suggestSwapsForRatings(
      mockExercises,
      [rating({ hard_count: 0, easy_count: 3, avg_difficulty: 1.5 })]
    );
    expect(suggestions).toHaveLength(0);
  });

  it('ignores ratings for exercises no longer in the library', () => {
    const suggestions = suggestSwapsForRatings(
      mockExercises,
      [rating({ exercise_id: 'unknown-id', exercise_name: 'Deleted Exercise' })]
    );
    expect(suggestions).toHaveLength(0);
  });

  it('sorts suggestions by hard_count, then avg_difficulty, descending', () => {
    const suggestions = suggestSwapsForRatings(mockExercises, [
      rating({ exercise_id: mockExercises[2].id!, exercise_name: 'Squat', hard_count: 2, avg_difficulty: 4.0 }),
      rating({ exercise_id: mockExercises[0].id!, exercise_name: 'Bench Press', hard_count: 3, avg_difficulty: 4.8 }),
    ]);
    expect(suggestions[0].exercise_name).toBe('Bench Press');
    expect(suggestions[1].exercise_name).toBe('Squat');
  });
});
