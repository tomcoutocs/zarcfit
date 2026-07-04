-- ============================================
-- TRAINER DASHBOARD ACTIVITY & STATS
-- Run this AFTER trainer-platform-schema.sql
-- ============================================

CREATE OR REPLACE FUNCTION get_trainer_dashboard_stats()
RETURNS TABLE (
  workouts_this_week BIGINT,
  unread_messages BIGINT,
  sessions_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trainer_id UUID := auth.uid();
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_trainer_id AND role = 'trainer'
  ) THEN
    RAISE EXCEPTION 'Only trainers can view dashboard stats';
  END IF;

  RETURN QUERY
  SELECT
    (
      SELECT COUNT(*)
      FROM workout_logs wl
      JOIN trainer_clients tc ON tc.client_id = wl.user_id
      WHERE tc.trainer_id = v_trainer_id
        AND tc.status = 'active'
        AND wl.date >= v_week_start
    ) AS workouts_this_week,
    (
      SELECT COUNT(*)
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.trainer_id = v_trainer_id
        AND m.sender_id <> v_trainer_id
        AND m.is_read = FALSE
    ) AS unread_messages,
    (
      SELECT COUNT(*)
      FROM calendar_events ce
      JOIN trainer_clients tc ON tc.client_id = ce.user_id
      WHERE tc.trainer_id = v_trainer_id
        AND tc.status = 'active'
        AND ce.date = v_today
        AND ce.event_type = 'coaching'
    ) AS sessions_today;
END;
$$;

GRANT EXECUTE ON FUNCTION get_trainer_dashboard_stats() TO authenticated;

CREATE OR REPLACE FUNCTION get_trainer_client_activity(p_limit INT DEFAULT 20)
RETURNS TABLE (
  activity_type TEXT,
  client_id UUID,
  client_name TEXT,
  summary TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE,
  reference_id UUID
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
    RAISE EXCEPTION 'Only trainers can view client activity';
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
  activities AS (
    SELECT
      'workout'::TEXT AS activity_type,
      wl.user_id AS client_id,
      cn.client_name,
      ('Logged a workout (' || COALESCE(wl.duration_minutes::TEXT, '?') || ' min)')::TEXT AS summary,
      COALESCE(wl.created_at, wl.date::TIMESTAMP WITH TIME ZONE) AS occurred_at,
      wl.id AS reference_id
    FROM workout_logs wl
    JOIN client_names cn ON cn.client_id = wl.user_id
    WHERE wl.user_id IN (SELECT client_id FROM active_clients)

    UNION ALL

    SELECT
      'progress'::TEXT,
      pt.user_id,
      cn.client_name,
      ('Updated progress' ||
        CASE WHEN pt.weight_kg IS NOT NULL THEN ' (' || pt.weight_kg::TEXT || ' kg)' ELSE '' END)::TEXT,
      COALESCE(pt.created_at, pt.date::TIMESTAMP WITH TIME ZONE),
      pt.id
    FROM progress_tracking pt
    JOIN client_names cn ON cn.client_id = pt.user_id
    WHERE pt.user_id IN (SELECT client_id FROM active_clients)

    UNION ALL

    SELECT
      'goal'::TEXT,
      g.user_id,
      cn.client_name,
      (CASE WHEN g.is_completed THEN 'Completed goal: ' ELSE 'Updated goal: ' END || g.title)::TEXT,
      g.updated_at,
      g.id
    FROM goals g
    JOIN client_names cn ON cn.client_id = g.user_id
    WHERE g.user_id IN (SELECT client_id FROM active_clients)
      AND g.updated_at >= NOW() - INTERVAL '30 days'

    UNION ALL

    SELECT
      'message'::TEXT,
      c.client_id,
      cn.client_name,
      'Sent a message'::TEXT,
      m.created_at,
      m.id
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    JOIN client_names cn ON cn.client_id = c.client_id
    WHERE c.trainer_id = v_trainer_id
      AND m.sender_id = c.client_id

    UNION ALL

    SELECT
      'sleep'::TEXT,
      st.user_id,
      cn.client_name,
      ('Logged sleep (' || st.sleep_duration_hours::TEXT || ' hrs)')::TEXT,
      COALESCE(st.created_at, st.date::TIMESTAMP WITH TIME ZONE),
      st.id
    FROM sleep_tracking st
    JOIN client_names cn ON cn.client_id = st.user_id
    WHERE st.user_id IN (SELECT client_id FROM active_clients)
  )
  SELECT a.activity_type, a.client_id, a.client_name, a.summary, a.occurred_at, a.reference_id
  FROM activities a
  ORDER BY a.occurred_at DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 50));
END;
$$;

GRANT EXECUTE ON FUNCTION get_trainer_client_activity(INT) TO authenticated;
