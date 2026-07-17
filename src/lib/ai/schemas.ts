import { z } from 'zod';

export const workoutDraftExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  sets: z.number().int().min(1).max(10),
  reps: z.string().min(1).max(20),
  rest_seconds: z.number().int().min(0).max(600),
  notes: z.string().max(500).optional(),
});

export const workoutDraftSessionSchema = z.object({
  name: z.string().min(1).max(120),
  day_of_week: z.number().int().min(1).max(7),
  week_number: z.number().int().min(1).max(52),
  notes: z.string().max(500).optional(),
  exercises: z.array(workoutDraftExerciseSchema).min(1),
});

export const workoutDraftSchema = z.object({
  sessions: z.array(workoutDraftSessionSchema).min(1),
  summary: z.string().max(500).optional(),
});

export type WorkoutDraft = z.infer<typeof workoutDraftSchema>;

export const mealDraftItemSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  name: z.string().min(1).max(200),
  calories: z.number().min(0),
  protein_grams: z.number().min(0),
  carbs_grams: z.number().min(0),
  fat_grams: z.number().min(0),
  notes: z.string().max(500).optional(),
});

export const mealDraftDaySchema = z.object({
  day_of_week: z.number().int().min(1).max(7),
  meals: z.array(mealDraftItemSchema).min(1),
});

export const mealDraftSchema = z.object({
  days: z.array(mealDraftDaySchema).min(1).max(7),
  summary: z.string().max(500).optional(),
});

export type MealDraft = z.infer<typeof mealDraftSchema>;

export const workoutDraftRequestSchema = z.object({
  program_id: z.string().uuid(),
  goal: z.string().min(1).max(200),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  sessions_per_week: z.number().int().min(1).max(7),
  duration_weeks: z.number().int().min(1).max(12),
  equipment: z.enum(['gym', 'home', 'any']).default('any'),
  client_id: z.string().uuid().optional(),
});

export const mealDraftRequestSchema = z.object({
  nutrition_plan_id: z.string().uuid(),
  dietary_tags: z.array(z.string()).max(8).optional(),
  client_id: z.string().uuid().optional(),
  use_ai: z.boolean().optional(),
});
