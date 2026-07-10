-- Trainers cannot be assigned as clients of another trainer.
-- Only users without the trainer role may appear in trainer_clients.client_id.

-- ============================================
-- 1. Helper
-- ============================================
CREATE OR REPLACE FUNCTION user_has_trainer_role(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = p_user_id
      AND role = 'trainer'
  );
$$;

GRANT EXECUTE ON FUNCTION user_has_trainer_role(UUID) TO authenticated;

-- ============================================
-- 2. Enforce on trainer_clients (all insert/update paths)
-- ============================================
CREATE OR REPLACE FUNCTION enforce_trainer_clients_client_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_has_trainer_role(NEW.client_id) THEN
    RAISE EXCEPTION 'trainers_cannot_be_clients'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trainer_clients_client_not_trainer ON trainer_clients;
CREATE TRIGGER trainer_clients_client_not_trainer
BEFORE INSERT OR UPDATE OF client_id ON trainer_clients
FOR EACH ROW
EXECUTE FUNCTION enforce_trainer_clients_client_role();

-- ============================================
-- 3. Clean up existing invalid relationships
-- ============================================
UPDATE trainer_clients tc
SET status = 'terminated',
    terminated_at = COALESCE(terminated_at, NOW())
WHERE user_has_trainer_role(tc.client_id)
  AND tc.status IN ('pending', 'active');

-- ============================================
-- 4. Block inviting trainer account emails
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

-- ============================================
-- 5. Invitation accept — reject trainer accounts
-- ============================================
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

  IF user_has_trainer_role(v_client_id) THEN
    RETURN 'is_trainer';
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

  INSERT INTO user_roles (user_id, role)
  VALUES (v_client_id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN 'success';
END;
$$;

-- ============================================
-- 6. Signup — trainers lose any client-of-trainer links
-- ============================================
CREATE OR REPLACE FUNCTION assign_signup_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signup_role TEXT;
  v_invitation_signup BOOLEAN;
BEGIN
  v_signup_role := COALESCE(
    NEW.raw_user_meta_data->>'signup_role',
    NEW.raw_user_meta_data->>'role'
  );
  v_invitation_signup := COALESCE(
    (NEW.raw_user_meta_data->>'invitation_signup')::boolean,
    false
  );

  IF v_signup_role = 'trainer' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'trainer')
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE trainer_clients
    SET status = 'terminated',
        terminated_at = COALESCE(terminated_at, NOW())
    WHERE client_id = NEW.id
      AND status IN ('pending', 'active');
  ELSIF v_signup_role = 'client' AND v_invitation_signup THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to assign signup role for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================
-- 7. Harden legacy connection RPCs (if still deployed)
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

  IF user_has_trainer_role(p_client_id) THEN
    RETURN 'invalid_client';
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
    UPDATE trainer_clients
    SET status = 'pending', invited_at = NOW(), accepted_at = NULL, terminated_at = NULL
    WHERE trainer_id = auth.uid() AND client_id = p_client_id;
  END IF;

  RETURN 'sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    AND NOT user_has_trainer_role(u.id)
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

-- ============================================
-- 8. Roster RPCs — exclude trainer accounts
-- ============================================
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
    AND NOT user_has_trainer_role(tc.client_id)
  ORDER BY tc.accepted_at DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_trainer_clients(UUID) TO authenticated;

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

  IF user_has_trainer_role(client_uuid) THEN
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
