import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mealsApi,
  nutritionPlansApi,
  planTemplatesApi,
} from '@/lib/supabase/dashboard-api';

describe('duplicateNutritionTemplate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('copies recipe and all meal fields when duplicating templates', async () => {
    const createMealSpy = vi.spyOn(mealsApi, 'createMeal').mockResolvedValue({
      id: 'new-meal',
      meal_plan_id: 'mp-copy',
      name: 'Breakfast',
    });

    vi.spyOn(nutritionPlansApi, 'getPlan').mockResolvedValue({
      id: 'src-plan',
      user_id: 'trainer-id',
      name: 'Lean Bulk',
      daily_calories: 2800,
      protein_grams: 180,
      carbs_grams: 300,
      fat_grams: 80,
    });

    vi.spyOn(nutritionPlansApi, 'createNutritionPlan').mockResolvedValue({
      id: 'copy-plan',
      user_id: 'trainer-id',
      name: 'Lean Bulk (Copy)',
    });

    vi.spyOn(mealsApi, 'getMealsForNutritionPlan').mockResolvedValue([
      {
        id: 'meal-1',
        meal_plan_id: 'mp-src',
        name: 'Protein Oats',
        meal_type: 'breakfast',
        calories: 520,
        protein_grams: 35,
        carbs_grams: 55,
        fat_grams: 12,
        recipe: '1 cup oats, 1 scoop whey, berries',
        notes: 'Pre-workout',
        day_of_week: 1,
      },
    ]);

    await planTemplatesApi.duplicateNutritionTemplate('src-plan', 'trainer-id');

    expect(createMealSpy).toHaveBeenCalledWith(
      'copy-plan',
      1,
      expect.objectContaining({
        name: 'Protein Oats',
        meal_type: 'breakfast',
        calories: 520,
        protein_grams: 35,
        carbs_grams: 55,
        fat_grams: 12,
        recipe: '1 cup oats, 1 scoop whey, berries',
        notes: 'Pre-workout',
      })
    );
  });
});
