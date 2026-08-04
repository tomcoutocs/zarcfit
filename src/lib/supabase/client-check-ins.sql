-- Phase 3: weekly client check-ins (CA-301).
-- A lightweight mood/energy/sleep/weight pulse clients log once per day
-- (one row per client per date), so trainers can spot clients who have
-- gone quiet without needing a phone call.
--
-- Safe to re-run.

-- ============================================
-- client_check_ins
-- ============================================
CREATE TABLE IF NOT EXISTS client_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  weight_kg NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_client_check_ins_client_date
  ON client_check_ins(client_id, check_in_date DESC);

ALTER TABLE client_check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own check-ins" ON client_check_ins;
CREATE POLICY "Clients can view own check-ins"
ON client_check_ins FOR SELECT
USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can insert own check-ins" ON client_check_ins;
CREATE POLICY "Clients can insert own check-ins"
ON client_check_ins FOR INSERT
WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can update own check-ins" ON client_check_ins;
CREATE POLICY "Clients can update own check-ins"
ON client_check_ins FOR UPDATE
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Trainers can view active clients' check-ins" ON client_check_ins;
CREATE POLICY "Trainers can view active clients' check-ins"
ON client_check_ins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = client_check_ins.client_id
    AND tc.status = 'active'
  )
);

-- ============================================
-- Notifications: let trainers know when a client checks in (CA-304)
-- ============================================
ALTER TABLE user_notifications DROP CONSTRAINT IF EXISTS user_notifications_type_check;
ALTER TABLE user_notifications ADD CONSTRAINT user_notifications_type_check
CHECK (type IN (
  'workout_assigned',
  'meal_plan',
  'message',
  'workout_logged',
  'progress_logged',
  'goal_updated',
  'sleep_logged',
  'check_in_logged'
));

CREATE OR REPLACE FUNCTION notify_check_in_logged()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name TEXT;
BEGIN
  SELECT COALESCE(
    NULLIF(TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')), ''),
    u.email::TEXT,
    'A client'
  )
  INTO v_client_name
  FROM auth.users u
  LEFT JOIN user_profiles up ON up.id = u.id
  WHERE u.id = NEW.client_id;

  PERFORM notify_client_trainers(
    NEW.client_id,
    'check_in_logged',
    'Weekly check-in',
    v_client_name || ' logged a check-in (mood ' || COALESCE(NEW.mood::TEXT, '-') ||
      '/5, energy ' || COALESCE(NEW.energy::TEXT, '-') || '/5)',
    '/trainer/clients/' || NEW.client_id::TEXT,
    NEW.client_id,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_check_in_logged_notify ON client_check_ins;
CREATE TRIGGER on_check_in_logged_notify
AFTER INSERT ON client_check_ins
FOR EACH ROW
EXECUTE FUNCTION notify_check_in_logged();

-- ============================================
-- Trainer dashboard activity feed: fold check-ins into the existing
-- "All Client Updates" stream (extends get_trainer_client_activity from
-- trainer-activity.sql with a new UNION branch).
-- ============================================
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

    UNION ALL

    SELECT
      'check_in'::TEXT,
      cci.client_id,
      cn.client_name,
      ('Logged a weekly check-in (mood ' || COALESCE(cci.mood::TEXT, '-') ||
        '/5, energy ' || COALESCE(cci.energy::TEXT, '-') || '/5)')::TEXT,
      COALESCE(cci.created_at, cci.check_in_date::TIMESTAMP WITH TIME ZONE),
      cci.id
    FROM client_check_ins cci
    JOIN client_names cn ON cn.client_id = cci.client_id
    WHERE cci.client_id IN (SELECT client_id FROM active_clients)
  )
  SELECT
    result.activity_type,
    result.client_id,
    result.client_name,
    result.summary,
    result.occurred_at,
    result.reference_id
  FROM (
    SELECT
      a.activity_type,
      a.client_id,
      a.client_name,
      a.summary,
      a.occurred_at,
      a.reference_id
    FROM activities a
    ORDER BY a.occurred_at DESC NULLS LAST
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 50))
  ) result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_trainer_client_activity(INT) TO authenticated;

-- ============================================
-- RPC (CA-305): active clients who haven't checked in within p_days
-- (defaults to 7). Powers the "Email missed check-ins digest" trigger
-- and could also back a badge count on the clients list.
-- ============================================
CREATE OR REPLACE FUNCTION get_missed_check_ins(p_days INT DEFAULT 7)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  client_email TEXT,
  last_check_in_date DATE
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
    RAISE EXCEPTION 'Only trainers can view missed check-ins';
  END IF;

  RETURN QUERY
  SELECT
    tc.client_id,
    COALESCE(NULLIF(TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')), ''), u.email::TEXT) AS client_name,
    u.email::TEXT AS client_email,
    latest.check_in_date AS last_check_in_date
  FROM trainer_clients tc
  JOIN auth.users u ON u.id = tc.client_id
  LEFT JOIN user_profiles up ON up.id = tc.client_id
  LEFT JOIN LATERAL (
    SELECT cci.check_in_date
    FROM client_check_ins cci
    WHERE cci.client_id = tc.client_id
    ORDER BY cci.check_in_date DESC
    LIMIT 1
  ) latest ON TRUE
  WHERE tc.trainer_id = v_trainer_id
    AND tc.status = 'active'
    AND (latest.check_in_date IS NULL OR latest.check_in_date < CURRENT_DATE - COALESCE(p_days, 7))
  ORDER BY latest.check_in_date ASC NULLS FIRST, client_name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_missed_check_ins(INT) TO authenticated;
