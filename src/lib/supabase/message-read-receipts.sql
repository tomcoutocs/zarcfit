-- Client unread message count + read receipt helpers (ZF-203, ZF-902)
-- Safe to re-run

CREATE OR REPLACE FUNCTION get_client_unread_message_count(p_client_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE c.client_id = p_client_id
    AND m.sender_id <> p_client_id
    AND m.is_read = FALSE;
$$;

GRANT EXECUTE ON FUNCTION get_client_unread_message_count(UUID) TO authenticated;
