-- ============================================
-- CUSTOM EXERCISES (CA-103)
-- Trainers can add private exercises with optional video_url.
-- Global library rows keep created_by_trainer_id NULL.
-- Safe to re-run.
-- ============================================

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS created_by_trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_exercises_created_by_trainer
  ON exercises(created_by_trainer_id)
  WHERE created_by_trainer_id IS NOT NULL;

-- Global library + own customs + active clients of the owning trainer
DROP POLICY IF EXISTS "Anyone can view exercises" ON exercises;
DROP POLICY IF EXISTS "Users can view global and own exercises" ON exercises;
CREATE POLICY "Users can view global and own exercises"
ON exercises FOR SELECT
USING (
  created_by_trainer_id IS NULL
  OR created_by_trainer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = exercises.created_by_trainer_id
      AND tc.client_id = auth.uid()
      AND tc.status = 'active'
  )
);

DROP POLICY IF EXISTS "Trainers can insert own exercises" ON exercises;
CREATE POLICY "Trainers can insert own exercises"
ON exercises FOR INSERT
WITH CHECK (
  created_by_trainer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM trainer_profiles tp WHERE tp.id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Trainers can update own exercises" ON exercises;
CREATE POLICY "Trainers can update own exercises"
ON exercises FOR UPDATE
USING (created_by_trainer_id = auth.uid())
WITH CHECK (created_by_trainer_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can delete own exercises" ON exercises;
CREATE POLICY "Trainers can delete own exercises"
ON exercises FOR DELETE
USING (created_by_trainer_id = auth.uid());
