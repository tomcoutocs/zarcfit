-- ============================================
-- TRAINER -> EXISTING CLIENT SEARCH & CONNECT
-- Run this AFTER schema.sql and trainer-platform-schema.sql
-- ============================================
--
-- Why this file exists:
-- The "Invite Client" page could only send an email invitation to someone
-- who didn't have an account yet. There was no way for a trainer to find and
-- connect with a user who had already signed up as a client. Reading
-- auth.users directly isn't safe to expose through normal RLS-gated table
-- queries, so — following the same pattern as get_trainer_clients and the
-- admin-schema.sql functions — these are SECURITY DEFINER RPCs that check
-- the caller's role before returning or mutating anything.

-- ============================================
-- search_potential_clients
-- Lets a trainer search existing client accounts by name/email. Returns each
-- match's current relationship status with the calling trainer (if any) so
-- the UI can show "Already connected" / "Request sent" instead of a
-- duplicate "Send Request" button.
-- ============================================
CREATE OR REPLACE FUNCTION search_potential_clients(p_search TEXT)
RETURNS TABLE (
  client_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  relationship_status TEXT
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'trainer'
  ) THEN
    RAISE EXCEPTION 'Only trainers can search for clients';
  END IF;

  IF p_search IS NULL OR length(trim(p_search)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.id AS client_id,
    u.email::TEXT AS email,
    up.first_name,
    up.last_name,
    up.avatar_url,
    tc.status AS relationship_status
  FROM auth.users u
  JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'client'
  LEFT JOIN user_profiles up ON up.id = u.id
  LEFT JOIN trainer_clients tc ON tc.client_id = u.id AND tc.trainer_id = auth.uid()
  WHERE u.id <> auth.uid()
  AND (
    u.email ILIKE '%' || p_search || '%'
    OR COALESCE(up.first_name, '') ILIKE '%' || p_search || '%'
    OR COALESCE(up.last_name, '') ILIKE '%' || p_search || '%'
    OR COALESCE(up.first_name || ' ' || up.last_name, '') ILIKE '%' || p_search || '%'
  )
  ORDER BY
    CASE tc.status WHEN 'active' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
    up.first_name NULLS LAST,
    u.email
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_potential_clients(TEXT) TO authenticated;

-- ============================================
-- send_client_connection_request
-- Creates (or revives) a pending trainer_clients row for an existing client
-- account, without going through the email-invitation flow. The client must
-- still accept it via respond_to_trainer_request below before the trainer
-- gets full access to their data — this only ever creates a 'pending' row.
-- ============================================
CREATE OR REPLACE FUNCTION send_client_connection_request(p_client_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_existing_status TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'trainer'
  ) THEN
    RETURN 'not_a_trainer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = p_client_id AND role = 'client'
  ) THEN
    RETURN 'invalid_client';
  END IF;

  SELECT status INTO v_existing_status
  FROM trainer_clients
  WHERE trainer_id = auth.uid() AND client_id = p_client_id;

  IF v_existing_status = 'active' THEN
    RETURN 'already_active';
  ELSIF v_existing_status = 'pending' THEN
    RETURN 'already_pending';
  ELSIF v_existing_status IS NULL THEN
    INSERT INTO trainer_clients (trainer_id, client_id, status, invited_at)
    VALUES (auth.uid(), p_client_id, 'pending', NOW());
  ELSE
    -- Previously paused/terminated relationship — a fresh request revives it.
    UPDATE trainer_clients
    SET status = 'pending', invited_at = NOW(), accepted_at = NULL, terminated_at = NULL
    WHERE trainer_id = auth.uid() AND client_id = p_client_id;
  END IF;

  RETURN 'sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_client_connection_request(UUID) TO authenticated;

-- ============================================
-- respond_to_trainer_request
-- Lets the invited client accept or decline a pending direct-connect
-- request. There is no client-facing RLS UPDATE policy on trainer_clients
-- (deliberately — a broad policy would let a client edit trainer-owned
-- columns like notes), so acceptance goes through this narrow RPC instead.
-- ============================================
CREATE OR REPLACE FUNCTION respond_to_trainer_request(p_trainer_id UUID, p_accept BOOLEAN)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM trainer_clients
  WHERE trainer_id = p_trainer_id AND client_id = auth.uid();

  IF v_status IS NULL THEN
    RETURN 'not_found';
  END IF;

  IF v_status <> 'pending' THEN
    RETURN 'invalid_status';
  END IF;

  IF p_accept THEN
    UPDATE trainer_clients
    SET status = 'active', accepted_at = NOW()
    WHERE trainer_id = p_trainer_id AND client_id = auth.uid();
    RETURN 'accepted';
  ELSE
    UPDATE trainer_clients
    SET status = 'terminated', terminated_at = NOW()
    WHERE trainer_id = p_trainer_id AND client_id = auth.uid();
    RETURN 'declined';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION respond_to_trainer_request(UUID, BOOLEAN) TO authenticated;

-- ============================================
-- Harden the existing trainer_clients INSERT policy
-- ============================================
-- The original policy (trainer-platform-schema.sql) only checked
-- `auth.uid() = trainer_id`, which technically let a trainer INSERT a row
-- with status = 'active' directly, skipping client consent entirely. The
-- app itself never did this (relationships were only ever created via the
-- accept_client_invitation RPC, which sets 'active' itself as
-- SECURITY DEFINER), but there's no reason to leave the door open now that
-- direct-connect requests are a supported flow. Any trainer-initiated
-- INSERT must now start out 'pending'.
DROP POLICY IF EXISTS "Trainers can insert client relationships" ON trainer_clients;
CREATE POLICY "Trainers can insert client relationships"
ON trainer_clients FOR INSERT
WITH CHECK (auth.uid() = trainer_id AND status = 'pending');
