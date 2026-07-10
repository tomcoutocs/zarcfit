export type FoodMacros = {
  calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
};

export type FoodSearchResult = {
  id: string;
  name: string;
  brand?: string;
  serving_description?: string;
  source: 'usda' | 'openfoodfacts';
} & FoodMacros;

export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MacroTargets = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export function macroPercent(value: number, target?: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}
