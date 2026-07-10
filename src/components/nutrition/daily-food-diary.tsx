'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { foodDiaryApi, FoodDiaryEntry } from '@/lib/supabase/food-diary-api';
import { FoodSearch } from '@/components/nutrition/food-search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2 } from 'lucide-react';
import type { FoodSearchResult } from '@/lib/nutrition/food-types';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

type DailyFoodDiaryProps = {
  onTotalsChange?: (totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
};

export function DailyFoodDiary({ onTotalsChange }: DailyFoodDiaryProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<FoodDiaryEntry[]>([]);
  const [mealType, setMealType] = useState<FoodDiaryEntry['meal_type']>('breakfast');
  const [error, setError] = useState('');

  const loadEntries = useCallback(async () => {
    if (!user?.id) return;
    const data = await foodDiaryApi.getEntriesForDate(user.id, selectedDate);
    setEntries(data);
  }, [user?.id, selectedDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein_grams || 0),
      carbs: acc.carbs + (e.carbs_grams || 0),
      fat: acc.fat + (e.fat_grams || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  useEffect(() => {
    onTotalsChange?.(totals);
  }, [totals, onTotalsChange]);

  const handleSelectFood = async (food: FoodSearchResult) => {
    if (!user?.id) return;
    setError('');

    const created = await foodDiaryApi.createEntry({
      user_id: user.id,
      logged_date: selectedDate,
      meal_type: mealType,
      food_name: food.name,
      serving_description: food.serving_description,
      calories: food.calories,
      protein_grams: food.protein_grams,
      carbs_grams: food.carbs_grams,
      fat_grams: food.fat_grams,
      fatsecret_food_id: food.id,
      notes: food.brand ? `Brand: ${food.brand}` : undefined,
    });

    if (!created) {
      setError('Failed to add food. Please try again.');
      return;
    }
    loadEntries();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="diary_date">Date</Label>
          <Input
            id="diary_date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Meal</Label>
          <Select
            value={mealType}
            onValueChange={(v) => setMealType(v as FoodDiaryEntry['meal_type'])}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEAL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FoodSearch
        onSelect={handleSelectFood}
        label="Add food"
        placeholder="Search USDA & Open Food Facts..."
      />

      {MEAL_TYPES.map((type) => {
        const mealEntries = entries.filter((e) => e.meal_type === type);
        if (mealEntries.length === 0) return null;
        return (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base capitalize">{type}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mealEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 rounded border text-sm"
                >
                  <div>
                    <p className="font-medium">{entry.food_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.serving_description || ''}
                      {entry.calories ? ` · ${Math.round(entry.calories)} cal` : ''}
                      {entry.protein_grams ? ` · P ${entry.protein_grams}g` : ''}
                      {entry.carbs_grams ? ` · C ${entry.carbs_grams}g` : ''}
                      {entry.fat_grams ? ` · F ${entry.fat_grams}g` : ''}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      entry.id && foodDiaryApi.deleteEntry(entry.id).then(loadEntries)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
