export type MacroSuggestion = {
  daily_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
};

export type MacroInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'male' | 'female';
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
};

const ACTIVITY_MULTIPLIER: Record<MacroInput['activity'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function bmr(input: MacroInput): number {
  const { weightKg, heightCm, age, sex } = input;
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function suggestMacros(input: MacroInput): MacroSuggestion {
  let calories = Math.round(bmr(input) * ACTIVITY_MULTIPLIER[input.activity]);
  if (input.goal === 'lose') calories -= 400;
  if (input.goal === 'gain') calories += 300;
  calories = Math.max(1200, calories);

  const protein_grams = Math.round((input.weightKg * (input.goal === 'gain' ? 2 : 1.8)) * 10) / 10;
  const fat_grams = Math.round((calories * 0.25) / 9);
  const carbs_grams = Math.max(
    0,
    Math.round((calories - protein_grams * 4 - fat_grams * 9) / 4)
  );

  return {
    daily_calories: calories,
    protein_grams,
    carbs_grams,
    fat_grams,
  };
}
