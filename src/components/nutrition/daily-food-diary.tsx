'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { foodDiaryApi, FoodDiaryEntry } from '@/lib/supabase/food-diary-api';
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
import { Search, Plus, Trash2, Flame } from 'lucide-react';

type FoodSearchResult = {
  food_id: string;
  food_name: string;
  food_description?: string;
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export function DailyFoodDiary() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<FoodDiaryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
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

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Search failed');
        setSearchResults([]);
      } else {
        setSearchResults(data.foods || []);
      }
    } catch {
      setError('Food search unavailable');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFood = async (food: FoodSearchResult) => {
    if (!user?.id) return;
    const desc = food.food_description || '';
    const calMatch = desc.match(/Calories:\s*([\d.]+)/i);
    const proteinMatch = desc.match(/Protein:\s*([\d.]+)/i);
    const carbsMatch = desc.match(/Carbs:\s*([\d.]+)/i);
    const fatMatch = desc.match(/Fat:\s*([\d.]+)/i);

    await foodDiaryApi.createEntry({
      user_id: user.id,
      logged_date: selectedDate,
      meal_type: mealType,
      food_name: food.food_name,
      serving_description: desc.split('|')[0]?.trim(),
      calories: calMatch ? Number(calMatch[1]) : undefined,
      protein_grams: proteinMatch ? Number(proteinMatch[1]) : undefined,
      carbs_grams: carbsMatch ? Number(carbsMatch[1]) : undefined,
      fat_grams: fatMatch ? Number(fatMatch[1]) : undefined,
      fatsecret_food_id: food.food_id,
    });
    setSearchResults([]);
    setSearchQuery('');
    loadEntries();
  };

  const handleManualAdd = async () => {
    if (!user?.id || !searchQuery.trim()) return;
    await foodDiaryApi.createEntry({
      user_id: user.id,
      logged_date: selectedDate,
      meal_type: mealType,
      food_name: searchQuery.trim(),
    });
    setSearchQuery('');
    loadEntries();
  };

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein_grams || 0),
      carbs: acc.carbs + (e.carbs_grams || 0),
      fat: acc.fat + (e.fat_grams || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="space-y-4">
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
          <Select value={mealType} onValueChange={(v) => setMealType(v as FoodDiaryEntry['meal_type'])}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEAL_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Daily Totals
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-2 text-center text-sm">
          <div><p className="text-muted-foreground">Cal</p><p className="font-bold">{Math.round(totals.calories)}</p></div>
          <div><p className="text-muted-foreground">Protein</p><p className="font-bold">{Math.round(totals.protein)}g</p></div>
          <div><p className="text-muted-foreground">Carbs</p><p className="font-bold">{Math.round(totals.carbs)}g</p></div>
          <div><p className="text-muted-foreground">Fat</p><p className="font-bold">{Math.round(totals.fat)}g</p></div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Input
          placeholder="Search foods (FatSecret) or type manually..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={searching} className="gap-1">
          <Search className="h-4 w-4" />
          Search
        </Button>
        <Button variant="outline" onClick={handleManualAdd} disabled={!searchQuery.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {searchResults.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            {searchResults.map((food) => (
              <button
                key={food.food_id}
                type="button"
                className="w-full text-left p-2 rounded hover:bg-accent text-sm"
                onClick={() => handleAddFood(food)}
              >
                <p className="font-medium">{food.food_name}</p>
                {food.food_description && (
                  <p className="text-xs text-muted-foreground truncate">{food.food_description}</p>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {MEAL_TYPES.map((type) => {
        const mealEntries = entries.filter(e => e.meal_type === type);
        if (mealEntries.length === 0) return null;
        return (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base capitalize">{type}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mealEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 rounded border text-sm">
                  <div>
                    <p className="font-medium">{entry.food_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.calories ? `${Math.round(entry.calories)} cal` : ''}
                      {entry.protein_grams ? ` · ${entry.protein_grams}g protein` : ''}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => entry.id && foodDiaryApi.deleteEntry(entry.id).then(loadEntries)}>
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
