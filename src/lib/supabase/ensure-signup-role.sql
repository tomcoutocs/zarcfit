-- Ensure signup roles exist after email confirmation when the signup trigger
-- did not run or the client-side insert failed without a session.
CREATE OR REPLACE FUNCTION ensure_signup_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role TEXT;
  v_signup_role TEXT;
  v_invitation_signup BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = v_user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 3
    WHEN 'trainer' THEN 2
    WHEN 'client' THEN 1
    ELSE 0
  END DESC
  LIMIT 1;

  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  SELECT
    COALESCE(raw_user_meta_data->>'signup_role', raw_user_meta_data->>'role'),
    COALESCE((raw_user_meta_data->>'invitation_signup')::boolean, false)
  INTO v_signup_role, v_invitation_signup
  FROM auth.users
  WHERE id = v_user_id;

  IF v_signup_role = 'trainer' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'trainer')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN 'trainer';
  ELSIF v_signup_role = 'client' AND v_invitation_signup THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN 'client';
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_signup_role() TO authenticated;
