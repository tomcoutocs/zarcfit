-- ============================================
-- WORKOUT & NUTRITION RLS FIXES
-- Run this AFTER schema.sql, trainer-platform-schema.sql, and
-- update-rls-policies.sql
-- ============================================
--
-- Auditing the existing policies while building out Workout Tracking and
-- Meal Planning turned up several tables that were either missing RLS
-- entirely (open to any authenticated/anon request) or had RLS enabled
-- with zero policies (blocking ALL access, including the owner). Both are
-- bugs. This file makes every one of these tables behave like the rest of
-- the app: the owning user has full CRUD, their trainer (if any, while the
-- relationship is active) can view, and nobody else can touch the row.

-- ============================================
-- EXERCISES (shared reference library)
-- ============================================
-- This table was not RLS-enabled at all, meaning anyone with the anon/
-- authenticated API key could insert, update, or delete library exercises.
-- It's reference data seeded by us, not user data, so we make it read-only
-- from the client — no INSERT/UPDATE/DELETE policy is added on purpose.
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view exercises" ON exercises;
CREATE POLICY "Anyone can view exercises"
ON exercises FOR SELECT
USING (true);

-- ============================================
-- WORKOUT LOGS — owner UPDATE/DELETE was missing
-- ============================================
DROP POLICY IF EXISTS "Users can update their own workout logs" ON workout_logs;
CREATE POLICY "Users can update their own workout logs"
ON workout_logs FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workout logs" ON workout_logs;
CREATE POLICY "Users can delete their own workout logs"
ON workout_logs FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- EXERCISE LOGS — had RLS enabled but zero policies (fully blocked)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own exercise logs" ON exercise_logs;
CREATE POLICY "Users can view their own exercise logs"
ON exercise_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_logs wl
    WHERE wl.id = exercise_logs.workout_log_id
    AND wl.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Trainers can view their clients' exercise logs" ON exercise_logs;
CREATE POLICY "Trainers can view their clients' exercise logs"
ON exercise_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_logs wl
    JOIN trainer_clients tc ON tc.client_id = wl.user_id
    WHERE wl.id = exercise_logs.workout_log_id
    AND tc.trainer_id = auth.uid()
    AND tc.status = 'active'
  )
);

DROP POLICY IF EXISTS "Users can insert their own exercise logs" ON exercise_logs;
CREATE POLICY "Users can insert their own exercise logs"
ON exercise_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_logs wl
    WHERE wl.id = exercise_logs.workout_log_id
    AND wl.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own exercise logs" ON exercise_logs;
CREATE POLICY "Users can update their own exercise logs"
ON exercise_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workout_logs wl
    WHERE wl.id = exercise_logs.workout_log_id
    AND wl.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own exercise logs" ON exercise_logs;
CREATE POLICY "Users can delete their own exercise logs"
ON exercise_logs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workout_logs wl
    WHERE wl.id = exercise_logs.workout_log_id
    AND wl.user_id = auth.uid()
  )
);

-- ============================================
-- WORKOUT SESSIONS / WORKOUT EXERCISES — not RLS-enabled at all
-- ============================================
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage sessions in their own programs" ON workout_sessions;
CREATE POLICY "Users can manage sessions in their own programs"
ON workout_sessions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workout_programs wp
    WHERE wp.id = workout_sessions.program_id
    AND wp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Trainers can manage sessions in their clients' programs" ON workout_sessions;
CREATE POLICY "Trainers can manage sessions in their clients' programs"
ON workout_sessions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workout_programs wp
    JOIN trainer_clients tc ON tc.client_id = wp.user_id
    WHERE wp.id = workout_sessions.program_id
    AND tc.trainer_id = auth.uid()
    AND tc.status = 'active'
  )
);

DROP POLICY IF EXISTS "Users can manage exercises in their own sessions" ON workout_exercises;
CREATE POLICY "Users can manage exercises in their own sessions"
ON workout_exercises FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    JOIN workout_programs wp ON wp.id = ws.program_id
    WHERE ws.id = workout_exercises.workout_session_id
    AND wp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Trainers can manage exercises in their clients' sessions" ON workout_exercises;
CREATE POLICY "Trainers can manage exercises in their clients' sessions"
ON workout_exercises FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    JOIN workout_programs wp ON wp.id = ws.program_id
    JOIN trainer_clients tc ON tc.client_id = wp.user_id
    WHERE ws.id = workout_exercises.workout_session_id
    AND tc.trainer_id = auth.uid()
    AND tc.status = 'active'
  )
);

-- ============================================
-- NUTRITION PLANS — owner UPDATE/DELETE was missing
-- ============================================
DROP POLICY IF EXISTS "Users can update their own nutrition plans" ON nutrition_plans;
CREATE POLICY "Users can update their own nutrition plans"
ON nutrition_plans FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own nutrition plans" ON nutrition_plans;
CREATE POLICY "Users can delete their own nutrition plans"
ON nutrition_plans FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- MEAL PLANS (per-day grouping) — not RLS-enabled at all
-- ============================================
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage meal plans for their own nutrition plans" ON meal_plans;
CREATE POLICY "Users can manage meal plans for their own nutrition plans"
ON meal_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM nutrition_plans np
    WHERE np.id = meal_plans.nutrition_plan_id
    AND np.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Trainers can view their clients' meal plans" ON meal_plans;
CREATE POLICY "Trainers can view their clients' meal plans"
ON meal_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM nutrition_plans np
    JOIN trainer_clients tc ON tc.client_id = np.user_id
    WHERE np.id = meal_plans.nutrition_plan_id
    AND tc.trainer_id = auth.uid()
    AND tc.status = 'active'
  )
);

-- ============================================
-- MEALS — SELECT existed, but INSERT/UPDATE/DELETE for the owner did not
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own meals" ON meals;
CREATE POLICY "Users can insert their own meals"
ON meals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM meal_plans mp
    JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
    WHERE mp.id = meals.meal_plan_id
    AND np.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own meals" ON meals;
CREATE POLICY "Users can update their own meals"
ON meals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM meal_plans mp
    JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
    WHERE mp.id = meals.meal_plan_id
    AND np.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own meals" ON meals;
CREATE POLICY "Users can delete their own meals"
ON meals FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM meal_plans mp
    JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
    WHERE mp.id = meals.meal_plan_id
    AND np.user_id = auth.uid()
  )
);
