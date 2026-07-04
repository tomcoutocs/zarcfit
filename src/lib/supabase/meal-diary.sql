-- ============================================
-- DAILY FOOD DIARY
-- Run AFTER workout-nutrition-rls.sql
-- ============================================

CREATE TABLE IF NOT EXISTS food_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL,
  serving_description TEXT,
  calories NUMERIC,
  protein_grams NUMERIC,
  carbs_grams NUMERIC,
  fat_grams NUMERIC,
  fatsecret_food_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_diary_user_date
  ON food_diary_entries(user_id, logged_date DESC);

ALTER TABLE food_diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own food diary"
ON food_diary_entries FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Trainers read client food diary"
ON food_diary_entries FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
      AND tc.client_id = food_diary_entries.user_id
      AND tc.status = 'active'
  )
);
