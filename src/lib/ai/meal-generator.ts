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

// Used whenever the plan is tagged vegan or vegetarian — every item here is
// vegan-safe, so it's compliant for both restrictions without needing a
// separate vegetarian-only list.
const VEGAN_SLOT_FOODS: Record<keyof typeof SLOT_RATIOS, string[]> = {
  breakfast: ['Tofu scramble with vegetables', 'Oatmeal with banana and almond milk', 'Chia pudding with berries'],
  lunch: ['Chickpea and quinoa salad', 'Lentil and vegetable wrap', 'Black bean rice bowl'],
  dinner: ['Tempeh stir-fry with brown rice', 'Black bean and sweet potato bowl', 'Vegetable and chickpea curry'],
  snack: ['Plant-based protein shake', 'Apple with almond butter', 'Roasted chickpeas'],
};

export type MacroTargets = {
  daily_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
};

function isVegan(tags?: string[]): boolean {
  return Boolean(tags?.some((t) => t.toLowerCase().includes('vegan')));
}

function isVegetarian(tags?: string[]): boolean {
  return Boolean(tags?.some((t) => t.toLowerCase().includes('vegetarian')));
}

export function generateMealSkeleton(targets: MacroTargets, dietaryTags?: string[]): MealDraft {
  const useVeganFoods = isVegan(dietaryTags) || isVegetarian(dietaryTags);
  const foods = useVeganFoods ? VEGAN_SLOT_FOODS : SLOT_FOODS;
  const days: MealDraft['days'] = [];

  for (let day = 1; day <= 7; day++) {
    const meals = (Object.keys(SLOT_RATIOS) as (keyof typeof SLOT_RATIOS)[]).map((meal_type) => {
      const ratio = SLOT_RATIOS[meal_type];
      const names = foods[meal_type];
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

// Keyword-based restriction check — deliberately simple. Vegan is kept
// strict (no meat, fish, or other animal flesh); vegetarian excludes the
// same list. This runs on both AI and rules-based drafts before they reach
// the trainer's preview.
const VEGAN_BANNED_KEYWORDS = [
  'chicken',
  'beef',
  'pork',
  'fish',
  'turkey',
  'bacon',
  'salmon',
  'shrimp',
  'tuna',
  'lamb',
  'meat',
  'sausage',
  'ham',
  'gelatin',
];

export function findDietaryViolations(draft: MealDraft, dietaryTags?: string[]): string[] {
  if (!isVegan(dietaryTags) && !isVegetarian(dietaryTags)) return [];

  const violations: string[] = [];
  for (const day of draft.days) {
    for (const meal of day.meals) {
      const haystack = `${meal.name} ${meal.notes || ''}`.toLowerCase();
      const hit = VEGAN_BANNED_KEYWORDS.find((keyword) => haystack.includes(keyword));
      if (hit) {
        violations.push(`Day ${day.day_of_week}: "${meal.name}" appears to contain "${hit}"`);
      }
    }
  }
  return violations;
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
