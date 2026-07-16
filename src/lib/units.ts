export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'ft';

export type UnitPreferences = {
  weight: WeightUnit;
  height: HeightUnit;
  week_starts_on: number;
};

export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  weight: 'lb',
  height: 'ft',
  week_starts_on: 0,
};

export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / 2.20462) * 10) / 10;
}

export function formatWeight(kg: number | undefined | null, unit: WeightUnit = 'lb'): string {
  if (kg == null) return '—';
  if (unit === 'kg') return `${kg} kg`;
  return `${kgToLb(kg)} lb`;
}

export function cmToFeetInches(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

export function formatHeight(cm: number | undefined | null, unit: HeightUnit = 'ft'): string {
  if (cm == null) return '—';
  if (unit === 'cm') return `${cm} cm`;
  return cmToFeetInches(cm);
}
