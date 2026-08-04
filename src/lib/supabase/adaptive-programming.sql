-- ============================================
-- ADAPTIVE PROGRAMMING — TRAINER DIGEST (CA-602)
-- Run this AFTER trainer-activity.sql and exercise-log-difficulty.sql
-- ============================================
-- Aggregates client difficulty ratings so a trainer can see, at a glance,
-- which exercises across their whole roster were rated too hard or too easy
-- recently — without opening every client's program individually.

CREATE OR REPLACE FUNCTION get_trainer_difficulty_digest(p_days INT DEFAULT 7)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  exercise_id UUID,
  exercise_name TEXT,
  avg_difficulty NUMERIC,
  log_count BIGINT,
  hard_count BIGINT,
  easy_count BIGINT,
  last_rated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trainer_id UUID := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_trainer_id AND role = 'trainer'
  ) THEN
    RAISE EXCEPTION 'Only trainers can view the difficulty digest';
  END IF;

  RETURN QUERY
  WITH active_clients AS (
    SELECT tc.client_id
    FROM trainer_clients tc
    WHERE tc.trainer_id = v_trainer_id AND tc.status = 'active'
  ),
  client_names AS (
    SELECT
      u.id AS client_id,
      COALESCE(NULLIF(trim(up.first_name || ' ' || up.last_name), ''), u.email::TEXT) AS client_name
    FROM auth.users u
    LEFT JOIN user_profiles up ON up.id = u.id
    WHERE u.id IN (SELECT client_id FROM active_clients)
  ),
  rated_logs AS (
    SELECT
      wl.user_id AS client_id,
      el.exercise_id,
      el.difficulty_rating,
      COALESCE(el.created_at, wl.date::TIMESTAMP WITH TIME ZONE) AS rated_at
    FROM exercise_logs el
    JOIN workout_logs wl ON wl.id = el.workout_log_id
    WHERE wl.user_id IN (SELECT client_id FROM active_clients)
      AND el.difficulty_rating IS NOT NULL
      AND COALESCE(el.created_at, wl.date::TIMESTAMP WITH TIME ZONE)
        >= NOW() - (GREATEST(1, LEAST(COALESCE(p_days, 7), 90)) || ' days')::INTERVAL
  )
  SELECT
    rl.client_id,
    cn.client_name,
    rl.exercise_id,
    ex.name AS exercise_name,
    ROUND(AVG(rl.difficulty_rating)::NUMERIC, 2) AS avg_difficulty,
    COUNT(*) AS log_count,
    COUNT(*) FILTER (WHERE rl.difficulty_rating >= 4) AS hard_count,
    COUNT(*) FILTER (WHERE rl.difficulty_rating <= 2) AS easy_count,
    MAX(rl.rated_at) AS last_rated_at
  FROM rated_logs rl
  JOIN client_names cn ON cn.client_id = rl.client_id
  JOIN exercises ex ON ex.id = rl.exercise_id
  GROUP BY rl.client_id, cn.client_name, rl.exercise_id, ex.name
  HAVING COUNT(*) FILTER (WHERE rl.difficulty_rating >= 4) >= 2
      OR COUNT(*) FILTER (WHERE rl.difficulty_rating <= 2) >= 2
  ORDER BY hard_count DESC, easy_count DESC, last_rated_at DESC
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION get_trainer_difficulty_digest(INT) TO authenticated;
