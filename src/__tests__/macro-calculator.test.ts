import { describe, it, expect } from 'vitest';
import { suggestMacros } from '@/lib/nutrition/macro-calculator';

describe('suggestMacros', () => {
  it('returns positive macro targets for a typical male', () => {
    const result = suggestMacros({
      weightKg: 80,
      heightCm: 180,
      age: 30,
      sex: 'male',
      activity: 'moderate',
      goal: 'maintain',
    });

    expect(result.daily_calories).toBeGreaterThan(1200);
    expect(result.protein_grams).toBeGreaterThan(0);
    expect(result.carbs_grams).toBeGreaterThanOrEqual(0);
    expect(result.fat_grams).toBeGreaterThan(0);
  });

  it('reduces calories for lose goal vs maintain', () => {
    const base = {
      weightKg: 70,
      heightCm: 170,
      age: 25,
      sex: 'female' as const,
      activity: 'light' as const,
    };
    const maintain = suggestMacros({ ...base, goal: 'maintain' });
    const lose = suggestMacros({ ...base, goal: 'lose' });
    expect(lose.daily_calories).toBeLessThan(maintain.daily_calories);
  });

  it('increases calories for gain goal vs maintain', () => {
    const base = {
      weightKg: 75,
      heightCm: 175,
      age: 28,
      sex: 'male' as const,
      activity: 'moderate' as const,
    };
    const maintain = suggestMacros({ ...base, goal: 'maintain' });
    const gain = suggestMacros({ ...base, goal: 'gain' });
    expect(gain.daily_calories).toBeGreaterThan(maintain.daily_calories);
  });
});
