-- Phase E: client-first nutrition intake.
-- Adds the fields the macro calculator needs (weight, activity, goal,
-- dietary restrictions, allergies) plus a plan_type distinction between a
-- full day-by-day meal plan and a "flexible dieting" (macros only) plan.
--
-- Safe to re-run — every change is guarded with IF NOT EXISTS.

-- ============================================
-- user_profiles: client intake fields
-- ============================================
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS activity_level TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_activity_level_check'
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_activity_level_check
      CHECK (activity_level IS NULL OR activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));
  END IF;
END $$;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS primary_goal TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_primary_goal_check'
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_primary_goal_check
      CHECK (primary_goal IS NULL OR primary_goal IN ('lose', 'maintain', 'gain'));
  END IF;
END $$;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[];

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS allergies TEXT[];

-- ============================================
-- nutrition_plans: full vs. flexible (macros-only) plans
-- ============================================
ALTER TABLE nutrition_plans
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'full';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'nutrition_plans_plan_type_check'
  ) THEN
    ALTER TABLE nutrition_plans
      ADD CONSTRAINT nutrition_plans_plan_type_check
      CHECK (plan_type IN ('full', 'flexible'));
  END IF;
END $$;

-- ============================================
-- Carry plan_type across when a template is applied to a client
-- (copy_nutrition_plan_to_client already exists in schema.sql — this just
-- adds the new column to its INSERT list).
-- ============================================
CREATE OR REPLACE FUNCTION copy_nutrition_plan_to_client(
  p_source_plan_id UUID,
  p_client_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trainer_id UUID := auth.uid();
  v_source nutrition_plans%ROWTYPE;
  v_new_plan_id UUID;
  v_meal_plan RECORD;
  v_new_meal_plan_id UUID;
  v_meal RECORD;
BEGIN
  IF v_trainer_id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_authenticated');
  END IF;

  IF NOT user_has_trainer_role(v_trainer_id) THEN
    RETURN jsonb_build_object('status', 'not_a_trainer');
  END IF;

  SELECT * INTO v_source
  FROM nutrition_plans
  WHERE id = p_source_plan_id;

  IF v_source.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  IF NOT (
    (COALESCE(v_source.is_template, FALSE) = TRUE AND v_source.user_id = v_trainer_id)
    OR EXISTS (
      SELECT 1
      FROM trainer_clients tc
      WHERE tc.trainer_id = v_trainer_id
        AND tc.client_id = v_source.user_id
        AND tc.status = 'active'
    )
  ) THEN
    RETURN jsonb_build_object('status', 'forbidden');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM trainer_clients tc
    WHERE tc.trainer_id = v_trainer_id
      AND tc.client_id = p_client_id
      AND tc.status = 'active'
      AND NOT user_has_trainer_role(p_client_id)
  ) THEN
    RETURN jsonb_build_object('status', 'not_your_client');
  END IF;

  UPDATE nutrition_plans
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE user_id = p_client_id
    AND COALESCE(is_template, FALSE) = FALSE
    AND is_active = TRUE;

  INSERT INTO nutrition_plans (
    user_id,
    name,
    description,
    daily_calories,
    protein_grams,
    carbs_grams,
    fat_grams,
    plan_type,
    is_active,
    is_template,
    created_by_trainer_id
  )
  VALUES (
    p_client_id,
    v_source.name,
    v_source.description,
    v_source.daily_calories,
    v_source.protein_grams,
    v_source.carbs_grams,
    v_source.fat_grams,
    COALESCE(v_source.plan_type, 'full'),
    TRUE,
    FALSE,
    v_trainer_id
  )
  RETURNING id INTO v_new_plan_id;

  FOR v_meal_plan IN
    SELECT *
    FROM meal_plans
    WHERE nutrition_plan_id = p_source_plan_id
    ORDER BY day_of_week NULLS LAST, created_at
  LOOP
    INSERT INTO meal_plans (
      nutrition_plan_id,
      name,
      day_of_week,
      notes
    )
    VALUES (
      v_new_plan_id,
      v_meal_plan.name,
      v_meal_plan.day_of_week,
      v_meal_plan.notes
    )
    RETURNING id INTO v_new_meal_plan_id;

    FOR v_meal IN
      SELECT *
      FROM meals
      WHERE meal_plan_id = v_meal_plan.id
      ORDER BY created_at
    LOOP
      INSERT INTO meals (
        meal_plan_id,
        name,
        meal_type,
        calories,
        protein_grams,
        carbs_grams,
        fat_grams,
        recipe,
        notes
      )
      VALUES (
        v_new_meal_plan_id,
        v_meal.name,
        v_meal.meal_type,
        v_meal.calories,
        v_meal.protein_grams,
        v_meal.carbs_grams,
        v_meal.fat_grams,
        v_meal.recipe,
        v_meal.notes
      );
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'success',
    'plan_id', v_new_plan_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION copy_nutrition_plan_to_client(UUID, UUID) TO authenticated;

-- ============================================
-- RLS: trainers can edit (not just view) their active clients' intake
-- answers, so they can correct bad self-reported data (PF-223).
-- ============================================
DROP POLICY IF EXISTS "Trainers can update their clients' profiles" ON user_profiles;
CREATE POLICY "Trainers can update their clients' profiles"
ON user_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = user_profiles.id
    AND tc.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = user_profiles.id
    AND tc.status = 'active'
  )
);
