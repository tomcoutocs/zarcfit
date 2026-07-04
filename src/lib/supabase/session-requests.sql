-- ============================================
-- SESSION REQUESTS (client proposes, trainer approves)
-- Run AFTER trainer-platform-schema.sql
-- ============================================

CREATE TABLE IF NOT EXISTS session_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined', 'cancelled')),
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  trainer_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_requests_trainer_status
  ON session_requests(trainer_id, status);
CREATE INDEX IF NOT EXISTS idx_session_requests_client
  ON session_requests(client_id, status);

ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients create session requests"
ON session_requests FOR INSERT TO authenticated
WITH CHECK (
  client_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = session_requests.trainer_id
      AND tc.client_id = auth.uid()
      AND tc.status = 'active'
  )
);

CREATE POLICY "Clients read own session requests"
ON session_requests FOR SELECT TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Trainers read session requests"
ON session_requests FOR SELECT TO authenticated
USING (
  trainer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'trainer'
  )
);

CREATE POLICY "Clients cancel own pending requests"
ON session_requests FOR UPDATE TO authenticated
USING (client_id = auth.uid() AND status = 'pending')
WITH CHECK (status IN ('pending', 'cancelled'));

CREATE OR REPLACE FUNCTION respond_to_session_request(
  p_request_id UUID,
  p_action TEXT,
  p_response TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trainer_id UUID := auth.uid();
  v_req session_requests%ROWTYPE;
  v_event_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_trainer_id AND role = 'trainer'
  ) THEN
    RAISE EXCEPTION 'Only trainers can respond to session requests';
  END IF;

  IF p_action NOT IN ('approve', 'decline') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT * INTO v_req
  FROM session_requests
  WHERE id = p_request_id AND trainer_id = v_trainer_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already handled';
  END IF;

  IF p_action = 'decline' THEN
    UPDATE session_requests
    SET status = 'declined', trainer_response = p_response, updated_at = NOW()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('status', 'declined');
  END IF;

  INSERT INTO calendar_events (
    user_id, title, date, start_time, end_time,
    is_all_day, event_type, has_reminder, is_recurring
  ) VALUES (
    v_req.client_id,
    'Coaching Session',
    v_req.requested_date,
    (v_req.requested_date + v_req.start_time)::TIMESTAMP WITH TIME ZONE,
    (v_req.requested_date + v_req.end_time)::TIMESTAMP WITH TIME ZONE,
    FALSE, 'coaching', TRUE, FALSE
  )
  RETURNING id INTO v_event_id;

  UPDATE session_requests
  SET status = 'approved',
      calendar_event_id = v_event_id,
      trainer_response = p_response,
      updated_at = NOW()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('status', 'approved', 'calendar_event_id', v_event_id);
END;
$$;

GRANT EXECUTE ON FUNCTION respond_to_session_request(UUID, TEXT, TEXT) TO authenticated;
