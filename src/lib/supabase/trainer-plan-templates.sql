-- Trainer-owned workout and meal plan templates that can be applied to clients.

ALTER TABLE workout_programs
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE workout_programs
  ADD COLUMN IF NOT EXISTS created_by_trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE nutrition_plans
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE nutrition_plans
  ADD COLUMN IF NOT EXISTS created_by_trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workout_programs_templates
  ON workout_programs(created_by_trainer_id, is_template)
  WHERE is_template = TRUE;

CREATE INDEX IF NOT EXISTS idx_nutrition_plans_templates
  ON nutrition_plans(created_by_trainer_id, is_template)
  WHERE is_template = TRUE;

-- Trainers can fully manage meal plans and meals for their clients.
DROP POLICY IF EXISTS "Trainers can manage their clients' meal plans" ON meal_plans;
CREATE POLICY "Trainers can manage their clients' meal plans"
ON meal_plans FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM nutrition_plans np
    JOIN trainer_clients tc ON tc.client_id = np.user_id
    WHERE np.id = meal_plans.nutrition_plan_id
      AND tc.trainer_id = auth.uid()
      AND tc.status = 'active'
      AND NOT user_has_trainer_role(np.user_id)
      AND COALESCE(np.is_template, FALSE) = FALSE
  )
  OR EXISTS (
    SELECT 1
    FROM nutrition_plans np
    WHERE np.id = meal_plans.nutrition_plan_id
      AND np.user_id = auth.uid()
      AND COALESCE(np.is_template, FALSE) = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM nutrition_plans np
    JOIN trainer_clients tc ON tc.client_id = np.user_id
    WHERE np.id = meal_plans.nutrition_plan_id
      AND tc.trainer_id = auth.uid()
      AND tc.status = 'active'
      AND NOT user_has_trainer_role(np.user_id)
      AND COALESCE(np.is_template, FALSE) = FALSE
  )
  OR EXISTS (
    SELECT 1
    FROM nutrition_plans np
    WHERE np.id = meal_plans.nutrition_plan_id
      AND np.user_id = auth.uid()
      AND COALESCE(np.is_template, FALSE) = TRUE
  )
);

DROP POLICY IF EXISTS "Trainers can manage their clients' meals" ON meals;
CREATE POLICY "Trainers can manage their clients' meals"
ON meals FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM meal_plans mp
    JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
    JOIN trainer_clients tc ON tc.client_id = np.user_id
    WHERE mp.id = meals.meal_plan_id
      AND tc.trainer_id = auth.uid()
      AND tc.status = 'active'
      AND NOT user_has_trainer_role(np.user_id)
      AND COALESCE(np.is_template, FALSE) = FALSE
  )
  OR EXISTS (
    SELECT 1
    FROM meal_plans mp
    JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
    WHERE mp.id = meals.meal_plan_id
      AND np.user_id = auth.uid()
      AND COALESCE(np.is_template, FALSE) = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM meal_plans mp
    JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
    JOIN trainer_clients tc ON tc.client_id = np.user_id
    WHERE mp.id = meals.meal_plan_id
      AND tc.trainer_id = auth.uid()
      AND tc.status = 'active'
      AND NOT user_has_trainer_role(np.user_id)
      AND COALESCE(np.is_template, FALSE) = FALSE
  )
  OR EXISTS (
    SELECT 1
    FROM meal_plans mp
    JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
    WHERE mp.id = meals.meal_plan_id
      AND np.user_id = auth.uid()
      AND COALESCE(np.is_template, FALSE) = TRUE
  )
);

DROP POLICY IF EXISTS "Trainers can update their clients' nutrition plans" ON nutrition_plans;
CREATE POLICY "Trainers can update their clients' nutrition plans"
ON nutrition_plans FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
      AND tc.client_id = nutrition_plans.user_id
      AND tc.status = 'active'
      AND NOT user_has_trainer_role(nutrition_plans.user_id)
      AND COALESCE(nutrition_plans.is_template, FALSE) = FALSE
  )
  OR (
    nutrition_plans.user_id = auth.uid()
    AND COALESCE(nutrition_plans.is_template, FALSE) = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
      AND tc.client_id = nutrition_plans.user_id
      AND tc.status = 'active'
      AND NOT user_has_trainer_role(nutrition_plans.user_id)
      AND COALESCE(nutrition_plans.is_template, FALSE) = FALSE
  )
  OR (
    nutrition_plans.user_id = auth.uid()
    AND COALESCE(nutrition_plans.is_template, FALSE) = TRUE
  )
);

DROP POLICY IF EXISTS "Trainers can delete their clients' nutrition plans" ON nutrition_plans;
CREATE POLICY "Trainers can delete their clients' nutrition plans"
ON nutrition_plans FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
      AND tc.client_id = nutrition_plans.user_id
      AND tc.status = 'active'
      AND NOT user_has_trainer_role(nutrition_plans.user_id)
      AND COALESCE(nutrition_plans.is_template, FALSE) = FALSE
  )
  OR (
    nutrition_plans.user_id = auth.uid()
    AND COALESCE(nutrition_plans.is_template, FALSE) = TRUE
  )
);

-- ============================================
-- Apply a workout template to a client (deep copy)
-- ============================================
CREATE OR REPLACE FUNCTION copy_workout_program_to_client(
  p_source_program_id UUID,
  p_client_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trainer_id UUID := auth.uid();
  v_source workout_programs%ROWTYPE;
  v_new_program_id UUID;
  v_session RECORD;
  v_new_session_id UUID;
  v_exercise RECORD;
BEGIN
  IF v_trainer_id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_authenticated');
  END IF;

  IF NOT user_has_trainer_role(v_trainer_id) THEN
    RETURN jsonb_build_object('status', 'not_a_trainer');
  END IF;

  SELECT * INTO v_source
  FROM workout_programs
  WHERE id = p_source_program_id;

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

  INSERT INTO workout_programs (
    user_id,
    name,
    description,
    difficulty,
    goal,
    duration_weeks,
    sessions_per_week,
    is_active,
    is_template,
    created_by_trainer_id
  )
  VALUES (
    p_client_id,
    v_source.name,
    v_source.description,
    v_source.difficulty,
    v_source.goal,
    v_source.duration_weeks,
    v_source.sessions_per_week,
    TRUE,
    FALSE,
    v_trainer_id
  )
  RETURNING id INTO v_new_program_id;

  FOR v_session IN
    SELECT *
    FROM workout_sessions
    WHERE program_id = p_source_program_id
    ORDER BY week_number NULLS LAST, day_of_week NULLS LAST, created_at
  LOOP
    INSERT INTO workout_sessions (
      program_id,
      name,
      day_of_week,
      week_number,
      notes
    )
    VALUES (
      v_new_program_id,
      v_session.name,
      v_session.day_of_week,
      v_session.week_number,
      v_session.notes
    )
    RETURNING id INTO v_new_session_id;

    FOR v_exercise IN
      SELECT *
      FROM workout_exercises
      WHERE workout_session_id = v_session.id
      ORDER BY order_index NULLS LAST, created_at
    LOOP
      INSERT INTO workout_exercises (
        workout_session_id,
        exercise_id,
        sets,
        reps,
        rest_seconds,
        order_index,
        notes
      )
      VALUES (
        v_new_session_id,
        v_exercise.exercise_id,
        v_exercise.sets,
        v_exercise.reps,
        v_exercise.rest_seconds,
        v_exercise.order_index,
        v_exercise.notes
      );
    END LOOP;
  END LOOP;

  INSERT INTO program_assignments (
    program_id,
    client_id,
    assigned_by,
    status
  )
  VALUES (
    v_new_program_id,
    p_client_id,
    v_trainer_id,
    'active'
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'program_id', v_new_program_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION copy_workout_program_to_client(UUID, UUID) TO authenticated;

-- ============================================
-- Apply a meal plan template to a client (deep copy)
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
