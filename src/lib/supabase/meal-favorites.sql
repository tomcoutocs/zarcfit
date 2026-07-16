-- Meal favorites library (ZF-607)
-- Safe to re-run

CREATE TABLE IF NOT EXISTS meal_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  food_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_favorites_user ON meal_favorites(user_id);

ALTER TABLE meal_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own meal favorites" ON meal_favorites;
CREATE POLICY "Users manage own meal favorites"
ON meal_favorites FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
