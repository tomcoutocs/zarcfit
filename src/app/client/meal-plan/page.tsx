'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  nutritionPlansApi,
  mealsApi,
  mealFavoritesApi,
  NutritionPlan,
  Meal,
  MealFavorite,
} from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { DailyFoodDiary } from '@/components/nutrition/daily-food-diary';
import { MacroProgressBars } from '@/components/nutrition/macro-progress-bars';
import { FoodSearch } from '@/components/nutrition/food-search';
import type { FoodSearchResult } from '@/lib/nutrition/food-types';
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
import {
  Plus,
  Utensils,
  Pencil,
  Trash2,
  Settings,
  Copy,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardPageSkeleton } from '@/components/ui/dashboard-skeleton';

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

const emptyPlanForm = {
  name: 'My Nutrition Plan',
  daily_calories: '',
  protein_grams: '',
  carbs_grams: '',
  fat_grams: '',
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

export default function MealPlanPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [meals, setMeals] = useState<MealWithDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState(1);

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [savingPlan, setSavingPlan] = useState(false);

  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealWithDay | null>(null);
  const [mealForm, setMealForm] = useState(emptyMealForm);
  const [savingMeal, setSavingMeal] = useState(false);
  const [copyMeal, setCopyMeal] = useState<MealWithDay | null>(null);
  const [copyTargetDay, setCopyTargetDay] = useState(1);
  const [copyingMeal, setCopyingMeal] = useState(false);
  const [favorites, setFavorites] = useState<MealFavorite[]>([]);
  const [diaryTotals, setDiaryTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const handleDiaryTotalsChange = useCallback(
    (totals: { calories: number; protein: number; carbs: number; fat: number }) => {
      setDiaryTotals(totals);
    },
    []
  );

  const macroTargets = useMemo(
    () => ({
      calories: plan?.daily_calories,
      protein: plan?.protein_grams,
      carbs: plan?.carbs_grams,
      fat: plan?.fat_grams,
    }),
    [plan]
  );

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const activePlan = await nutritionPlansApi.getActiveNutritionPlan(user.id);
      setPlan(activePlan);
      if (activePlan?.id) {
        const [planMeals, userFavorites] = await Promise.all([
          mealsApi.getMealsForNutritionPlan(activePlan.id),
          mealFavoritesApi.getAll(user.id),
        ]);
        setMeals(planMeals);
        setFavorites(userFavorites);
      } else {
        setMeals([]);
        setFavorites(await mealFavoritesApi.getAll(user.id));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load your nutrition plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openPlanDialog = () => {
    setPlanForm(plan ? {
      name: plan.name,
      daily_calories: plan.daily_calories?.toString() || '',
      protein_grams: plan.protein_grams?.toString() || '',
      carbs_grams: plan.carbs_grams?.toString() || '',
      fat_grams: plan.fat_grams?.toString() || '',
    } : emptyPlanForm);
    setPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!user?.id || !planForm.name.trim()) return;
    setSavingPlan(true);

    const payload: NutritionPlan = {
      id: plan?.id,
      user_id: user.id,
      name: planForm.name.trim(),
      daily_calories: planForm.daily_calories ? Number(planForm.daily_calories) : undefined,
      protein_grams: planForm.protein_grams ? Number(planForm.protein_grams) : undefined,
      carbs_grams: planForm.carbs_grams ? Number(planForm.carbs_grams) : undefined,
      fat_grams: planForm.fat_grams ? Number(planForm.fat_grams) : undefined,
      is_active: true,
    };

    const result = plan
      ? await nutritionPlansApi.updateNutritionPlan(payload)
      : await nutritionPlansApi.createNutritionPlan(payload);

    setSavingPlan(false);

    if (result) {
      setPlanDialogOpen(false);
      fetchData();
    } else {
      setError('Failed to save nutrition plan. Please try again.');
    }
  };

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

  const handleSelectFoodForMeal = (food: FoodSearchResult) => {
    setMealForm((prev) => ({
      ...prev,
      name: food.name,
      calories: food.calories?.toString() || '',
      protein_grams: food.protein_grams?.toString() || '',
      carbs_grams: food.carbs_grams?.toString() || '',
      fat_grams: food.fat_grams?.toString() || '',
      recipe: food.serving_description
        ? `Serving: ${food.serving_description}${food.brand ? ` (${food.brand})` : ''}`
        : prev.recipe,
    }));
  };

  const handleDeleteMeal = async (mealId: string | undefined) => {
    if (!mealId) return;
    if (!confirm('Delete this meal? This cannot be undone.')) return;
    const success = await mealsApi.deleteMeal(mealId);
    if (success) fetchData();
  };

  const handleCopyMeal = async () => {
    if (!plan?.id || !copyMeal) return;
    setCopyingMeal(true);
    const result = await mealsApi.createMeal(plan.id, copyTargetDay, {
      name: copyMeal.name,
      meal_type: copyMeal.meal_type,
      calories: copyMeal.calories,
      protein_grams: copyMeal.protein_grams,
      carbs_grams: copyMeal.carbs_grams,
      fat_grams: copyMeal.fat_grams,
      recipe: copyMeal.recipe,
      notes: copyMeal.notes,
    });
    setCopyingMeal(false);
    if (result) {
      toast.success(`Copied to ${DAYS.find((d) => d.value === copyTargetDay)?.full}`);
      setCopyMeal(null);
      setActiveDay(copyTargetDay);
      fetchData();
    } else {
      toast.error('Failed to copy meal');
    }
  };

  const handleSaveFavorite = async (meal: MealWithDay) => {
    if (!user?.id) return;
    const saved = await mealFavoritesApi.save(user.id, meal.name, {
      meal_type: meal.meal_type,
      calories: meal.calories,
      protein_grams: meal.protein_grams,
      carbs_grams: meal.carbs_grams,
      fat_grams: meal.fat_grams,
      recipe: meal.recipe,
      notes: meal.notes,
    });
    if (saved) {
      toast.success('Saved to favorites');
      setFavorites((prev) => [saved, ...prev]);
    } else {
      toast.error('Failed to save favorite');
    }
  };

  const handleAddFavoriteToDay = async (favorite: MealFavorite) => {
    if (!plan?.id) return;
    const data = favorite.food_data as Partial<Meal>;
    const result = await mealsApi.createMeal(plan.id, activeDay, {
      name: favorite.name,
      meal_type: data.meal_type || 'snack',
      calories: data.calories as number | undefined,
      protein_grams: data.protein_grams as number | undefined,
      carbs_grams: data.carbs_grams as number | undefined,
      fat_grams: data.fat_grams as number | undefined,
      recipe: data.recipe as string | undefined,
      notes: data.notes as string | undefined,
    });
    if (result) {
      toast.success(`Added ${favorite.name} to ${DAYS.find((d) => d.value === activeDay)?.full}`);
      fetchData();
    } else {
      toast.error('Failed to add meal');
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    const ok = await mealFavoritesApi.remove(id);
    if (ok) {
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      toast.success('Removed from favorites');
    }
  };

  const mealsForDay = useMemo(
    () => meals.filter(m => m.day_of_week === activeDay),
    [meals, activeDay]
  );

  const dayTotals = useMemo(() => {
    return mealsForDay.reduce((acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein_grams || 0),
      carbs: acc.carbs + (m.carbs_grams || 0),
      fat: acc.fat + (m.fat_grams || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [mealsForDay]);

  const mealsByType = useMemo(() => {
    const groups: Record<string, MealWithDay[]> = {};
    mealsForDay.forEach(m => {
      const type = m.meal_type || 'snack';
      if (!groups[type]) groups[type] = [];
      groups[type].push(m);
    });
    return groups;
  }, [mealsForDay]);

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  if (!plan) {
    return (
      <div className="space-y-8">
        <DashboardPageHeader title="Meal Planning" description="Plan meals and track nutrition" />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Card>
          <CardContent className="py-16 text-center">
            <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No nutrition plan yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Set your daily calorie and macro targets to start planning and logging meals.
            </p>
            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={openPlanDialog}>
                  <Plus className="h-4 w-4" />
                  Create Nutrition Plan
                </Button>
              </DialogTrigger>
              <PlanDialogContent
                planForm={planForm}
                setPlanForm={setPlanForm}
                onSave={handleSavePlan}
                onCancel={() => setPlanDialogOpen(false)}
                saving={savingPlan}
                isEditing={false}
              />
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader title="Meal Planning" description="Plan meals and track nutrition">
        <div className="flex items-center gap-2">
          <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" onClick={openPlanDialog}>
                <Settings className="h-4 w-4" />
                <span>Targets</span>
              </Button>
            </DialogTrigger>
            <PlanDialogContent
              planForm={planForm}
              setPlanForm={setPlanForm}
              onSave={handleSavePlan}
              onCancel={() => setPlanDialogOpen(false)}
              saving={savingPlan}
              isEditing
            />
          </Dialog>
          <Dialog open={mealDialogOpen} onOpenChange={setMealDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 glow-primary" onClick={openCreateMealDialog}>
                <Plus className="h-4 w-4" />
                <span>Add Meal</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMeal ? 'Edit Meal' : `Add Meal — ${DAYS.find(d => d.value === activeDay)?.full}`}</DialogTitle>
                <DialogDescription>
                  {editingMeal ? 'Update the details of this meal.' : 'Add a meal to your plan for this day.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {!editingMeal && (
                  <FoodSearch
                    onSelect={handleSelectFoodForMeal}
                    label="Search food to auto-fill macros"
                    placeholder="Search USDA & Open Food Facts..."
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meal_name">Name</Label>
                    <Input
                      id="meal_name"
                      value={mealForm.name}
                      onChange={(e) => setMealForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Grilled chicken salad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meal_type">Meal Type</Label>
                    <Select
                      value={mealForm.meal_type}
                      onValueChange={(value) => setMealForm(prev => ({ ...prev, meal_type: value as Meal['meal_type'] }))}
                    >
                      <SelectTrigger id="meal_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
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
                      onChange={(e) => setMealForm(prev => ({ ...prev, calories: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      value={mealForm.protein_grams}
                      onChange={(e) => setMealForm(prev => ({ ...prev, protein_grams: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      value={mealForm.carbs_grams}
                      onChange={(e) => setMealForm(prev => ({ ...prev, carbs_grams: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      value={mealForm.fat_grams}
                      onChange={(e) => setMealForm(prev => ({ ...prev, fat_grams: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipe">Recipe / Ingredients</Label>
                  <Textarea
                    id="recipe"
                    rows={2}
                    value={mealForm.recipe}
                    onChange={(e) => setMealForm(prev => ({ ...prev, recipe: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meal_notes">Notes</Label>
                  <Textarea
                    id="meal_notes"
                    rows={2}
                    value={mealForm.notes}
                    onChange={(e) => setMealForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMealDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveMeal} disabled={savingMeal || !mealForm.name.trim()}>
                  {savingMeal ? 'Saving...' : 'Save Meal'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardPageHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <MacroProgressBars
        title="Today's Macro Tracking"
        subtitle={`Plan: ${plan.name} — logged food vs daily targets`}
        totals={diaryTotals}
        targets={macroTargets}
      />

      <Alert className="mb-4">
        <AlertDescription>
          <strong>Daily Diary</strong> tracks what you actually eat today. <strong>Weekly Plan</strong> shows
          meals your trainer assigned — log extras in the diary to hit your macro targets.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="diary" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="diary">Daily Diary</TabsTrigger>
          <TabsTrigger value="plan">Weekly Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="diary">
          <DailyFoodDiary onTotalsChange={handleDiaryTotalsChange} />
        </TabsContent>

        <TabsContent value="plan" className="space-y-8">
      {favorites.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Meal Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {favorites.map((fav) => (
                <div key={fav.id} className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
                  <button
                    type="button"
                    className="hover:text-primary"
                    onClick={() => handleAddFavoriteToDay(fav)}
                  >
                    {fav.name}
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive ml-1"
                    onClick={() => handleRemoveFavorite(fav.id)}
                    aria-label={`Remove ${fav.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Click a favorite to add it to the selected day.</p>
          </CardContent>
        </Card>
      )}

      <MacroProgressBars
        title={`${DAYS.find((d) => d.value === activeDay)?.full} Planned Macros`}
        subtitle="Meals planned for this day vs your targets"
        totals={dayTotals}
        targets={macroTargets}
      />

      <Tabs value={activeDay.toString()} onValueChange={(v) => setActiveDay(Number(v))} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-7 mb-8">
          {DAYS.map(day => (
            <TabsTrigger key={day.value} value={day.value.toString()}>{day.short}</TabsTrigger>
          ))}
        </TabsList>

        {DAYS.map(day => (
          <TabsContent key={day.value} value={day.value.toString()} className="space-y-6">
            {day.value === activeDay && mealsForDay.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <div className="flex flex-col items-center text-center max-w-md">
                  <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No meals planned yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven&apos;t added any meals for {day.full} yet.
                  </p>
                  <Button onClick={openCreateMealDialog} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Meal
                  </Button>
                </div>
              </div>
            ) : (
              Object.entries(mealsByType).map(([type, typeMeals]) => (
                <Card key={type}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <Utensils className="h-4 w-4 text-amber-600" />
                        </div>
                        <CardTitle>{MEAL_TYPE_LABELS[type] || type}</CardTitle>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {typeMeals.reduce((sum, m) => sum + (m.calories || 0), 0)} calories
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {typeMeals.map((meal) => (
                        <div key={meal.id} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div className="font-medium">{meal.name}</div>
                              <div className="text-sm font-medium">{meal.calories ? `${meal.calories} kcal` : ''}</div>
                            </div>
                            {meal.recipe && (
                              <div className="text-sm text-muted-foreground mt-1">{meal.recipe}</div>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              {meal.protein_grams != null && (
                                <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                  <span>P:</span>
                                  <span className="font-medium">{meal.protein_grams}g</span>
                                </div>
                              )}
                              {meal.carbs_grams != null && (
                                <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                                  <span>C:</span>
                                  <span className="font-medium">{meal.carbs_grams}g</span>
                                </div>
                              )}
                              {meal.fat_grams != null && (
                                <div className="flex items-center gap-1 bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full text-xs">
                                  <span>F:</span>
                                  <span className="font-medium">{meal.fat_grams}g</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Save to favorites"
                              onClick={() => handleSaveFavorite(meal)}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Copy to another day"
                              onClick={() => {
                                setCopyMeal(meal);
                                setCopyTargetDay(activeDay === meal.day_of_week ? (activeDay % 7) + 1 : activeDay);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditMealDialog(meal)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteMeal(meal.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
        </TabsContent>
      </Tabs>

      <Dialog open={!!copyMeal} onOpenChange={(open) => !open && setCopyMeal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy meal to another day</DialogTitle>
            <DialogDescription>
              Duplicate &ldquo;{copyMeal?.name}&rdquo; to a different day in your weekly plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="copy_target_day">Target day</Label>
            <Select value={copyTargetDay.toString()} onValueChange={(v) => setCopyTargetDay(Number(v))}>
              <SelectTrigger id="copy_target_day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.full}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyMeal(null)}>Cancel</Button>
            <Button onClick={handleCopyMeal} disabled={copyingMeal}>
              {copyingMeal ? 'Copying...' : 'Copy meal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanDialogContent({
  planForm,
  setPlanForm,
  onSave,
  onCancel,
  saving,
  isEditing,
}: {
  planForm: typeof emptyPlanForm;
  setPlanForm: React.Dispatch<React.SetStateAction<typeof emptyPlanForm>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEditing: boolean;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Nutrition Targets' : 'Create Nutrition Plan'}</DialogTitle>
        <DialogDescription>Set your daily calorie and macro goals.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="plan_name">Plan Name</Label>
          <Input
            id="plan_name"
            value={planForm.name}
            onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="daily_calories">Daily Calories</Label>
            <Input
              id="daily_calories"
              type="number"
              value={planForm.daily_calories}
              onChange={(e) => setPlanForm(prev => ({ ...prev, daily_calories: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein_grams">Protein (g)</Label>
            <Input
              id="protein_grams"
              type="number"
              value={planForm.protein_grams}
              onChange={(e) => setPlanForm(prev => ({ ...prev, protein_grams: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs_grams">Carbs (g)</Label>
            <Input
              id="carbs_grams"
              type="number"
              value={planForm.carbs_grams}
              onChange={(e) => setPlanForm(prev => ({ ...prev, carbs_grams: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fat_grams">Fat (g)</Label>
            <Input
              id="fat_grams"
              type="number"
              value={planForm.fat_grams}
              onChange={(e) => setPlanForm(prev => ({ ...prev, fat_grams: e.target.value }))}
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={saving || !planForm.name.trim()}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
