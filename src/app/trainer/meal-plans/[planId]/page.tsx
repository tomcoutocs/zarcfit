'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  mealsApi,
  planTemplatesApi,
  NutritionPlan,
  Meal,
} from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Utensils, Pencil, Trash2 } from 'lucide-react';

const DAYS: { value: number; short: string; full: string }[] = [
  { value: 1, short: 'Mon', full: 'Monday' },
  { value: 2, short: 'Tue', full: 'Tuesday' },
  { value: 3, short: 'Wed', full: 'Wednesday' },
  { value: 4, short: 'Thu', full: 'Thursday' },
  { value: 5, short: 'Fri', full: 'Friday' },
  { value: 6, short: 'Sat', full: 'Saturday' },
  { value: 7, short: 'Sun', full: 'Sunday' },
];

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const emptyMealForm = {
  name: '',
  meal_type: 'breakfast' as Meal['meal_type'],
  calories: '',
  protein_grams: '',
  carbs_grams: '',
  fat_grams: '',
  recipe: '',
  notes: '',
};

type MealWithDay = Meal & { day_of_week: number; meal_plan_id: string };

export default function TrainerMealPlanBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const planId = params?.planId as string;

  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [meals, setMeals] = useState<MealWithDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState(1);

  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealWithDay | null>(null);
  const [mealForm, setMealForm] = useState(emptyMealForm);
  const [savingMeal, setSavingMeal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id || !planId) return;
    setLoading(true);
    setError('');
    try {
      const templates = await planTemplatesApi.getTrainerNutritionTemplates(user.id);
      const found = templates.find((t) => t.id === planId);
      if (!found) {
        setError('Template not found.');
        setPlan(null);
        return;
      }
      setPlan(found);
      const planMeals = await mealsApi.getMealsForNutritionPlan(planId);
      setMeals(planMeals);
    } catch (err) {
      console.error(err);
      setError('Failed to load meal plan template.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, planId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateMealDialog = () => {
    setEditingMeal(null);
    setMealForm(emptyMealForm);
    setMealDialogOpen(true);
  };

  const openEditMealDialog = (meal: MealWithDay) => {
    setEditingMeal(meal);
    setMealForm({
      name: meal.name,
      meal_type: meal.meal_type || 'breakfast',
      calories: meal.calories?.toString() || '',
      protein_grams: meal.protein_grams?.toString() || '',
      carbs_grams: meal.carbs_grams?.toString() || '',
      fat_grams: meal.fat_grams?.toString() || '',
      recipe: meal.recipe || '',
      notes: meal.notes || '',
    });
    setMealDialogOpen(true);
  };

  const handleSaveMeal = async () => {
    if (!plan?.id || !mealForm.name.trim()) return;
    setSavingMeal(true);

    const mealData = {
      name: mealForm.name.trim(),
      meal_type: mealForm.meal_type,
      calories: mealForm.calories ? Number(mealForm.calories) : undefined,
      protein_grams: mealForm.protein_grams ? Number(mealForm.protein_grams) : undefined,
      carbs_grams: mealForm.carbs_grams ? Number(mealForm.carbs_grams) : undefined,
      fat_grams: mealForm.fat_grams ? Number(mealForm.fat_grams) : undefined,
      recipe: mealForm.recipe.trim() || undefined,
      notes: mealForm.notes.trim() || undefined,
    };

    const result = editingMeal
      ? await mealsApi.updateMeal({ ...editingMeal, ...mealData })
      : await mealsApi.createMeal(plan.id, activeDay, mealData);

    setSavingMeal(false);

    if (result) {
      setMealDialogOpen(false);
      fetchData();
    } else {
      setError('Failed to save meal. Please try again.');
    }
  };

  const handleDeleteMeal = async (mealId: string | undefined) => {
    if (!mealId) return;
    if (!confirm('Delete this meal?')) return;
    const ok = await mealsApi.deleteMeal(mealId);
    if (ok) fetchData();
  };

  const mealsForDay = useMemo(
    () => meals.filter((m) => m.day_of_week === activeDay),
    [meals, activeDay]
  );

  const mealsByType = useMemo(() => {
    const groups: Record<string, MealWithDay[]> = {};
    mealsForDay.forEach((m) => {
      const type = m.meal_type || 'snack';
      if (!groups[type]) groups[type] = [];
      groups[type].push(m);
    });
    return groups;
  }, [mealsForDay]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-muted-foreground">{error || 'Template not found'}</p>
        <Button onClick={() => router.push('/trainer/meal-plans')}>Back to Meal Plans</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/trainer/meal-plans">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Meal Plans
        </Button>
      </Link>

      <DashboardPageHeader title={plan.name} description="Weekly meal template builder">
        <Dialog open={mealDialogOpen} onOpenChange={setMealDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateMealDialog}>
              <Plus className="h-4 w-4" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMeal ? 'Edit Meal' : `Add Meal — ${DAYS.find((d) => d.value === activeDay)?.full}`}
              </DialogTitle>
              <DialogDescription>
                {editingMeal ? 'Update meal details.' : 'Add a meal to this day in the template.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meal_name">Name</Label>
                  <Input
                    id="meal_name"
                    value={mealForm.name}
                    onChange={(e) => setMealForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meal_type">Meal Type</Label>
                  <Select
                    value={mealForm.meal_type}
                    onValueChange={(value) =>
                      setMealForm((prev) => ({ ...prev, meal_type: value as Meal['meal_type'] }))
                    }
                  >
                    <SelectTrigger id="meal_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={mealForm.calories}
                    onChange={(e) => setMealForm((prev) => ({ ...prev, calories: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={mealForm.protein_grams}
                    onChange={(e) => setMealForm((prev) => ({ ...prev, protein_grams: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={mealForm.carbs_grams}
                    onChange={(e) => setMealForm((prev) => ({ ...prev, carbs_grams: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={mealForm.fat_grams}
                    onChange={(e) => setMealForm((prev) => ({ ...prev, fat_grams: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipe">Recipe / Ingredients</Label>
                <Textarea
                  id="recipe"
                  rows={2}
                  value={mealForm.recipe}
                  onChange={(e) => setMealForm((prev) => ({ ...prev, recipe: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal_notes">Notes</Label>
                <Textarea
                  id="meal_notes"
                  rows={2}
                  value={mealForm.notes}
                  onChange={(e) => setMealForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMealDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMeal} disabled={savingMeal || !mealForm.name.trim()}>
                {savingMeal ? 'Saving...' : 'Save Meal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardPageHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {plan.daily_calories && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Daily Calories</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{plan.daily_calories}</span>
              <span className="text-muted-foreground text-sm ml-1">kcal</span>
            </CardContent>
          </Card>
        )}
        {plan.protein_grams && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Protein</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{plan.protein_grams}g</span>
            </CardContent>
          </Card>
        )}
        {plan.carbs_grams && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Carbs</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{plan.carbs_grams}g</span>
            </CardContent>
          </Card>
        )}
        {plan.fat_grams && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Fat</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{plan.fat_grams}g</span>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeDay.toString()} onValueChange={(v) => setActiveDay(Number(v))}>
        <TabsList className="grid w-full md:w-auto grid-cols-7 mb-6">
          {DAYS.map((day) => (
            <TabsTrigger key={day.value} value={day.value.toString()}>
              {day.short}
            </TabsTrigger>
          ))}
        </TabsList>

        {DAYS.map((day) => (
          <TabsContent key={day.value} value={day.value.toString()} className="space-y-6">
            {day.value === activeDay && mealsForDay.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No meals for {day.full}</h3>
                <Button onClick={openCreateMealDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Meal
                </Button>
              </div>
            ) : (
              Object.entries(mealsByType).map(([type, typeMeals]) => (
                <Card key={type}>
                  <CardHeader className="pb-2">
                    <CardTitle>{MEAL_TYPE_LABELS[type] || type}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {typeMeals.map((meal) => (
                      <div
                        key={meal.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{meal.name}</span>
                            {meal.calories != null && (
                              <span className="text-sm">{meal.calories} kcal</span>
                            )}
                          </div>
                          {meal.recipe && (
                            <p className="text-sm text-muted-foreground mt-1">{meal.recipe}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditMealDialog(meal)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMeal(meal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
