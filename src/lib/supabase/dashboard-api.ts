import { supabase } from '@/lib/supabase';

// User Profile Types
export type UserProfile = {
  id: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: string;
  height_cm?: number;
  created_at?: string;
  updated_at?: string;
};

// Workout Program Types
export type WorkoutProgram = {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  goal?: string;
  duration_weeks?: number;
  sessions_per_week?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type WorkoutSession = {
  id?: string;
  program_id: string;
  name: string;
  day_of_week?: number;
  week_number?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

export type Exercise = {
  id?: string;
  name: string;
  description?: string;
  muscle_group?: string;
  equipment?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  video_url?: string;
  created_at?: string;
};

export type WorkoutExercise = {
  id?: string;
  workout_session_id: string;
  exercise_id: string;
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  order_index?: number;
  notes?: string;
  created_at?: string;
};

// Workout Log Types
export type WorkoutLog = {
  id?: string;
  user_id: string;
  workout_session_id?: string;
  date: string;
  duration_minutes?: number;
  notes?: string;
  rating?: number;
  created_at?: string;
};

export type ExerciseLog = {
  id?: string;
  workout_log_id: string;
  exercise_id?: string;
  sets_completed?: number;
  reps_completed?: string;
  weight_used?: string;
  notes?: string;
  created_at?: string;
};

// Nutrition Types
export type NutritionPlan = {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  daily_calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type MealPlan = {
  id?: string;
  nutrition_plan_id: string;
  name: string;
  day_of_week?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

export type Meal = {
  id?: string;
  meal_plan_id: string;
  name: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  recipe?: string;
  notes?: string;
  created_at?: string;
};

// Progress Tracking Types
export type ProgressRecord = {
  id?: string;
  user_id: string;
  date: string;
  weight_kg?: number;
  body_fat_percentage?: number;
  waist_cm?: number;
  chest_cm?: number;
  arms_cm?: number;
  legs_cm?: number;
  notes?: string;
  photo_url?: string;
  created_at?: string;
};

// Goals Types
export type Goal = {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  category?: 'weight' | 'strength' | 'nutrition' | 'habits' | 'other';
  target_value?: number;
  current_value?: number;
  unit?: string;
  start_date?: string;
  target_date?: string;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
};

// Sleep Tracking Type
export type SleepRecord = {
  id?: string;
  user_id: string;
  date: string;
  sleep_duration_hours: number;
  sleep_quality?: number;
  time_to_bed?: string;
  time_woke_up?: string;
  deep_sleep_hours?: number;
  light_sleep_hours?: number;
  rem_sleep_hours?: number;
  sleep_disruptions?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

// User Profiles API
function profileFromAuthMetadata(
  userId: string,
  metadata: Record<string, unknown> | undefined
): UserProfile {
  const first =
    (metadata?.first_name as string | undefined) ||
    (metadata?.firstName as string | undefined) ||
    '';
  const last =
    (metadata?.last_name as string | undefined) ||
    (metadata?.lastName as string | undefined) ||
    '';

  return {
    id: userId,
    first_name: first,
    last_name: last,
    bio: 'A fitness enthusiast',
    height_cm: 170,
    created_at: new Date().toISOString(),
  };
}

async function ensureUserProfile(userId: string): Promise<UserProfile | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user || authData.user.id !== userId) {
    return null;
  }

  const user = authData.user;
  const metadata = user.user_metadata as Record<string, unknown> | undefined;

  const { data: inserted, error: insertError } = await supabase
    .from('user_profiles')
    .insert([
      {
        id: userId,
        first_name:
          (metadata?.first_name as string | undefined) ||
          (metadata?.firstName as string | undefined) ||
          '',
        last_name:
          (metadata?.last_name as string | undefined) ||
          (metadata?.lastName as string | undefined) ||
          '',
        bio: 'A fitness enthusiast',
        height_cm: 170,
      },
    ])
    .select('*')
    .maybeSingle();

  if (inserted) return inserted;

  if (insertError && insertError.code !== '23505') {
    console.warn('Could not create profile:', insertError.message ?? insertError.code);
  }

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return existing ?? profileFromAuthMetadata(userId, metadata);
}

export const userProfilesApi = {
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error?.message) {
      console.error('Error fetching user profile:', error.message);
    }

    if (data) return data;

    return ensureUserProfile(userId);
  },

  // Update a user's profile
  updateProfile: async (profile: UserProfile): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        height_cm: profile.height_cm,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  }
};

// Workout Programs API
export const workoutProgramsApi = {
  // Get all programs for a user
  getUserPrograms: async (userId: string): Promise<WorkoutProgram[]> => {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Handle Row Level Security (RLS) errors
    if (error && error.message?.includes('row-level security')) {
      console.warn('Row Level Security policy is preventing access to workout programs. Please check RLS policies in Supabase.');
      return [];
    }

    // Handle relation does not exist error
    if (error && (error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      console.warn('Table workout_programs does not exist yet. Please run the schema.sql file in Supabase SQL Editor.');
      return [];
    }

    if (error) {
      console.error('Error fetching workout programs:', error);
      return [];
    }

    return data || [];
  },

  // Get a single workout program
  getProgram: async (programId: string): Promise<WorkoutProgram | null> => {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (error) {
      console.error('Error fetching workout program:', error);
      return null;
    }

    return data;
  },

  // Create a new workout program
  createProgram: async (program: WorkoutProgram): Promise<WorkoutProgram | null> => {
    const { data, error } = await supabase
      .from('workout_programs')
      .insert([program])
      .select()
      .single();

    if (error) {
      console.error('Error creating workout program:', error);
      return null;
    }

    return data;
  },

  // Update a workout program
  updateProgram: async (program: WorkoutProgram): Promise<WorkoutProgram | null> => {
    const { id, ...programData } = program;

    const { data, error } = await supabase
      .from('workout_programs')
      .update({
        ...programData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workout program:', error);
      return null;
    }

    return data;
  },

  // Delete a workout program
  deleteProgram: async (programId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('workout_programs')
      .delete()
      .eq('id', programId);

    if (error) {
      console.error('Error deleting workout program:', error);
      return false;
    }

    return true;
  },

  // Get all sessions for a program
  getProgramSessions: async (programId: string): Promise<WorkoutSession[]> => {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Error fetching workout sessions:', error);
      return [];
    }

    return data || [];
  }
};

// Workout Sessions API
export const workoutSessionsApi = {
  // Create a new workout session
  createSession: async (session: WorkoutSession): Promise<WorkoutSession | null> => {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert([session])
      .select()
      .single();

    if (error) {
      console.error('Error creating workout session:', error);
      return null;
    }

    return data;
  },

  // Get a single workout session with exercises
  getSessionWithExercises: async (sessionId: string): Promise<{ session: WorkoutSession, exercises: WorkoutExercise[] } | null> => {
    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching workout session:', sessionError);
      return null;
    }

    // Get the exercises
    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_exercises')
      .select('*, exercises(*)')
      .eq('workout_session_id', sessionId)
      .order('order_index', { ascending: true });

    if (exercisesError) {
      console.error('Error fetching workout exercises:', exercisesError);
      return null;
    }

    return {
      session,
      exercises: exercises || []
    };
  }
};

// Workout Logs API
export const workoutLogsApi = {
  // Get recent workout logs for a user (used by both the client's own
  // workout page and the trainer's client-detail view — RLS on
  // `workout_logs` grants trainers read access to their active clients' logs)
  getUserLogs: async (userId: string, limit: number = 20): Promise<WorkoutLog[]> => {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error && (error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      console.warn('Table workout_logs does not exist yet. Please run the schema.sql file in Supabase SQL Editor.');
      return [];
    }

    if (error) {
      console.error('Error fetching workout logs:', error);
      return [];
    }

    return data || [];
  },

  createLog: async (log: WorkoutLog): Promise<WorkoutLog | null> => {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert([log])
      .select()
      .single();

    if (error) {
      console.error('Error creating workout log:', error);
      return null;
    }

    return data;
  },

  updateLog: async (log: WorkoutLog): Promise<WorkoutLog | null> => {
    const { id, ...logData } = log;

    const { data, error } = await supabase
      .from('workout_logs')
      .update(logData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workout log:', error);
      return null;
    }

    return data;
  },

  deleteLog: async (logId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.error('Error deleting workout log:', error);
      return false;
    }

    return true;
  }
};

// Exercise Library API (shared, read-only reference data)
export const exercisesApi = {
  getAll: async (): Promise<Exercise[]> => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('muscle_group', { ascending: true })
      .order('name', { ascending: true });

    if (error && (error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      console.warn('Table exercises does not exist yet. Please run the schema.sql file in Supabase SQL Editor.');
      return [];
    }

    if (error) {
      console.error('Error fetching exercises:', error);
      return [];
    }

    return data || [];
  }
};

// Exercise Logs API — the individual sets/reps/weight entries within a
// single workout log
export const exerciseLogsApi = {
  getLogsForWorkout: async (workoutLogId: string): Promise<ExerciseLog[]> => {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('workout_log_id', workoutLogId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching exercise logs:', error);
      return [];
    }

    return data || [];
  },

  createLog: async (log: ExerciseLog): Promise<ExerciseLog | null> => {
    const { data, error } = await supabase
      .from('exercise_logs')
      .insert([log])
      .select()
      .single();

    if (error) {
      console.error('Error creating exercise log:', error);
      return null;
    }

    return data;
  },

  deleteLog: async (logId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('exercise_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.error('Error deleting exercise log:', error);
      return false;
    }

    return true;
  }
};

// Progress Tracking API
export const progressTrackingApi = {
  // Get all progress records for a user
  getUserProgress: async (userId: string): Promise<ProgressRecord[]> => {
    const { data, error } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Handle Row Level Security (RLS) errors
    if (error && error.message?.includes('row-level security')) {
      console.warn('Row Level Security policy is preventing access to progress records. Please check RLS policies in Supabase.');
      return [];
    }

    // Handle relation does not exist error
    if (error && (error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      console.warn('Table progress_tracking does not exist yet. Please run the schema.sql file in Supabase SQL Editor.');
      return [];
    }

    if (error) {
      console.error('Error fetching progress records:', error);
      return [];
    }

    return data || [];
  },

  // Get a user's latest progress record
  getLatestProgress: async (userId: string): Promise<ProgressRecord | null> => {
    try {
      const { data, error } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      // Handle Row Level Security (RLS) errors
      if (error && error.message?.includes('row-level security')) {
        console.warn('Row Level Security policy is preventing access to progress records. Please check RLS policies in Supabase.');
        return null;
      }

      // Handle relation does not exist error
      if (error && (error.message?.includes('relation') || error.message?.includes('does not exist'))) {
        console.warn('Table progress_tracking does not exist yet. Please run the schema.sql file in Supabase SQL Editor.');
        return null;
      }

      if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
        console.error('Error fetching latest progress record:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Exception in getLatestProgress:', error);
      return null;
    }
  },

  // Create a new progress record
  createProgressRecord: async (record: ProgressRecord): Promise<ProgressRecord | null> => {
    const { data, error } = await supabase
      .from('progress_tracking')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error creating progress record:', error);
      return null;
    }

    return data;
  },

  // Update an existing progress record
  updateProgressRecord: async (record: ProgressRecord): Promise<ProgressRecord | null> => {
    const { id, ...recordData } = record;

    const { data, error } = await supabase
      .from('progress_tracking')
      .update(recordData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating progress record:', error);
      return null;
    }

    return data;
  },

  // Delete a progress record
  deleteProgressRecord: async (recordId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('progress_tracking')
      .delete()
      .eq('id', recordId);

    if (error) {
      console.error('Error deleting progress record:', error);
      return false;
    }

    return true;
  }
};

// Goals API
export const goalsApi = {
  // Get all goals for a user
  getUserGoals: async (userId: string): Promise<Goal[]> => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('is_completed', { ascending: true })
      .order('target_date', { ascending: true });

    // Handle Row Level Security (RLS) errors
    if (error && error.message?.includes('row-level security')) {
      console.warn('Row Level Security policy is preventing access to goals. Please check RLS policies in Supabase.');
      return [];
    }

    // Handle relation does not exist error
    if (error && (error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      console.warn('Table goals does not exist yet. Please run the schema.sql file in Supabase SQL Editor.');
      return [];
    }

    if (error) {
      console.error('Error fetching goals:', error);
      return [];
    }

    return data || [];
  },

  // Create a new goal
  createGoal: async (goal: Goal): Promise<Goal | null> => {
    const { data, error } = await supabase
      .from('goals')
      .insert([goal])
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      return null;
    }

    return data;
  },

  // Update a goal
  updateGoal: async (goal: Goal): Promise<Goal | null> => {
    const { id, ...goalData } = goal;

    const { data, error } = await supabase
      .from('goals')
      .update({
        ...goalData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating goal:', error);
      return null;
    }

    return data;
  },

  // Delete a goal
  deleteGoal: async (goalId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error('Error deleting goal:', error);
      return false;
    }

    return true;
  }
};

// Nutrition Plans API
export const nutritionPlansApi = {
  // Get all nutrition plans for a user
  getUserNutritionPlans: async (userId: string): Promise<NutritionPlan[]> => {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Handle Row Level Security (RLS) errors
    if (error && error.message?.includes('row-level security')) {
      console.warn('Row Level Security policy is preventing access to nutrition plans. Please check RLS policies in Supabase.');
      return [];
    }

    // Handle relation does not exist error
    if (error && (error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      console.warn('Table nutrition_plans does not exist yet. Please run the schema.sql file in Supabase SQL Editor.');
      return [];
    }

    if (error) {
      console.error('Error fetching nutrition plans:', error);
      return [];
    }

    return data || [];
  },

  // Get a user's active nutrition plan
  getActiveNutritionPlan: async (userId: string): Promise<NutritionPlan | null> => {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active nutrition plan:', error);
      return null;
    }

    return data || null;
  },

  // Create a new nutrition plan
  createNutritionPlan: async (plan: NutritionPlan): Promise<NutritionPlan | null> => {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .insert([plan])
      .select()
      .single();

    if (error) {
      console.error('Error creating nutrition plan:', error);
      return null;
    }

    return data;
  },

  updateNutritionPlan: async (plan: NutritionPlan): Promise<NutritionPlan | null> => {
    const { id, ...planData } = plan;

    const { data, error } = await supabase
      .from('nutrition_plans')
      .update({ ...planData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating nutrition plan:', error);
      return null;
    }

    return data;
  },

  deleteNutritionPlan: async (planId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('nutrition_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('Error deleting nutrition plan:', error);
      return false;
    }

    return true;
  }
};

// Meals API — meals belong to a `meal_plans` row (one per nutrition plan +
// day of week), but the UI only ever thinks in terms of "log a meal for
// Tuesday" — these helpers hide that indirection.
export const mealsApi = {
  // Get every meal across all of a nutrition plan's days, with the day of
  // week attached so the UI can group them.
  getMealsForNutritionPlan: async (nutritionPlanId: string): Promise<(Meal & { day_of_week: number; meal_plan_id: string })[]> => {
    const { data: plans, error: plansError } = await supabase
      .from('meal_plans')
      .select('id, day_of_week')
      .eq('nutrition_plan_id', nutritionPlanId);

    if (plansError) {
      console.error('Error fetching meal plans:', plansError);
      return [];
    }

    if (!plans || plans.length === 0) return [];

    const planIds = plans.map(p => p.id);
    const dayByPlanId = new Map(plans.map(p => [p.id, p.day_of_week]));

    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .in('meal_plan_id', planIds)
      .order('created_at', { ascending: true });

    if (mealsError) {
      console.error('Error fetching meals:', mealsError);
      return [];
    }

    return (meals || []).map(meal => ({
      ...meal,
      day_of_week: dayByPlanId.get(meal.meal_plan_id) ?? 0,
    }));
  },

  // Ensure a meal_plans row exists for (nutritionPlanId, dayOfWeek), then
  // insert the meal into it.
  createMeal: async (
    nutritionPlanId: string,
    dayOfWeek: number,
    meal: Omit<Meal, 'id' | 'meal_plan_id' | 'created_at'>
  ): Promise<Meal | null> => {
    const { data: existingPlan } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('nutrition_plan_id', nutritionPlanId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    let mealPlanId = existingPlan?.id;

    if (!mealPlanId) {
      const { data: createdPlan, error: createPlanError } = await supabase
        .from('meal_plans')
        .insert([{
          nutrition_plan_id: nutritionPlanId,
          day_of_week: dayOfWeek,
          name: `Day ${dayOfWeek}`,
        }])
        .select('id')
        .single();

      if (createPlanError || !createdPlan) {
        console.error('Error creating meal plan for day:', createPlanError);
        return null;
      }

      mealPlanId = createdPlan.id;
    }

    const { data, error } = await supabase
      .from('meals')
      .insert([{ ...meal, meal_plan_id: mealPlanId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating meal:', error);
      return null;
    }

    return data;
  },

  updateMeal: async (meal: Meal): Promise<Meal | null> => {
    const { id, ...mealData } = meal;

    const { data, error } = await supabase
      .from('meals')
      .update(mealData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating meal:', error);
      return null;
    }

    return data;
  },

  deleteMeal: async (mealId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (error) {
      console.error('Error deleting meal:', error);
      return false;
    }

    return true;
  }
};

// Sleep Tracking API
export const sleepTrackingApi = {
  // Get all sleep records for a user
  getUserSleepRecords: async (userId: string): Promise<SleepRecord[]> => {
    const { data, error } = await supabase
      .from('sleep_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Handle Row Level Security (RLS) errors
    if (error && error.message?.includes('row-level security')) {
      console.warn('Row Level Security policy is preventing access to sleep records. Please check RLS policies in Supabase.');
      return [];
    }

    // Handle relation does not exist error
    if (error && (error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      console.warn('Table sleep_tracking does not exist yet. Please run the schema.sql file in Supabase SQL Editor.');
      return [];
    }

    if (error) {
      console.error('Error fetching sleep records:', error);
      return [];
    }

    return data || [];
  },

  // Get sleep records within a date range
  getSleepRecordsInRange: async (userId: string, startDate: string, endDate: string): Promise<SleepRecord[]> => {
    const { data, error } = await supabase
      .from('sleep_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching sleep records in range:', error);
      return [];
    }

    return data || [];
  },

  // Get a specific sleep record by id
  getSleepRecord: async (recordId: string): Promise<SleepRecord | null> => {
    const { data, error } = await supabase
      .from('sleep_tracking')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error) {
      console.error('Error fetching sleep record:', error);
      return null;
    }

    return data;
  },

  // Get the latest sleep record
  getLatestSleepRecord: async (userId: string): Promise<SleepRecord | null> => {
    const { data, error } = await supabase
      .from('sleep_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching latest sleep record:', error);
      return null;
    }

    return data || null;
  },

  // Create a new sleep record
  createSleepRecord: async (record: SleepRecord): Promise<SleepRecord | null> => {
    const { data, error } = await supabase
      .from('sleep_tracking')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error creating sleep record:', error);
      return null;
    }

    return data;
  },

  // Update a sleep record
  updateSleepRecord: async (record: SleepRecord): Promise<SleepRecord | null> => {
    const { id, ...recordData } = record;

    if (!id) {
      console.error('Sleep record ID is required for update');
      return null;
    }

    const { data, error } = await supabase
      .from('sleep_tracking')
      .update({
        ...recordData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sleep record:', error);
      return null;
    }

    return data;
  },

  // Delete a sleep record
  deleteSleepRecord: async (recordId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('sleep_tracking')
      .delete()
      .eq('id', recordId);

    if (error) {
      console.error('Error deleting sleep record:', error);
      return false;
    }

    return true;
  }
}; 