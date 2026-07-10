-- In-app notifications for clients and trainers.

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'workout_assigned',
    'meal_plan',
    'message',
    'workout_logged',
    'progress_logged',
    'goal_updated',
    'sleep_logged'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_path TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
  ON user_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread
  ON user_notifications(user_id, is_read)
  WHERE is_read = FALSE;

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON user_notifications;
CREATE POLICY "Users can view their own notifications"
ON user_notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON user_notifications;
CREATE POLICY "Users can update their own notifications"
ON user_notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Helper: create a notification (used by triggers)
-- ============================================
CREATE OR REPLACE FUNCTION create_user_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_link_path TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO user_notifications (
    user_id, type, title, body, link_path, actor_id, reference_id
  )
  VALUES (
    p_user_id, p_type, p_title, p_body, p_link_path, p_actor_id, p_reference_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================
-- Helper: notify all active trainers for a client
-- ============================================
CREATE OR REPLACE FUNCTION notify_client_trainers(
  p_client_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_link_path TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trainer_id UUID;
BEGIN
  FOR v_trainer_id IN
    SELECT tc.trainer_id
    FROM trainer_clients tc
    WHERE tc.client_id = p_client_id
      AND tc.status = 'active'
      AND NOT user_has_trainer_role(tc.client_id)
  LOOP
    PERFORM create_user_notification(
      v_trainer_id,
      p_type,
      p_title,
      p_body,
      p_link_path,
      p_actor_id,
      p_reference_id
    );
  END LOOP;
END;
$$;

-- ============================================
-- Triggers: client-facing updates from trainer
-- ============================================
CREATE OR REPLACE FUNCTION notify_workout_program_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program_name TEXT;
BEGIN
  SELECT wp.name INTO v_program_name
  FROM workout_programs wp
  WHERE wp.id = NEW.program_id;

  PERFORM create_user_notification(
    NEW.client_id,
    'workout_assigned',
    'New workout program',
    COALESCE(v_program_name, 'A workout program') || ' was added to your profile',
    '/client/workout',
    NEW.assigned_by,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_program_assignment_notify ON program_assignments;
CREATE TRIGGER on_program_assignment_notify
AFTER INSERT ON program_assignments
FOR EACH ROW
EXECUTE FUNCTION notify_workout_program_assignment();

CREATE OR REPLACE FUNCTION notify_nutrition_plan_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> NEW.user_id THEN
    PERFORM create_user_notification(
      NEW.user_id,
      'meal_plan',
      'New meal plan',
      COALESCE(NEW.name, 'A meal plan') || ' was added to your profile',
      '/client/meal-plan',
      auth.uid(),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_nutrition_plan_created_notify ON nutrition_plans;
CREATE TRIGGER on_nutrition_plan_created_notify
AFTER INSERT ON nutrition_plans
FOR EACH ROW
EXECUTE FUNCTION notify_nutrition_plan_created();

CREATE OR REPLACE FUNCTION notify_workout_program_created_for_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> NEW.user_id THEN
    PERFORM create_user_notification(
      NEW.user_id,
      'workout_assigned',
      'New workout program',
      COALESCE(NEW.name, 'A workout program') || ' was added to your profile',
      '/client/workout',
      auth.uid(),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_workout_program_created_notify ON workout_programs;
CREATE TRIGGER on_workout_program_created_notify
AFTER INSERT ON workout_programs
FOR EACH ROW
EXECUTE FUNCTION notify_workout_program_created_for_client();

-- ============================================
-- Trigger: messages notify the recipient
-- ============================================
CREATE OR REPLACE FUNCTION notify_message_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trainer_id UUID;
  v_client_id UUID;
  v_recipient_id UUID;
  v_sender_name TEXT;
  v_preview TEXT;
  v_link_path TEXT;
BEGIN
  SELECT c.trainer_id, c.client_id
  INTO v_trainer_id, v_client_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  IF v_trainer_id IS NULL OR v_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_id = v_trainer_id THEN
    v_recipient_id := v_client_id;
    v_link_path := '/client/chat';
  ELSIF NEW.sender_id = v_client_id THEN
    v_recipient_id := v_trainer_id;
    v_link_path := '/trainer/messages?client=' || v_client_id::TEXT;
  ELSE
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    NULLIF(TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')), ''),
    u.email::TEXT,
    'Someone'
  )
  INTO v_sender_name
  FROM auth.users u
  LEFT JOIN user_profiles up ON up.id = u.id
  WHERE u.id = NEW.sender_id;

  v_preview := LEFT(TRIM(NEW.content), 140);
  IF LENGTH(TRIM(NEW.content)) > 140 THEN
    v_preview := v_preview || '...';
  END IF;

  PERFORM create_user_notification(
    v_recipient_id,
    'message',
    'New message from ' || v_sender_name,
    v_preview,
    v_link_path,
    NEW.sender_id,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_received_notify ON messages;
CREATE TRIGGER on_message_received_notify
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_message_received();

-- ============================================
-- Triggers: trainer-facing client activity
-- ============================================
CREATE OR REPLACE FUNCTION notify_workout_logged()
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
  WHERE u.id = NEW.user_id;

  PERFORM notify_client_trainers(
    NEW.user_id,
    'workout_logged',
    'Workout logged',
    v_client_name || ' logged a workout',
    '/trainer/clients/' || NEW.user_id::TEXT,
    NEW.user_id,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_workout_logged_notify ON workout_logs;
CREATE TRIGGER on_workout_logged_notify
AFTER INSERT ON workout_logs
FOR EACH ROW
EXECUTE FUNCTION notify_workout_logged();

CREATE OR REPLACE FUNCTION notify_progress_logged()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name TEXT;
  v_summary TEXT;
BEGIN
  SELECT COALESCE(
    NULLIF(TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')), ''),
    u.email::TEXT,
    'A client'
  )
  INTO v_client_name
  FROM auth.users u
  LEFT JOIN user_profiles up ON up.id = u.id
  WHERE u.id = NEW.user_id;

  v_summary := v_client_name || ' updated progress';
  IF NEW.weight_kg IS NOT NULL THEN
    v_summary := v_summary || ' (' || NEW.weight_kg::TEXT || ' kg)';
  END IF;

  PERFORM notify_client_trainers(
    NEW.user_id,
    'progress_logged',
    'Progress update',
    v_summary,
    '/trainer/clients/' || NEW.user_id::TEXT,
    NEW.user_id,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_progress_logged_notify ON progress_tracking;
CREATE TRIGGER on_progress_logged_notify
AFTER INSERT ON progress_tracking
FOR EACH ROW
EXECUTE FUNCTION notify_progress_logged();

CREATE OR REPLACE FUNCTION notify_goal_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name TEXT;
  v_summary TEXT;
BEGIN
  SELECT COALESCE(
    NULLIF(TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')), ''),
    u.email::TEXT,
    'A client'
  )
  INTO v_client_name
  FROM auth.users u
  LEFT JOIN user_profiles up ON up.id = u.id
  WHERE u.id = NEW.user_id;

  v_summary := CASE
    WHEN NEW.is_completed THEN v_client_name || ' completed a goal: ' || NEW.title
    ELSE v_client_name || ' updated a goal: ' || NEW.title
  END;

  PERFORM notify_client_trainers(
    NEW.user_id,
    'goal_updated',
    CASE WHEN NEW.is_completed THEN 'Goal completed' ELSE 'Goal updated' END,
    v_summary,
    '/trainer/clients/' || NEW.user_id::TEXT,
    NEW.user_id,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_goal_updated_notify ON goals;
CREATE TRIGGER on_goal_updated_notify
AFTER UPDATE ON goals
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION notify_goal_updated();

CREATE OR REPLACE FUNCTION notify_sleep_logged()
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
  WHERE u.id = NEW.user_id;

  PERFORM notify_client_trainers(
    NEW.user_id,
    'sleep_logged',
    'Sleep logged',
    v_client_name || ' logged ' || NEW.sleep_duration_hours::TEXT || ' hours of sleep',
    '/trainer/clients/' || NEW.user_id::TEXT,
    NEW.user_id,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_sleep_logged_notify ON sleep_tracking;
CREATE TRIGGER on_sleep_logged_notify
AFTER INSERT ON sleep_tracking
FOR EACH ROW
EXECUTE FUNCTION notify_sleep_logged();

-- ============================================
-- RPCs for the app
-- ============================================
CREATE OR REPLACE FUNCTION get_user_notifications(p_limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  body TEXT,
  link_path TEXT,
  actor_id UUID,
  reference_id UUID,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    n.id,
    n.type,
    n.title,
    n.body,
    n.link_path,
    n.actor_id,
    n.reference_id,
    n.is_read,
    n.created_at
  FROM user_notifications n
  WHERE n.user_id = v_user_id
  ORDER BY n.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 50));
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_notifications(INT) TO authenticated;

CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count BIGINT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM user_notifications
  WHERE user_id = v_user_id
    AND is_read = FALSE;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE user_notifications
  SET is_read = TRUE,
      read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND is_read = FALSE;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE user_notifications
  SET is_read = TRUE,
      read_at = NOW()
  WHERE user_id = auth.uid()
    AND is_read = FALSE;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;
