'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  mealsApi,
  nutritionPlansApi,
  userProfilesApi,
  NutritionPlan,
  Meal,
  MealPlan,
  UserProfile,
  PlanType,
} from '@/lib/supabase/dashboard-api';
import { FoodSearchResult, MacroTotals } from '@/lib/nutrition/food-types';
import { suggestMacros, MacroInput } from '@/lib/nutrition/macro-calculator';
import { FoodSearch } from '@/components/nutrition/food-search';
import { MacroProgressBars } from '@/components/nutrition/macro-progress-bars';
import GenerateMealWeekButton from '@/components/trainer/GenerateMealWeekButton';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Utensils, Trash2, Search, Layers, Calculator, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 7, label: 'Sunday', short: 'Sun' },
] as const;

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const MEAL_TYPE_LABELS: Record<(typeof MEAL_TYPES)[number], string> = {
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

function sumMacros(meals: Pick<Meal, 'calories' | 'protein_grams' | 'carbs_grams' | 'fat_grams'>[]): MacroTotals {
  return meals.reduce<MacroTotals>(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein_grams || 0),
      carbs: acc.carbs + (meal.carbs_grams || 0),
      fat: acc.fat + (meal.fat_grams || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function formKey(day: number, mealType: string) {
  return `${day}-${mealType}`;
}

const emptyMacroCalc = {
  weightKg: '',
  heightCm: '',
  age: '',
  sex: 'male' as MacroInput['sex'],
  activity: 'moderate' as MacroInput['activity'],
  goal: 'maintain' as MacroInput['goal'],
};

const emptyTargetsForm = {
  daily_calories: '',
  protein_grams: '',
  carbs_grams: '',
  fat_grams: '',
};

function ageFromDob(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const diffMs = Date.now() - birth.getTime();
  return Math.max(0, Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)));
}

function MealPlanBuilderContent() {
  const { planId } = useParams<{ planId: string }>();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client');
  const { isTrainer } = useAuth();

  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [dayPlans, setDayPlans] = useState<MealPlan[]>([]);
  const [meals, setMeals] = useState<MealWithDay[]>([]);
  const [openDays, setOpenDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [mealForms, setMealForms] = useState<Record<string, typeof emptyMealForm>>({});
  const [mealSearch, setMealSearch] = useState<Record<string, string>>({});
  const [savingMeal, setSavingMeal] = useState<Record<string, boolean>>({});

  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
  const [showMacroStep, setShowMacroStep] = useState(false);
  const [macroCalc, setMacroCalc] = useState(emptyMacroCalc);
  const [targetsForm, setTargetsForm] = useState(emptyTargetsForm);
  const [savingTargets, setSavingTargets] = useState(false);
  const [savingPlanType, setSavingPlanType] = useState(false);

  const loadData = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setError('');

    const [found, planMeals, plans] = await Promise.all([
      nutritionPlansApi.getPlan(planId),
      mealsApi.getMealsForNutritionPlan(planId),
      mealsApi.getMealPlansForNutritionPlan(planId),
    ]);

    if (!found) {
      setError('Meal plan template not found.');
      setPlan(null);
      setLoading(false);
      return;
    }

    setPlan(found);
    setMeals(planMeals);
    setDayPlans(plans);
    setOpenDays(DAYS.map((d) => String(d.value)));
    setTargetsForm({
      daily_calories: found.daily_calories?.toString() || '',
      protein_grams: found.protein_grams?.toString() || '',
      carbs_grams: found.carbs_grams?.toString() || '',
      fat_grams: found.fat_grams?.toString() || '',
    });
    setShowMacroStep(!found.daily_calories || Boolean(clientId));
    setLoading(false);
  }, [planId, clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Prefill the macro calculator from the client's intake answers, when
  // this plan was opened from a client's Nutrition tab (PF-232).
  useEffect(() => {
    if (!clientId) {
      setClientProfile(null);
      return;
    }
    let cancelled = false;
    userProfilesApi.getProfile(clientId).then((profile) => {
      if (cancelled || !profile) return;
      setClientProfile(profile);
      setMacroCalc((prev) => ({
        ...prev,
        weightKg: profile.weight_kg?.toString() || prev.weightKg,
        heightCm: profile.height_cm?.toString() || prev.heightCm,
        age: ageFromDob(profile.date_of_birth)?.toString() || prev.age,
        sex: profile.gender === 'female' ? 'female' : prev.sex,
        activity: profile.activity_level || prev.activity,
        goal: profile.primary_goal || prev.goal,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const handleCalculateMacros = () => {
    const weightKg = Number(macroCalc.weightKg);
    const heightCm = Number(macroCalc.heightCm);
    const age = Number(macroCalc.age);
    if (!weightKg || !heightCm || !age) {
      setError('Enter weight, height, and age to calculate macros.');
      return;
    }
    setError('');

    const suggestion = suggestMacros({
      weightKg,
      heightCm,
      age,
      sex: macroCalc.sex,
      activity: macroCalc.activity,
      goal: macroCalc.goal,
    });

    setTargetsForm({
      daily_calories: suggestion.daily_calories.toString(),
      protein_grams: suggestion.protein_grams.toString(),
      carbs_grams: suggestion.carbs_grams.toString(),
      fat_grams: suggestion.fat_grams.toString(),
    });
    setSuccess('Macro targets calculated — review and save below.');
  };

  const handleSaveTargets = async () => {
    if (!plan?.id) return;
    setSavingTargets(true);
    setError('');

    const updated = await nutritionPlansApi.updateNutritionPlan({
      ...plan,
      daily_calories: targetsForm.daily_calories ? Number(targetsForm.daily_calories) : undefined,
      protein_grams: targetsForm.protein_grams ? Number(targetsForm.protein_grams) : undefined,
      carbs_grams: targetsForm.carbs_grams ? Number(targetsForm.carbs_grams) : undefined,
      fat_grams: targetsForm.fat_grams ? Number(targetsForm.fat_grams) : undefined,
    });

    setSavingTargets(false);

    if (updated) {
      setPlan(updated);
      setShowMacroStep(false);
      setSuccess('Macro targets saved.');
    } else {
      setError('Failed to save macro targets. Please try again.');
    }
  };

  const handleChangePlanType = async (planType: PlanType) => {
    if (!plan?.id || plan.plan_type === planType) return;
    setSavingPlanType(true);
    const updated = await nutritionPlansApi.updateNutritionPlan({ ...plan, plan_type: planType });
    setSavingPlanType(false);
    if (updated) {
      setPlan(updated);
    } else {
      setError('Failed to change plan type. Please try again.');
    }
  };

  const dayPlanByDay = useMemo(() => {
    const map = new Map<number, MealPlan>();
    dayPlans.forEach((dp) => {
      if (dp.day_of_week) map.set(dp.day_of_week, dp);
    });
    return map;
  }, [dayPlans]);

  const mealsByDay = useMemo(() => {
    const grouped: Record<number, MealWithDay[]> = {};
    DAYS.forEach((day) => {
      grouped[day.value] = [];
    });
    meals.forEach((meal) => {
      if (!grouped[meal.day_of_week]) grouped[meal.day_of_week] = [];
      grouped[meal.day_of_week].push(meal);
    });
    return grouped;
  }, [meals]);

  const totalMeals = meals.length;
  const daysWithMeals = useMemo(
    () => DAYS.filter((day) => (mealsByDay[day.value]?.length || 0) > 0).length,
    [mealsByDay]
  );

  const weeklyAverageMacros = useMemo(() => {
    const dayTotals = DAYS.map((day) => sumMacros(mealsByDay[day.value] || []));
    const daysWithData = dayTotals.filter(
      (t) => t.calories > 0 || t.protein > 0 || t.carbs > 0 || t.fat > 0
    );
    if (daysWithData.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    return {
      calories: Math.round(
        dayTotals.reduce((sum, t) => sum + t.calories, 0) / daysWithData.length
      ),
      protein: Math.round(
        dayTotals.reduce((sum, t) => sum + t.protein, 0) / daysWithData.length
      ),
      carbs: Math.round(dayTotals.reduce((sum, t) => sum + t.carbs, 0) / daysWithData.length),
      fat: Math.round(dayTotals.reduce((sum, t) => sum + t.fat, 0) / daysWithData.length),
    };
  }, [mealsByDay]);

  const planTargets = useMemo(
    () => ({
      calories: plan?.daily_calories,
      protein: plan?.protein_grams,
      carbs: plan?.carbs_grams,
      fat: plan?.fat_grams,
    }),
    [plan]
  );

  const getMealForm = (day: number, mealType: string) => {
    const key = formKey(day, mealType);
    return mealForms[key] || { ...emptyMealForm, meal_type: mealType as Meal['meal_type'] };
  };

  const setMealFormForSlot = (
    day: number,
    mealType: string,
    updater: (prev: typeof emptyMealForm) => typeof emptyMealForm
  ) => {
    const key = formKey(day, mealType);
    setMealForms((prev) => ({
      ...prev,
      [key]: updater(prev[key] || { ...emptyMealForm, meal_type: mealType as Meal['meal_type'] }),
    }));
  };

  const filteredMeals = (day: number, mealType: string) => {
    const query = (mealSearch[formKey(day, mealType)] || '').trim().toLowerCase();
    const dayMeals = (mealsByDay[day] || []).filter((m) => (m.meal_type || 'snack') === mealType);
    if (!query) return dayMeals;
    return dayMeals.filter(
      (meal) =>
        meal.name.toLowerCase().includes(query) ||
        meal.recipe?.toLowerCase().includes(query) ||
        meal.notes?.toLowerCase().includes(query)
    );
  };

  const handleFoodSelect = (day: number, mealType: string, food: FoodSearchResult) => {
    setMealFormForSlot(day, mealType, (prev) => ({
      ...prev,
      name: food.name,
      calories: food.calories != null ? String(Math.round(food.calories)) : prev.calories,
      protein_grams:
        food.protein_grams != null ? String(Math.round(food.protein_grams)) : prev.protein_grams,
      carbs_grams:
        food.carbs_grams != null ? String(Math.round(food.carbs_grams)) : prev.carbs_grams,
      fat_grams: food.fat_grams != null ? String(Math.round(food.fat_grams)) : prev.fat_grams,
      recipe: food.serving_description
        ? `${food.brand ? `${food.brand} · ` : ''}${food.serving_description}`
        : prev.recipe,
    }));
    setSuccess(`Loaded macros for ${food.name}.`);
  };

  const handleAddMeal = async (day: number, mealType: string) => {
    if (!plan?.id) return;
    const key = formKey(day, mealType);
    const form = getMealForm(day, mealType);
    if (!form.name.trim()) return;

    setSavingMeal((prev) => ({ ...prev, [key]: true }));
    setError('');

    const result = await mealsApi.createMeal(plan.id, day, {
      name: form.name.trim(),
      meal_type: mealType as Meal['meal_type'],
      calories: form.calories ? Number(form.calories) : undefined,
      protein_grams: form.protein_grams ? Number(form.protein_grams) : undefined,
      carbs_grams: form.carbs_grams ? Number(form.carbs_grams) : undefined,
      fat_grams: form.fat_grams ? Number(form.fat_grams) : undefined,
      recipe: form.recipe.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });

    setSavingMeal((prev) => ({ ...prev, [key]: false }));

    if (result) {
      setMealForms((prev) => ({
        ...prev,
        [key]: { ...emptyMealForm, meal_type: mealType as Meal['meal_type'] },
      }));
      setSuccess(`Added ${form.name.trim()} to ${DAYS.find((d) => d.value === day)?.label}.`);
      await loadData();
    } else {
      setError('Failed to add meal. Please try again.');
    }
  };

  const handleUpdateMeal = async (meal: MealWithDay) => {
    if (!meal.id) return;
    await mealsApi.updateMeal(meal);
    await loadData();
  };

  const handleDeleteMeal = async (mealId: string | undefined) => {
    if (!mealId) return;
    if (!confirm('Delete this meal?')) return;
    const ok = await mealsApi.deleteMeal(mealId);
    if (ok) {
      setSuccess('Meal removed.');
      await loadData();
    }
  };

  const handleUpdateDayNotes = async (day: number, notes: string) => {
    if (!plan?.id) return;
    const existing = dayPlanByDay.get(day);

    if (existing?.id) {
      await mealsApi.updateMealPlan({ ...existing, notes: notes || undefined });
      setDayPlans((prev) =>
        prev.map((dp) => (dp.id === existing.id ? { ...dp, notes: notes || undefined } : dp))
      );
      return;
    }

    const mealPlanId = await mealsApi.ensureDayPlan(
      plan.id,
      day,
      DAYS.find((d) => d.value === day)?.label
    );
    if (!mealPlanId) return;

    const updated = await mealsApi.updateMealPlan({
      id: mealPlanId,
      nutrition_plan_id: plan.id,
      name: DAYS.find((d) => d.value === day)?.label || `Day ${day}`,
      day_of_week: day,
      notes: notes || undefined,
    });

    if (updated) {
      setDayPlans((prev) => [...prev.filter((dp) => dp.day_of_week !== day), updated]);
    }
  };

  if (!isTrainer) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Trainer access required.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={plan?.name || 'Meal Plan Builder'}
        description={
          plan?.plan_type === 'flexible'
            ? 'Macro targets only — no meals to build'
            : 'Build daily meals, search foods for macros, and track targets'
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {planId && plan?.plan_type !== 'flexible' && (
            <GenerateMealWeekButton
              nutritionPlanId={planId}
              onApplied={loadData}
              clientId={clientId || undefined}
              initialDietaryTags={[
                ...(clientProfile?.dietary_restrictions || []),
                ...(clientProfile?.allergies || []),
              ]}
            />
          )}
          <Link href={clientId ? `/trainer/clients/${clientId}` : '/trainer/meal-plans'}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {clientId ? 'Back to Client' : 'Back to Meal Plans'}
            </Button>
          </Link>
        </div>
      </DashboardPageHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      ) : !plan ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Template not found.</p>
            <Link href="/trainer/meal-plans">
              <Button>Back to Meal Plans</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {showMacroStep && (
            <Card className="border-primary/40">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-primary" />
                      Step 1 · Set Macro Targets
                    </CardTitle>
                    <CardDescription>
                      {clientProfile
                        ? `Prefilled from ${clientProfile.first_name || 'the client'}'s intake answers — adjust and save.`
                        : 'Calculate daily calorie and macro targets before building this plan.'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="calc_weight" className="text-xs">Weight (kg)</Label>
                    <Input
                      id="calc_weight"
                      type="number"
                      value={macroCalc.weightKg}
                      onChange={(e) => setMacroCalc((prev) => ({ ...prev, weightKg: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="calc_height" className="text-xs">Height (cm)</Label>
                    <Input
                      id="calc_height"
                      type="number"
                      value={macroCalc.heightCm}
                      onChange={(e) => setMacroCalc((prev) => ({ ...prev, heightCm: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="calc_age" className="text-xs">Age</Label>
                    <Input
                      id="calc_age"
                      type="number"
                      value={macroCalc.age}
                      onChange={(e) => setMacroCalc((prev) => ({ ...prev, age: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="calc_sex" className="text-xs">Sex</Label>
                    <Select
                      value={macroCalc.sex}
                      onValueChange={(value) => setMacroCalc((prev) => ({ ...prev, sex: value as MacroInput['sex'] }))}
                    >
                      <SelectTrigger id="calc_sex">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="calc_activity" className="text-xs">Activity</Label>
                    <Select
                      value={macroCalc.activity}
                      onValueChange={(value) =>
                        setMacroCalc((prev) => ({ ...prev, activity: value as MacroInput['activity'] }))
                      }
                    >
                      <SelectTrigger id="calc_activity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="very_active">Very active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="calc_goal" className="text-xs">Goal</Label>
                    <Select
                      value={macroCalc.goal}
                      onValueChange={(value) => setMacroCalc((prev) => ({ ...prev, goal: value as MacroInput['goal'] }))}
                    >
                      <SelectTrigger id="calc_goal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lose">Lose weight</SelectItem>
                        <SelectItem value="maintain">Maintain</SelectItem>
                        <SelectItem value="gain">Gain muscle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="button" variant="secondary" className="gap-2" onClick={handleCalculateMacros}>
                  <Calculator className="h-4 w-4" />
                  Calculate suggested targets
                </Button>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-1.5">
                    <Label htmlFor="target_calories" className="text-xs">Daily Calories</Label>
                    <Input
                      id="target_calories"
                      type="number"
                      value={targetsForm.daily_calories}
                      onChange={(e) => setTargetsForm((prev) => ({ ...prev, daily_calories: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="target_protein" className="text-xs">Protein (g)</Label>
                    <Input
                      id="target_protein"
                      type="number"
                      value={targetsForm.protein_grams}
                      onChange={(e) => setTargetsForm((prev) => ({ ...prev, protein_grams: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="target_carbs" className="text-xs">Carbs (g)</Label>
                    <Input
                      id="target_carbs"
                      type="number"
                      value={targetsForm.carbs_grams}
                      onChange={(e) => setTargetsForm((prev) => ({ ...prev, carbs_grams: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="target_fat" className="text-xs">Fat (g)</Label>
                    <Input
                      id="target_fat"
                      type="number"
                      value={targetsForm.fat_grams}
                      onChange={(e) => setTargetsForm((prev) => ({ ...prev, fat_grams: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowMacroStep(false)}
                    disabled={savingTargets}
                  >
                    Skip for now
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveTargets}
                    disabled={savingTargets || !targetsForm.daily_calories}
                  >
                    {savingTargets ? 'Saving...' : 'Save Targets & Continue'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Plan Overview
                  </CardTitle>
                  <CardDescription>
                    {plan.description ||
                      (plan.is_template
                        ? 'Reusable weekly nutrition template'
                        : 'Nutrition plan assigned to a client')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{plan.plan_type === 'flexible' ? 'Flexible' : 'Full plan'}</Badge>
                  <Badge variant="outline">{plan.is_template ? 'Template' : 'Client plan'}</Badge>
                </div>
              </div>

              {!plan.is_template && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/40 p-1 w-fit">
                  <button
                    type="button"
                    disabled={savingPlanType}
                    onClick={() => handleChangePlanType('full')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      (plan.plan_type || 'full') === 'full'
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    Full meal plan
                  </button>
                  <button
                    type="button"
                    disabled={savingPlanType}
                    onClick={() => handleChangePlanType('flexible')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      plan.plan_type === 'flexible'
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    Flexible dieting (macros only)
                  </button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Meals</p>
                  <p className="text-2xl font-bold">{totalMeals}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Days Configured</p>
                  <p className="text-2xl font-bold">
                    {daysWithMeals}
                    <span className="text-base font-normal text-muted-foreground"> / 7</span>
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Daily Calories</p>
                  <p className="text-2xl font-bold">
                    {weeklyAverageMacros.calories || '—'}
                    {weeklyAverageMacros.calories > 0 && (
                      <span className="text-base font-normal text-muted-foreground"> kcal</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Macro Target</p>
                  <p className="text-sm font-medium mt-1">
                    {plan.daily_calories ? `${plan.daily_calories} kcal` : 'No calorie target'}
                    {plan.protein_grams ? ` · P ${plan.protein_grams}g` : ''}
                    {plan.carbs_grams ? ` · C ${plan.carbs_grams}g` : ''}
                    {plan.fat_grams ? ` · F ${plan.fat_grams}g` : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {plan.plan_type === 'flexible' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Flexible Dieting
                </CardTitle>
                <CardDescription>
                  This client tracks their own meals against macro targets — no prescribed day-by-day
                  plan is needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set daily calorie and macro targets above (Step 1). Your client will see these
                  targets on their Meal Plan page and log their own food against them in the daily
                  diary — hit the numbers, eat what fits. Switch back to <strong>Full meal plan</strong>{' '}
                  above if you&apos;d rather prescribe specific meals.
                </p>
                {(plan.daily_calories || plan.protein_grams || plan.carbs_grams || plan.fat_grams) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg border p-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Calories</p>
                      <p className="text-xl font-bold">{plan.daily_calories || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Protein</p>
                      <p className="text-xl font-bold">{plan.protein_grams ? `${plan.protein_grams}g` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Carbs</p>
                      <p className="text-xl font-bold">{plan.carbs_grams ? `${plan.carbs_grams}g` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fat</p>
                      <p className="text-xl font-bold">{plan.fat_grams ? `${plan.fat_grams}g` : '—'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
          {!plan.is_template &&
            (plan.daily_calories || plan.protein_grams || plan.carbs_grams || plan.fat_grams) && (
              <MacroProgressBars
                title="Weekly Average vs Targets"
                subtitle="Average across days that have meals planned"
                totals={weeklyAverageMacros}
                targets={planTargets}
              />
            )}

          <Accordion
            type="multiple"
            value={openDays}
            onValueChange={setOpenDays}
            className="space-y-3"
          >
            {DAYS.map((day) => {
              const dayMeals = mealsByDay[day.value] || [];
              const dayTotals = sumMacros(dayMeals);
              const dayPlan = dayPlanByDay.get(day.value);

              return (
                <AccordionItem
                  key={day.value}
                  value={String(day.value)}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex flex-1 items-center justify-between gap-3 pr-4 text-left">
                      <div>
                        <p className="font-medium">{day.label}</p>
                        <p className="text-sm text-muted-foreground font-normal">
                          {dayMeals.length} meal{dayMeals.length !== 1 ? 's' : ''}
                          {dayTotals.calories > 0 ? ` · ${dayTotals.calories} kcal planned` : ''}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {day.short}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-5 pb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`day-notes-${day.value}`}>Day Notes (optional)</Label>
                      <Textarea
                        id={`day-notes-${day.value}`}
                        rows={2}
                        placeholder="e.g. Higher carbs on training days, meal prep Sunday"
                        defaultValue={dayPlan?.notes || ''}
                        onBlur={(e) => handleUpdateDayNotes(day.value, e.target.value)}
                      />
                    </div>

                    {dayMeals.length > 0 && (
                      <MacroProgressBars
                        title={`${day.label} Macros`}
                        subtitle="Planned totals for this day"
                        totals={dayTotals}
                        targets={planTargets}
                      />
                    )}

                    {MEAL_TYPES.map((mealType) => {
                      const key = formKey(day.value, mealType);
                      const form = getMealForm(day.value, mealType);
                      const typeMeals = filteredMeals(day.value, mealType);
                      const allTypeMeals = (mealsByDay[day.value] || []).filter(
                        (m) => (m.meal_type || 'snack') === mealType
                      );

                      return (
                        <div key={mealType} className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold">
                              {MEAL_TYPE_LABELS[mealType]}
                              {allTypeMeals.length > 0 && (
                                <span className="text-muted-foreground font-normal ml-2">
                                  ({allTypeMeals.length})
                                </span>
                              )}
                            </h4>
                            {allTypeMeals.length > 1 && (
                              <div className="relative w-40">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  className="pl-8 h-9"
                                  placeholder="Filter meals..."
                                  value={mealSearch[key] || ''}
                                  onChange={(e) =>
                                    setMealSearch((prev) => ({
                                      ...prev,
                                      [key]: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            )}
                          </div>

                          {typeMeals.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No {MEAL_TYPE_LABELS[mealType].toLowerCase()} items yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {typeMeals.map((meal) => (
                                <div key={meal.id} className="border rounded-lg p-3 space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 space-y-1">
                                      <Label className="text-xs">Name</Label>
                                      <Input
                                        defaultValue={meal.name}
                                        onBlur={(e) =>
                                          handleUpdateMeal({
                                            ...meal,
                                            name: e.target.value.trim() || meal.name,
                                          })
                                        }
                                      />
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="mt-5"
                                      onClick={() => handleDeleteMeal(meal.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Calories</Label>
                                      <Input
                                        type="number"
                                        defaultValue={meal.calories ?? ''}
                                        onBlur={(e) =>
                                          handleUpdateMeal({
                                            ...meal,
                                            calories: e.target.value
                                              ? Number(e.target.value)
                                              : undefined,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Protein (g)</Label>
                                      <Input
                                        type="number"
                                        defaultValue={meal.protein_grams ?? ''}
                                        onBlur={(e) =>
                                          handleUpdateMeal({
                                            ...meal,
                                            protein_grams: e.target.value
                                              ? Number(e.target.value)
                                              : undefined,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Carbs (g)</Label>
                                      <Input
                                        type="number"
                                        defaultValue={meal.carbs_grams ?? ''}
                                        onBlur={(e) =>
                                          handleUpdateMeal({
                                            ...meal,
                                            carbs_grams: e.target.value
                                              ? Number(e.target.value)
                                              : undefined,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Fat (g)</Label>
                                      <Input
                                        type="number"
                                        defaultValue={meal.fat_grams ?? ''}
                                        onBlur={(e) =>
                                          handleUpdateMeal({
                                            ...meal,
                                            fat_grams: e.target.value
                                              ? Number(e.target.value)
                                              : undefined,
                                          })
                                        }
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Recipe / Ingredients</Label>
                                      <Textarea
                                        rows={2}
                                        defaultValue={meal.recipe ?? ''}
                                        placeholder="Ingredients or prep notes"
                                        onBlur={(e) =>
                                          handleUpdateMeal({
                                            ...meal,
                                            recipe: e.target.value || undefined,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Notes</Label>
                                      <Textarea
                                        rows={2}
                                        defaultValue={meal.notes ?? ''}
                                        placeholder="Optional coaching notes"
                                        onBlur={(e) =>
                                          handleUpdateMeal({
                                            ...meal,
                                            notes: e.target.value || undefined,
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                            <p className="text-sm font-medium">
                              Add {MEAL_TYPE_LABELS[mealType]}
                            </p>
                            <FoodSearch
                              label="Search foods to auto-fill macros"
                              placeholder="Search foods (e.g. chicken, rice, avocado)..."
                              onSelect={(food) => handleFoodSelect(day.value, mealType, food)}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                  value={form.name}
                                  placeholder="e.g. Greek yogurt bowl"
                                  onChange={(e) =>
                                    setMealFormForSlot(day.value, mealType, (prev) => ({
                                      ...prev,
                                      name: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Meal Type</Label>
                                <Select
                                  value={form.meal_type}
                                  onValueChange={(value) =>
                                    setMealFormForSlot(day.value, mealType, (prev) => ({
                                      ...prev,
                                      meal_type: value as Meal['meal_type'],
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {MEAL_TYPES.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {MEAL_TYPE_LABELS[type]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="space-y-2">
                                <Label>Calories</Label>
                                <Input
                                  type="number"
                                  value={form.calories}
                                  onChange={(e) =>
                                    setMealFormForSlot(day.value, mealType, (prev) => ({
                                      ...prev,
                                      calories: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Protein (g)</Label>
                                <Input
                                  type="number"
                                  value={form.protein_grams}
                                  onChange={(e) =>
                                    setMealFormForSlot(day.value, mealType, (prev) => ({
                                      ...prev,
                                      protein_grams: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Carbs (g)</Label>
                                <Input
                                  type="number"
                                  value={form.carbs_grams}
                                  onChange={(e) =>
                                    setMealFormForSlot(day.value, mealType, (prev) => ({
                                      ...prev,
                                      carbs_grams: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Fat (g)</Label>
                                <Input
                                  type="number"
                                  value={form.fat_grams}
                                  onChange={(e) =>
                                    setMealFormForSlot(day.value, mealType, (prev) => ({
                                      ...prev,
                                      fat_grams: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Recipe / Ingredients</Label>
                                <Textarea
                                  rows={2}
                                  value={form.recipe}
                                  onChange={(e) =>
                                    setMealFormForSlot(day.value, mealType, (prev) => ({
                                      ...prev,
                                      recipe: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                  rows={2}
                                  value={form.notes}
                                  onChange={(e) =>
                                    setMealFormForSlot(day.value, mealType, (prev) => ({
                                      ...prev,
                                      notes: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            </div>
                            <Button
                              className="gap-2"
                              disabled={savingMeal[key] || !form.name.trim()}
                              onClick={() => handleAddMeal(day.value, mealType)}
                            >
                              <Plus className="h-4 w-4" />
                              {savingMeal[key] ? 'Adding...' : `Add ${MEAL_TYPE_LABELS[mealType]}`}
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {dayMeals.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 bg-muted/20 rounded-lg border border-dashed">
                        <Utensils className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No meals for {day.label} yet. Use the sections below to add breakfast,
                          lunch, dinner, and snacks.
                        </p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function TrainerMealPlanBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      }
    >
      <MealPlanBuilderContent />
    </Suspense>
  );
}
