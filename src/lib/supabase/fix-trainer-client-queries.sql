-- Fix trainer/client roster queries: browser clients cannot embed auth.users
-- in PostgREST joins. Use SECURITY DEFINER RPCs instead.

DROP FUNCTION IF EXISTS get_trainer_clients(UUID);

CREATE OR REPLACE FUNCTION get_trainer_clients(trainer_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  relationship_id UUID,
  trainer_id UUID,
  client_id UUID,
  status TEXT,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  notes TEXT,
  client_email TEXT,
  client_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> trainer_uuid THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    tc.id,
    tc.trainer_id,
    tc.client_id,
    tc.status,
    tc.invited_at,
    tc.accepted_at,
    tc.terminated_at,
    tc.notes,
    u.email::TEXT,
    COALESCE(
      NULLIF(TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')), ''),
      u.email::TEXT
    ) AS client_name,
    up.first_name,
    up.last_name,
    up.avatar_url
  FROM trainer_clients tc
  JOIN auth.users u ON u.id = tc.client_id
  LEFT JOIN user_profiles up ON up.id = tc.client_id
  WHERE tc.trainer_id = trainer_uuid
    AND tc.status IN ('active', 'pending')
  ORDER BY tc.accepted_at DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_trainer_clients(UUID) TO authenticated;

DROP FUNCTION IF EXISTS get_client_trainers(UUID);

CREATE OR REPLACE FUNCTION get_client_trainers(client_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  relationship_id UUID,
  trainer_id UUID,
  client_id UUID,
  status TEXT,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  notes TEXT,
  trainer_email TEXT,
  trainer_name TEXT,
  trainer_business_name TEXT,
  trainer_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> client_uuid THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    tc.id,
    tc.trainer_id,
    tc.client_id,
    tc.status,
    tc.invited_at,
    tc.accepted_at,
    tc.terminated_at,
    tc.notes,
    u.email::TEXT,
    COALESCE(
      NULLIF(TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')), ''),
      u.email::TEXT
    ) AS trainer_name,
    tp.business_name,
    tp.avatar_url
  FROM trainer_clients tc
  JOIN auth.users u ON u.id = tc.trainer_id
  LEFT JOIN user_profiles up ON up.id = tc.trainer_id
  LEFT JOIN trainer_profiles tp ON tp.id = tc.trainer_id
  WHERE tc.client_id = client_uuid
    AND tc.status = 'active'
  ORDER BY tc.accepted_at DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_client_trainers(UUID) TO authenticated;
