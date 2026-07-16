'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { FoodSearchResult } from '@/lib/nutrition/food-types';
import { ServingSizeDialog } from '@/components/nutrition/serving-size-dialog';
import { Search, Loader2 } from 'lucide-react';

type FoodSearchProps = {
  onSelect: (food: FoodSearchResult) => void;
  label?: string;
  placeholder?: string;
};

export function FoodSearch({
  onSelect,
  label = 'Search foods',
  placeholder = 'Search foods (e.g. chicken breast, oatmeal)...',
}: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [pendingFood, setPendingFood] = useState<FoodSearchResult | null>(null);
  const [servingDialogOpen, setServingDialogOpen] = useState(false);

  const runSearch = useCallback(async (searchTerm: string) => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(searchTerm.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Food search failed');
        setResults([]);
        return;
      }
      setResults(data.foods || []);
    } catch {
      setError('Food search is temporarily unavailable.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => runSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => runSearch(query)}
          disabled={searching || query.trim().length < 2}
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-1 max-h-48 overflow-y-auto">
            {results.map((food) => (
              <button
                key={`${food.source}-${food.id}`}
                type="button"
                className="w-full text-left p-2 rounded-md hover:bg-accent text-sm"
                onClick={() => {
                  setPendingFood(food);
                  setServingDialogOpen(true);
                }}
              >
                <p className="font-medium">{food.name}</p>
                <p className="text-xs text-muted-foreground">
                  {food.brand ? `${food.brand} · ` : ''}
                  {food.serving_description || 'per serving'}
                  {food.calories != null ? ` · ${Math.round(food.calories)} cal` : ''}
                  {food.protein_grams != null ? ` · P ${Math.round(food.protein_grams)}g` : ''}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <ServingSizeDialog
        food={pendingFood}
        open={servingDialogOpen}
        onOpenChange={setServingDialogOpen}
        onConfirm={(scaled) => {
          onSelect(scaled);
          setQuery('');
          setResults([]);
          setPendingFood(null);
        }}
      />
    </div>
  );
}
