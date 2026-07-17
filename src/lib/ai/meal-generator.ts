import type { MealDraft } from './schemas';

const SLOT_RATIOS = {
  breakfast: 0.25,
  lunch: 0.3,
  dinner: 0.35,
  snack: 0.1,
} as const;

const SLOT_FOODS: Record<keyof typeof SLOT_RATIOS, string[]> = {
  breakfast: ['Greek yogurt with berries', 'Oatmeal with banana', 'Scrambled eggs with toast'],
  lunch: ['Grilled chicken salad', 'Turkey wrap with vegetables', 'Brown rice bowl with lean protein'],
  dinner: ['Salmon with roasted vegetables', 'Lean beef stir-fry', 'Chicken breast with sweet potato'],
  snack: ['Protein shake', 'Apple with almond butter', 'Cottage cheese'],
};

export type MacroTargets = {
  daily_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
};

export function generateMealSkeleton(targets: MacroTargets): MealDraft {
  const days: MealDraft['days'] = [];

  for (let day = 1; day <= 7; day++) {
    const meals = (Object.keys(SLOT_RATIOS) as (keyof typeof SLOT_RATIOS)[]).map((meal_type) => {
      const ratio = SLOT_RATIOS[meal_type];
      const names = SLOT_FOODS[meal_type];
      const name = names[(day - 1) % names.length];
      return {
        meal_type,
        name,
        calories: Math.round(targets.daily_calories * ratio),
        protein_grams: Math.round(targets.protein_grams * ratio * 10) / 10,
        carbs_grams: Math.round(targets.carbs_grams * ratio * 10) / 10,
        fat_grams: Math.round(targets.fat_grams * ratio * 10) / 10,
        notes: 'Skeleton — replace with specific foods',
      };
    });
    days.push({ day_of_week: day, meals });
  }

  return {
    days,
    summary: 'Macro-balanced skeleton across 7 days. Edit meals or run AI fill for food search matches.',
  };
}

export function validateMealDraft(
  draft: MealDraft,
  targets: MacroTargets,
  tolerancePct = 0.15
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  for (const day of draft.days) {
    const totals = day.meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein_grams,
      }),
      { calories: 0, protein: 0 }
    );
    const calDiff = Math.abs(totals.calories - targets.daily_calories) / targets.daily_calories;
    if (calDiff > tolerancePct) {
      warnings.push(`Day ${day.day_of_week}: calories ${totals.calories} vs target ${targets.daily_calories}`);
    }
  }
  return { valid: warnings.length === 0, warnings };
}
