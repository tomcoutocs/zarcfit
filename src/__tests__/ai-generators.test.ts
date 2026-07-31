import { describe, it, expect } from 'vitest';
import {
  generateWorkoutDraftRules,
  validateWorkoutDraft,
  swapExerciseSuggestion,
  regenerateWeekFromRatings,
} from '@/lib/ai/workout-generator';
import { generateMealSkeleton, validateMealDraft, findDietaryViolations } from '@/lib/ai/meal-generator';
import type { Exercise } from '@/lib/supabase/dashboard-api';

const mockExercises: Exercise[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Squat', muscle_group: 'Legs', equipment: 'Barbell' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Pull-Up', muscle_group: 'Back', equipment: 'Bodyweight' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Push-Up', muscle_group: 'Chest', equipment: 'Bodyweight' },
];

describe('workout-generator', () => {
  it('generates sessions with valid exercise IDs', () => {
    const draft = generateWorkoutDraftRules({
      exercises: mockExercises,
      goal: 'Strength',
      difficulty: 'beginner',
      sessionsPerWeek: 2,
      durationWeeks: 2,
      equipment: 'any',
    });

    expect(draft.sessions.length).toBeGreaterThan(0);
    const ids = new Set(mockExercises.map((e) => e.id!));
    const validation = validateWorkoutDraft(draft, ids);
    expect(validation.valid).toBe(true);
  });

  it('rejects unknown exercise IDs', () => {
    const draft = generateWorkoutDraftRules({
      exercises: mockExercises,
      goal: 'Test',
      difficulty: 'beginner',
      sessionsPerWeek: 1,
      durationWeeks: 1,
      equipment: 'any',
    });
    const validation = validateWorkoutDraft(draft, new Set(['00000000-0000-0000-0000-000000000000']));
    expect(validation.valid).toBe(false);
  });

  it('suggests same muscle group swaps', () => {
    const swaps = swapExerciseSuggestion(mockExercises, mockExercises[0].id!);
    expect(swaps.every((e) => e.muscle_group === 'Chest')).toBe(true);
    expect(swaps.every((e) => e.id !== mockExercises[0].id)).toBe(true);
  });

  it('regenerates week when exercises rated too hard', () => {
    const hardId = mockExercises[0].id!;
    const sessions = [
      {
        name: 'Day 1',
        day_of_week: 1,
        week_number: 1,
        exercises: [
          {
            exercise_id: hardId,
            sets: 3,
            reps: '8-10',
            rest_seconds: 60,
          },
        ],
      },
    ];
    const { sessions: updated, adjustments } = regenerateWeekFromRatings({
      sessions,
      exercises: mockExercises,
      ratings: [{ exercise_id: hardId, avg_difficulty: 4.5, log_count: 2 }],
    });
    expect(updated[0].exercises[0].sets).toBeLessThanOrEqual(3);
    expect(adjustments.length).toBeGreaterThan(0);
  });
});

describe('meal-generator', () => {
  const targets = {
    daily_calories: 2000,
    protein_grams: 150,
    carbs_grams: 200,
    fat_grams: 65,
  };

  it('generates 7 days with four meal slots', () => {
    const draft = generateMealSkeleton(targets);
    expect(draft.days).toHaveLength(7);
    expect(draft.days[0].meals).toHaveLength(4);
  });

  it('totals macros within tolerance', () => {
    const draft = generateMealSkeleton(targets);
    const validation = validateMealDraft(draft, targets, 0.05);
    expect(validation.valid).toBe(true);
  });

  it('uses vegan-safe foods when tagged vegan', () => {
    const draft = generateMealSkeleton(targets, ['vegan']);
    expect(findDietaryViolations(draft, ['vegan'])).toHaveLength(0);
  });

  it('flags meat in a vegan draft', () => {
    const draft = generateMealSkeleton(targets);
    // Default skeleton includes chicken/beef/salmon — must be rejected for vegan.
    expect(findDietaryViolations(draft, ['vegan']).length).toBeGreaterThan(0);
  });

  it('ignores restriction checks when no vegan/vegetarian tag is present', () => {
    const draft = generateMealSkeleton(targets);
    expect(findDietaryViolations(draft, ['gluten-free'])).toHaveLength(0);
  });
});
