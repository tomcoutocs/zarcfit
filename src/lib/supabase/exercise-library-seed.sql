-- ============================================
-- EXERCISE LIBRARY SEED DATA
-- Run this AFTER workout-nutrition-rls.sql
-- ============================================
-- Populates the shared `exercises` reference table so the Workout Tracking
-- feature has something to log against out of the box. Safe to re-run —
-- skips any name that already exists.

INSERT INTO exercises (name, muscle_group, equipment, difficulty)
SELECT * FROM (VALUES
  -- Chest
  ('Bench Press', 'Chest', 'Barbell', 'intermediate'),
  ('Incline Dumbbell Press', 'Chest', 'Dumbbell', 'intermediate'),
  ('Push-Up', 'Chest', 'Bodyweight', 'beginner'),
  ('Chest Fly', 'Chest', 'Dumbbell', 'beginner'),
  ('Cable Crossover', 'Chest', 'Cable', 'intermediate'),
  ('Dips', 'Chest', 'Bodyweight', 'intermediate'),

  -- Back
  ('Deadlift', 'Back', 'Barbell', 'advanced'),
  ('Pull-Up', 'Back', 'Bodyweight', 'intermediate'),
  ('Lat Pulldown', 'Back', 'Cable', 'beginner'),
  ('Barbell Row', 'Back', 'Barbell', 'intermediate'),
  ('Seated Cable Row', 'Back', 'Cable', 'beginner'),
  ('Single-Arm Dumbbell Row', 'Back', 'Dumbbell', 'beginner'),

  -- Legs
  ('Squat', 'Legs', 'Barbell', 'intermediate'),
  ('Leg Press', 'Legs', 'Machine', 'beginner'),
  ('Romanian Deadlift', 'Legs', 'Barbell', 'intermediate'),
  ('Walking Lunge', 'Legs', 'Dumbbell', 'beginner'),
  ('Leg Extension', 'Legs', 'Machine', 'beginner'),
  ('Leg Curl', 'Legs', 'Machine', 'beginner'),
  ('Calf Raise', 'Legs', 'Machine', 'beginner'),
  ('Bulgarian Split Squat', 'Legs', 'Dumbbell', 'intermediate'),
  ('Hip Thrust', 'Legs', 'Barbell', 'intermediate'),

  -- Shoulders
  ('Overhead Press', 'Shoulders', 'Barbell', 'intermediate'),
  ('Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell', 'beginner'),
  ('Lateral Raise', 'Shoulders', 'Dumbbell', 'beginner'),
  ('Front Raise', 'Shoulders', 'Dumbbell', 'beginner'),
  ('Face Pull', 'Shoulders', 'Cable', 'beginner'),
  ('Arnold Press', 'Shoulders', 'Dumbbell', 'intermediate'),

  -- Arms
  ('Bicep Curl', 'Arms', 'Dumbbell', 'beginner'),
  ('Hammer Curl', 'Arms', 'Dumbbell', 'beginner'),
  ('Barbell Curl', 'Arms', 'Barbell', 'beginner'),
  ('Tricep Pushdown', 'Arms', 'Cable', 'beginner'),
  ('Overhead Tricep Extension', 'Arms', 'Dumbbell', 'beginner'),
  ('Skull Crusher', 'Arms', 'Barbell', 'intermediate'),

  -- Core
  ('Plank', 'Core', 'Bodyweight', 'beginner'),
  ('Crunch', 'Core', 'Bodyweight', 'beginner'),
  ('Hanging Leg Raise', 'Core', 'Bodyweight', 'intermediate'),
  ('Russian Twist', 'Core', 'Bodyweight', 'beginner'),
  ('Ab Wheel Rollout', 'Core', 'Equipment', 'advanced'),
  ('Cable Woodchopper', 'Core', 'Cable', 'intermediate'),

  -- Cardio / Full body
  ('Treadmill Run', 'Cardio', 'Machine', 'beginner'),
  ('Rowing Machine', 'Cardio', 'Machine', 'beginner'),
  ('Kettlebell Swing', 'Full Body', 'Kettlebell', 'intermediate'),
  ('Burpee', 'Full Body', 'Bodyweight', 'intermediate'),
  ('Battle Ropes', 'Full Body', 'Equipment', 'intermediate'),
  ('Jump Rope', 'Cardio', 'Equipment', 'beginner'),

  -- Additional library (v3 expansion)
  ('Decline Bench Press', 'Chest', 'Barbell', 'intermediate'),
  ('Pec Deck', 'Chest', 'Machine', 'beginner'),
  ('Wide-Grip Pull-Up', 'Back', 'Bodyweight', 'advanced'),
  ('T-Bar Row', 'Back', 'Barbell', 'intermediate'),
  ('Straight-Arm Pulldown', 'Back', 'Cable', 'beginner'),
  ('Goblet Squat', 'Legs', 'Dumbbell', 'beginner'),
  ('Hack Squat', 'Legs', 'Machine', 'intermediate'),
  ('Step-Up', 'Legs', 'Dumbbell', 'beginner'),
  ('Glute Bridge', 'Legs', 'Bodyweight', 'beginner'),
  ('Nordic Curl', 'Legs', 'Bodyweight', 'advanced'),
  ('Upright Row', 'Shoulders', 'Barbell', 'intermediate'),
  ('Reverse Fly', 'Shoulders', 'Dumbbell', 'beginner'),
  ('Shrugs', 'Shoulders', 'Dumbbell', 'beginner'),
  ('Preacher Curl', 'Arms', 'Barbell', 'beginner'),
  ('Concentration Curl', 'Arms', 'Dumbbell', 'beginner'),
  ('Close-Grip Bench Press', 'Arms', 'Barbell', 'intermediate'),
  ('Rope Tricep Pushdown', 'Arms', 'Cable', 'beginner'),
  ('Dead Bug', 'Core', 'Bodyweight', 'beginner'),
  ('Pallof Press', 'Core', 'Cable', 'beginner'),
  ('Side Plank', 'Core', 'Bodyweight', 'beginner'),
  ('Mountain Climber', 'Core', 'Bodyweight', 'beginner'),
  ('Assault Bike', 'Cardio', 'Machine', 'beginner'),
  ('Stair Climber', 'Cardio', 'Machine', 'beginner'),
  ('Farmer Carry', 'Full Body', 'Dumbbell', 'intermediate'),
  ('Medicine Ball Slam', 'Full Body', 'Equipment', 'intermediate'),
  ('Box Jump', 'Full Body', 'Equipment', 'intermediate'),
  ('Sled Push', 'Full Body', 'Equipment', 'intermediate')
) AS seed(name, muscle_group, equipment, difficulty)
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e WHERE e.name = seed.name
);
