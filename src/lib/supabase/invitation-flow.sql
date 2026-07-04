-- ============================================
-- CLIENT INVITATION ACCEPT FLOW
-- Run this AFTER trainer-platform-schema.sql and update-rls-policies.sql
-- ============================================
--
-- Why this file exists:
-- The RLS policies on `client_invitations` only let a trainer SELECT/UPDATE
-- their own invitations (auth.uid() = trainer_id). That's correct for the
-- trainer-facing UI, but it means the *invited client* — who is not the
-- trainer and often isn't authenticated yet — can never read the invitation
-- by token, or mark it accepted, through normal RLS-gated queries.
--
-- Rather than loosening RLS to allow anyone to SELECT/UPDATE
-- `client_invitations` (which would let any user enumerate pending
-- invitations, including other people's emails), we use two
-- `SECURITY DEFINER` functions that run with elevated privileges but only
-- ever touch the single row matching the exact token passed in.

-- Preview an invitation by token (safe for anonymous/unauthenticated calls).
-- Returns only what's needed to render the accept-invitation page — no
-- ability to list or browse other invitations.
CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  personal_message TEXT,
  status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  trainer_business_name TEXT,
  trainer_first_name TEXT,
  trainer_last_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.email,
    ci.first_name,
    ci.last_name,
    ci.personal_message,
    ci.status,
    ci.expires_at,
    tp.business_name AS trainer_business_name,
    up.first_name AS trainer_first_name,
    up.last_name AS trainer_last_name
  FROM client_invitations ci
  LEFT JOIN trainer_profiles tp ON tp.id = ci.trainer_id
  LEFT JOIN user_profiles up ON up.id = ci.trainer_id
  WHERE ci.token = p_token
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_invitation_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(TEXT) TO authenticated;

-- Accept an invitation as the currently authenticated user. Creates the
-- trainer-client relationship and marks the invitation as accepted in a
-- single server-side operation. Requires the caller to be logged in.
CREATE OR REPLACE FUNCTION accept_client_invitation(p_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation client_invitations%ROWTYPE;
  v_client_id UUID := auth.uid();
  v_client_email TEXT;
BEGIN
  IF v_client_id IS NULL THEN
    RETURN 'not_authenticated';
  END IF;

  SELECT * INTO v_invitation
  FROM client_invitations
  WHERE token = p_token
  LIMIT 1;

  IF v_invitation.id IS NULL THEN
    RETURN 'not_found';
  END IF;

  IF v_invitation.status = 'accepted' THEN
    RETURN 'already_accepted';
  END IF;

  IF v_invitation.status <> 'pending' THEN
    RETURN 'invalid_status';
  END IF;

  IF v_invitation.expires_at < NOW() THEN
    UPDATE client_invitations SET status = 'expired' WHERE token = p_token;
    RETURN 'expired';
  END IF;

  -- Guard against a different, already-authenticated user consuming
  -- someone else's invitation link.
  SELECT email INTO v_client_email FROM auth.users WHERE id = v_client_id;
  IF v_client_email IS NULL OR lower(v_client_email) <> lower(v_invitation.email) THEN
    RETURN 'email_mismatch';
  END IF;

  INSERT INTO trainer_clients (trainer_id, client_id, status, accepted_at)
  VALUES (v_invitation.trainer_id, v_client_id, 'active', NOW())
  ON CONFLICT (trainer_id, client_id)
  DO UPDATE SET status = 'active', accepted_at = NOW(), terminated_at = NULL;

  UPDATE client_invitations
  SET status = 'accepted', used_at = NOW()
  WHERE token = p_token;

  -- Make sure the accepting user has a `client` role on record (defensive;
  -- normal signup already assigns one, but invitation links may be used by
  -- users who signed up before roles existed).
  INSERT INTO user_roles (user_id, role)
  VALUES (v_client_id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN 'success';
END;
$$;

GRANT EXECUTE ON FUNCTION accept_client_invitation(TEXT) TO authenticated;
