'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FoodSearchResult } from '@/lib/nutrition/food-types';

const PRESET_MULTIPLIERS = [0.5, 1, 1.5, 2] as const;

type ServingSizeDialogProps = {
  food: FoodSearchResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (food: FoodSearchResult) => void;
};

function scaleFood(food: FoodSearchResult, multiplier: number): FoodSearchResult {
  const scale = (value?: number) =>
    value != null ? Math.round(value * multiplier * 10) / 10 : undefined;

  const baseServing = food.serving_description || 'per serving';
  const servingLabel =
    multiplier === 1
      ? baseServing
      : `${multiplier}× ${baseServing}`;

  return {
    ...food,
    serving_description: servingLabel,
    calories: scale(food.calories),
    protein_grams: scale(food.protein_grams),
    carbs_grams: scale(food.carbs_grams),
    fat_grams: scale(food.fat_grams),
  };
}

export function ServingSizeDialog({
  food,
  open,
  onOpenChange,
  onConfirm,
}: ServingSizeDialogProps) {
  const [multiplier, setMultiplier] = useState(1);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('1');

  useEffect(() => {
    if (open && food) {
      setMultiplier(1);
      setCustomMode(false);
      setCustomValue('1');
    }
  }, [open, food]);

  if (!food) return null;

  const activeMultiplier = customMode ? Number(customValue) || 1 : multiplier;
  const scaled = scaleFood(food, activeMultiplier);

  const handleConfirm = () => {
    if (activeMultiplier <= 0) return;
    onConfirm(scaled);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Serving Size</DialogTitle>
          <DialogDescription>
            Choose how much of &quot;{food.name}&quot; you&apos;re logging.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESET_MULTIPLIERS.map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={!customMode && multiplier === m ? 'default' : 'outline'}
                onClick={() => {
                  setCustomMode(false);
                  setMultiplier(m);
                }}
              >
                {m}×
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant={customMode ? 'default' : 'outline'}
              onClick={() => setCustomMode(true)}
            >
              Custom
            </Button>
          </div>

          {customMode && (
            <div className="space-y-2">
              <Label htmlFor="custom_multiplier">Custom multiplier</Label>
              <Input
                id="custom_multiplier"
                type="number"
                step="0.1"
                min="0.1"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
              />
            </div>
          )}

          <div className="rounded-md border p-3 text-sm space-y-1">
            <p className="font-medium">{scaled.name}</p>
            <p className="text-muted-foreground">{scaled.serving_description}</p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              {scaled.calories != null && <span>{Math.round(scaled.calories)} cal</span>}
              {scaled.protein_grams != null && <span>P {Math.round(scaled.protein_grams)}g</span>}
              {scaled.carbs_grams != null && <span>C {Math.round(scaled.carbs_grams)}g</span>}
              {scaled.fat_grams != null && <span>F {Math.round(scaled.fat_grams)}g</span>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={activeMultiplier <= 0}>
            Add Food
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
