-- PF-312: Enforce a trainer's client limit at invite time.
--
-- The UI (src/app/trainer/clients/add/page.tsx) already checks the limit
-- before showing the invite form and disables submission at the cap — that
-- check is the primary UX. This migration adds a server-side backstop
-- directly in `create_client_invitation` so the limit can't be bypassed by
-- calling the RPC directly (e.g. two tabs open, or a stale client-side
-- count). Mirrors the limit logic in `resolveClientLimit`
-- (src/lib/trainer-plans.ts) — keep both in sync if tiers change again.
--
-- Run after prevent-trainer-as-client.sql (this replaces
-- create_client_invitation once more) and after retier-subscription.sql.

-- ============================================
-- 1. Resolve a trainer's effective client limit
-- ============================================
CREATE OR REPLACE FUNCTION get_trainer_client_limit(p_trainer_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_clients INTEGER;
  v_tier TEXT;
BEGIN
  SELECT max_clients, subscription_tier
  INTO v_max_clients, v_tier
  FROM trainer_profiles
  WHERE id = p_trainer_id;

  IF v_max_clients IS NOT NULL AND v_max_clients > 0 THEN
    RETURN v_max_clients;
  END IF;

  -- Keep in sync with TRAINER_PLANS in src/lib/trainer-plans.ts (PF-311).
  RETURN CASE v_tier
    WHEN 'starter' THEN 5
    WHEN 'growth' THEN 50
    WHEN 'pro' THEN 200
    ELSE 5 -- free tier default
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION get_trainer_client_limit(UUID) TO authenticated;

-- ============================================
-- 2. Count clients + pending invitations against that limit
-- ============================================
-- Counts active + paused roster clients, plus non-expired pending
-- invitations (they would become clients on acceptance).
CREATE OR REPLACE FUNCTION get_trainer_client_usage(p_trainer_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_count INTEGER;
  v_pending_invites INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_client_count
  FROM trainer_clients
  WHERE trainer_id = p_trainer_id
    AND status IN ('active', 'paused');

  SELECT COUNT(*) INTO v_pending_invites
  FROM client_invitations
  WHERE trainer_id = p_trainer_id
    AND status = 'pending'
    AND expires_at > NOW();

  RETURN v_client_count + v_pending_invites;
END;
$$;

GRANT EXECUTE ON FUNCTION get_trainer_client_usage(UUID) TO authenticated;

-- ============================================
-- 3. Patch create_client_invitation to check the cap
-- ============================================
CREATE OR REPLACE FUNCTION create_client_invitation(
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_personal_message TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trainer_id UUID := auth.uid();
  v_invitation client_invitations%ROWTYPE;
  v_limit INTEGER;
  v_usage INTEGER;
BEGIN
  IF v_trainer_id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_authenticated');
  END IF;

  IF NOT user_has_trainer_role(v_trainer_id) THEN
    RETURN jsonb_build_object('status', 'not_a_trainer');
  END IF;

  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RETURN jsonb_build_object('status', 'invalid_email');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE lower(u.email) = lower(trim(p_email))
      AND user_has_trainer_role(u.id)
  ) THEN
    RETURN jsonb_build_object('status', 'is_trainer');
  END IF;

  v_limit := get_trainer_client_limit(v_trainer_id);
  v_usage := get_trainer_client_usage(v_trainer_id);

  IF v_usage >= v_limit THEN
    RETURN jsonb_build_object(
      'status', 'limit_reached',
      'limit', v_limit,
      'usage', v_usage
    );
  END IF;

  INSERT INTO client_invitations (
    trainer_id,
    email,
    first_name,
    last_name,
    personal_message,
    status,
    expires_at
  )
  VALUES (
    v_trainer_id,
    lower(trim(p_email)),
    p_first_name,
    p_last_name,
    p_personal_message,
    'pending',
    COALESCE(p_expires_at, NOW() + INTERVAL '7 days')
  )
  RETURNING * INTO v_invitation;

  RETURN jsonb_build_object(
    'status', 'success',
    'invitation', to_jsonb(v_invitation)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_client_invitation(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
