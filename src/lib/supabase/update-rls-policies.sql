-- ============================================
-- UPDATE RLS POLICIES FOR TRAINER ACCESS
-- Run this AFTER trainer-platform-schema.sql
-- ============================================

-- This script updates RLS policies on existing tables to allow trainers
-- to access their clients' data

-- ============================================
-- WORKOUT PROGRAMS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own programs" ON workout_programs;
DROP POLICY IF EXISTS "Users can view their own workout programs" ON workout_programs;
DROP POLICY IF EXISTS "Users can insert their own programs" ON workout_programs;
DROP POLICY IF EXISTS "Users can insert their own workout programs" ON workout_programs;
DROP POLICY IF EXISTS "Users can update their own programs" ON workout_programs;
DROP POLICY IF EXISTS "Users can update their own workout programs" ON workout_programs;
DROP POLICY IF EXISTS "Users can delete their own programs" ON workout_programs;
DROP POLICY IF EXISTS "Users can delete their own workout programs" ON workout_programs;
DROP POLICY IF EXISTS "Trainers can view their clients' programs" ON workout_programs;
DROP POLICY IF EXISTS "Trainers can insert programs for clients" ON workout_programs;
DROP POLICY IF EXISTS "Trainers can update their clients' programs" ON workout_programs;

CREATE POLICY "Users can view their own programs"
ON workout_programs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients' programs"
ON workout_programs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = workout_programs.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can insert their own programs"
ON workout_programs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trainers can insert programs for clients"
ON workout_programs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = workout_programs.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can update their own programs"
ON workout_programs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can update their clients' programs"
ON workout_programs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = workout_programs.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can delete their own programs"
ON workout_programs FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- WORKOUT LOGS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own workout logs" ON workout_logs;
DROP POLICY IF EXISTS "Users can insert their own workout logs" ON workout_logs;
DROP POLICY IF EXISTS "Trainers can view their clients' workout logs" ON workout_logs;
DROP POLICY IF EXISTS "Trainers can create workout logs for clients" ON workout_logs;

CREATE POLICY "Users can view their own workout logs"
ON workout_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients' workout logs"
ON workout_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = workout_logs.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can insert their own workout logs"
ON workout_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trainers can create workout logs for clients"
ON workout_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = workout_logs.user_id
    AND tc.status = 'active'
  )
);

-- ============================================
-- NUTRITION PLANS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own nutrition plans" ON nutrition_plans;
DROP POLICY IF EXISTS "Users can insert their own nutrition plans" ON nutrition_plans;
DROP POLICY IF EXISTS "Trainers can view their clients' nutrition plans" ON nutrition_plans;
DROP POLICY IF EXISTS "Trainers can create nutrition plans for clients" ON nutrition_plans;

CREATE POLICY "Users can view their own nutrition plans"
ON nutrition_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients' nutrition plans"
ON nutrition_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = nutrition_plans.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can insert their own nutrition plans"
ON nutrition_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trainers can create nutrition plans for clients"
ON nutrition_plans FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = nutrition_plans.user_id
    AND tc.status = 'active'
  )
);

-- ============================================
-- MEALS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own meals" ON meals;
DROP POLICY IF EXISTS "Trainers can view their clients' meals" ON meals;

CREATE POLICY "Users can view their own meals"
ON meals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meal_plans mp
    JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
    WHERE mp.id = meals.meal_plan_id
    AND np.user_id = auth.uid()
  )
);

CREATE POLICY "Trainers can view their clients' meals"
ON meals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meal_plans mp
    JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
    JOIN trainer_clients tc ON tc.client_id = np.user_id
    WHERE mp.id = meals.meal_plan_id
    AND tc.trainer_id = auth.uid()
    AND tc.status = 'active'
  )
);

-- ============================================
-- PROGRESS TRACKING
-- ============================================
DROP POLICY IF EXISTS "Users can view their own progress" ON progress_tracking;
DROP POLICY IF EXISTS "Users can insert their own progress" ON progress_tracking;
DROP POLICY IF EXISTS "Trainers can view their clients' progress" ON progress_tracking;
DROP POLICY IF EXISTS "Trainers can insert progress for clients" ON progress_tracking;

CREATE POLICY "Users can view their own progress"
ON progress_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients' progress"
ON progress_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = progress_tracking.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can insert their own progress"
ON progress_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trainers can insert progress for clients"
ON progress_tracking FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = progress_tracking.user_id
    AND tc.status = 'active'
  )
);

-- ============================================
-- GOALS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
DROP POLICY IF EXISTS "Trainers can view their clients' goals" ON goals;
DROP POLICY IF EXISTS "Trainers can create goals for clients" ON goals;
DROP POLICY IF EXISTS "Trainers can update their clients' goals" ON goals;

CREATE POLICY "Users can view their own goals"
ON goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients' goals"
ON goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = goals.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can insert their own goals"
ON goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trainers can create goals for clients"
ON goals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = goals.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can update their own goals"
ON goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can update their clients' goals"
ON goals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = goals.user_id
    AND tc.status = 'active'
  )
);

-- ============================================
-- SLEEP TRACKING
-- ============================================
DROP POLICY IF EXISTS "Users can view their own sleep tracking" ON sleep_tracking;
DROP POLICY IF EXISTS "Users can insert their own sleep tracking" ON sleep_tracking;
DROP POLICY IF EXISTS "Trainers can view their clients' sleep tracking" ON sleep_tracking;

CREATE POLICY "Users can view their own sleep tracking"
ON sleep_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients' sleep tracking"
ON sleep_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = sleep_tracking.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can insert their own sleep tracking"
ON sleep_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CALENDAR EVENTS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Trainers can view their clients' calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Trainers can create calendar events for clients" ON calendar_events;

CREATE POLICY "Users can view their own calendar events"
ON calendar_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients' calendar events"
ON calendar_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = calendar_events.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can insert their own calendar events"
ON calendar_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trainers can create calendar events for clients"
ON calendar_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = calendar_events.user_id
    AND tc.status = 'active'
  )
);

-- ============================================
-- USER PROFILES
-- ============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Trainers can view their clients' profiles" ON user_profiles;

CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Trainers can view their clients' profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = user_profiles.id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);
