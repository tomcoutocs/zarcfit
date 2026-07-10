-- Messaging access rules:
-- - Trainers can start/send messages to any active client on their roster
-- - Clients can only start/send messages to their assigned trainer(s)

-- ============================================
-- 1. Conversation policies
-- ============================================
DROP POLICY IF EXISTS "Trainer-client pairs can start a conversation" ON conversations;

DROP POLICY IF EXISTS "Trainers can start conversations with active clients" ON conversations;
CREATE POLICY "Trainers can start conversations with active clients"
ON conversations FOR INSERT
WITH CHECK (
  auth.uid() = trainer_id
  AND EXISTS (
    SELECT 1
    FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
      AND tc.client_id = conversations.client_id
      AND tc.status = 'active'
      AND NOT user_has_trainer_role(tc.client_id)
  )
);

DROP POLICY IF EXISTS "Clients can start conversations with their trainer" ON conversations;
CREATE POLICY "Clients can start conversations with their trainer"
ON conversations FOR INSERT
WITH CHECK (
  auth.uid() = client_id
  AND NOT user_has_trainer_role(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM trainer_clients tc
    WHERE tc.trainer_id = conversations.trainer_id
      AND tc.client_id = auth.uid()
      AND tc.status = 'active'
  )
);

-- ============================================
-- 2. Message policies
-- ============================================
DROP POLICY IF EXISTS "Conversation participants can send messages" ON messages;

DROP POLICY IF EXISTS "Trainers can send messages to their clients" ON messages;
CREATE POLICY "Trainers can send messages to their clients"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1
    FROM conversations c
    JOIN trainer_clients tc
      ON tc.trainer_id = c.trainer_id
     AND tc.client_id = c.client_id
    WHERE c.id = messages.conversation_id
      AND c.trainer_id = auth.uid()
      AND tc.status = 'active'
      AND NOT user_has_trainer_role(c.client_id)
  )
);

DROP POLICY IF EXISTS "Clients can send messages to their trainer" ON messages;
CREATE POLICY "Clients can send messages to their trainer"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND NOT user_has_trainer_role(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM conversations c
    JOIN trainer_clients tc
      ON tc.trainer_id = c.trainer_id
     AND tc.client_id = c.client_id
    WHERE c.id = messages.conversation_id
      AND c.client_id = auth.uid()
      AND tc.status = 'active'
  )
);

-- ============================================
-- 3. RPC: get or create a trainer-client conversation
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_trainer_id UUID,
  p_client_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_conversation conversations%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_authenticated');
  END IF;

  IF v_user_id <> p_trainer_id AND v_user_id <> p_client_id THEN
    RETURN jsonb_build_object('status', 'forbidden');
  END IF;

  IF user_has_trainer_role(p_client_id) THEN
    RETURN jsonb_build_object('status', 'invalid_client');
  END IF;

  IF v_user_id = p_trainer_id THEN
    IF NOT user_has_trainer_role(v_user_id) THEN
      RETURN jsonb_build_object('status', 'not_a_trainer');
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM trainer_clients tc
      WHERE tc.trainer_id = p_trainer_id
        AND tc.client_id = p_client_id
        AND tc.status = 'active'
    ) THEN
      RETURN jsonb_build_object('status', 'not_your_client');
    END IF;
  ELSE
    IF user_has_trainer_role(v_user_id) THEN
      RETURN jsonb_build_object('status', 'is_trainer');
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM trainer_clients tc
      WHERE tc.trainer_id = p_trainer_id
        AND tc.client_id = p_client_id
        AND tc.status = 'active'
    ) THEN
      RETURN jsonb_build_object('status', 'not_your_trainer');
    END IF;
  END IF;

  SELECT * INTO v_conversation
  FROM conversations
  WHERE trainer_id = p_trainer_id
    AND client_id = p_client_id
  LIMIT 1;

  IF v_conversation.id IS NULL THEN
    INSERT INTO conversations (trainer_id, client_id)
    VALUES (p_trainer_id, p_client_id)
    RETURNING * INTO v_conversation;
  END IF;

  RETURN jsonb_build_object(
    'status', 'success',
    'conversation', to_jsonb(v_conversation)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;
