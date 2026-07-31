'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagChipInput } from '@/components/nutrition/tag-chip-input';
import type { ActivityLevel, PrimaryGoal } from '@/lib/supabase/dashboard-api';

export const DIETARY_RESTRICTION_SUGGESTIONS = [
  'vegan',
  'vegetarian',
  'gluten-free',
  'dairy-free',
  'nut allergy',
  'halal',
  'kosher',
];

export const ALLERGY_SUGGESTIONS = ['peanuts', 'tree nuts', 'shellfish', 'dairy', 'eggs', 'soy', 'gluten'];

export type IntakeFormValues = {
  height_cm: string;
  weight_kg: string;
  date_of_birth: string;
  gender: string;
  activity_level: ActivityLevel | '';
  primary_goal: PrimaryGoal | '';
  dietary_restrictions: string[];
  allergies: string[];
};

export const emptyIntakeForm: IntakeFormValues = {
  height_cm: '',
  weight_kg: '',
  date_of_birth: '',
  gender: '',
  activity_level: '',
  primary_goal: '',
  dietary_restrictions: [],
  allergies: [],
};

type Props = {
  value: IntakeFormValues;
  onChange: (next: IntakeFormValues) => void;
  idPrefix?: string;
};

export function ClientIntakeForm({ value, onChange, idPrefix = 'intake' }: Props) {
  const set = <K extends keyof IntakeFormValues>(key: K, v: IntakeFormValues[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-height`}>Height (cm)</Label>
          <Input
            id={`${idPrefix}-height`}
            type="number"
            value={value.height_cm}
            onChange={(e) => set('height_cm', e.target.value)}
            placeholder="e.g. 175"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-weight`}>Weight (kg)</Label>
          <Input
            id={`${idPrefix}-weight`}
            type="number"
            value={value.weight_kg}
            onChange={(e) => set('weight_kg', e.target.value)}
            placeholder="e.g. 75"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-dob`}>Date of Birth</Label>
          <Input
            id={`${idPrefix}-dob`}
            type="date"
            value={value.date_of_birth}
            onChange={(e) => set('date_of_birth', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-gender`}>Sex</Label>
          <Select value={value.gender} onValueChange={(v) => set('gender', v)}>
            <SelectTrigger id={`${idPrefix}-gender`}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-activity`}>Activity Level</Label>
          <Select
            value={value.activity_level}
            onValueChange={(v) => set('activity_level', v as ActivityLevel)}
          >
            <SelectTrigger id={`${idPrefix}-activity`}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
              <SelectItem value="light">Light (1-3 days/week)</SelectItem>
              <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
              <SelectItem value="active">Active (6-7 days/week)</SelectItem>
              <SelectItem value="very_active">Very active (physical job + training)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-goal`}>Primary Goal</Label>
          <Select value={value.primary_goal} onValueChange={(v) => set('primary_goal', v as PrimaryGoal)}>
            <SelectTrigger id={`${idPrefix}-goal`}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lose">Lose weight</SelectItem>
              <SelectItem value="maintain">Maintain</SelectItem>
              <SelectItem value="gain">Gain muscle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Dietary Restrictions</Label>
        <TagChipInput
          value={value.dietary_restrictions}
          onChange={(next) => set('dietary_restrictions', next)}
          suggestions={DIETARY_RESTRICTION_SUGGESTIONS}
          placeholder="Add another restriction..."
        />
      </div>

      <div className="space-y-2">
        <Label>Allergies</Label>
        <TagChipInput
          value={value.allergies}
          onChange={(next) => set('allergies', next)}
          suggestions={ALLERGY_SUGGESTIONS}
          placeholder="Add another allergy..."
        />
      </div>
    </div>
  );
}
