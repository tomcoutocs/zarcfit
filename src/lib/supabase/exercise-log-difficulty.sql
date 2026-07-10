-- Per-exercise difficulty when clients log completed sets.

ALTER TABLE exercise_logs
  ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5);
