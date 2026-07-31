'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { mealsApi } from '@/lib/supabase/dashboard-api';
import type { MealDraft } from '@/lib/ai/schemas';
import { TagChipInput } from '@/components/nutrition/tag-chip-input';
import { DIETARY_RESTRICTION_SUGGESTIONS } from '@/components/nutrition/ClientIntakeForm';

type Props = {
  nutritionPlanId: string;
  onApplied: () => void;
  clientId?: string;
  initialDietaryTags?: string[];
};

export default function GenerateMealWeekButton({
  nutritionPlanId,
  onApplied,
  clientId,
  initialDietaryTags = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<MealDraft | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [dietaryTags, setDietaryTags] = useState<string[]>(initialDietaryTags);

  const handleOpen = () => {
    setDietaryTags(initialDietaryTags);
    setOpen(true);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch('/api/ai/meal-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutrition_plan_id: nutritionPlanId,
          client_id: clientId || undefined,
          dietary_tags: dietaryTags.length > 0 ? dietaryTags : undefined,
          use_ai: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Generation failed');
      setPreview(data.draft);
      setWarnings(data.warnings || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      for (const day of preview.days) {
        for (const meal of day.meals) {
          await mealsApi.createMeal(nutritionPlanId, day.day_of_week, {
            name: meal.name,
            meal_type: meal.meal_type,
            calories: meal.calories,
            protein_grams: meal.protein_grams,
            carbs_grams: meal.carbs_grams,
            fat_grams: meal.fat_grams,
            notes: meal.notes,
          });
        }
      }
      toast.success('Week skeleton applied — replace placeholder meals with real foods');
      setOpen(false);
      setPreview(null);
      onApplied();
    } catch {
      toast.error('Failed to apply meals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleOpen}>
        <Sparkles className="h-4 w-4" />
        Generate week
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate meal week</DialogTitle>
            <DialogDescription>
              Splits your macro targets across 7 days. Edit each meal after applying.
            </DialogDescription>
          </DialogHeader>

          {preview ? (
            <div className="space-y-2 text-sm">
              <p>{preview.summary}</p>
              <p className="text-muted-foreground">
                {preview.days.length} days · {preview.days.reduce((n, d) => n + d.meals.length, 0)} meals
              </p>
              {warnings.length > 0 && (
                <ul className="text-amber-700 text-xs space-y-1">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Uses daily calories and macros already set on this plan.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Dietary restrictions</p>
                <TagChipInput
                  value={dietaryTags}
                  onChange={setDietaryTags}
                  suggestions={DIETARY_RESTRICTION_SUGGESTIONS}
                  placeholder="Add another restriction..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setPreview(null); }}>Cancel</Button>
            {!preview ? (
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? 'Generating…' : 'Generate'}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setPreview(null)}>Back</Button>
                <Button onClick={handleApply} disabled={loading}>Apply to plan</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
