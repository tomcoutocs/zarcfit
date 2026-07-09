-- Assign a default "client" role to every new user and backfill existing users
-- without a role. Run via Supabase SQL Editor or migration tooling.
--
-- SUPERSEDED BY invite-only-clients.sql — clients now join via trainer invitation only.

-- 1. Auto-assign client role on signup (runs as SECURITY DEFINER, bypasses RLS)
CREATE OR REPLACE FUNCTION assign_default_client_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to assign default client role for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_client_role_on_signup ON auth.users;
CREATE TRIGGER assign_client_role_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION assign_default_client_role();

-- 2. Callable on login when signup-time role insert failed (e.g. email confirmation)
CREATE OR REPLACE FUNCTION ensure_client_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN 'client';
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_client_role() TO authenticated;

-- 3. Backfill users who signed up before this trigger existed
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'client'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
)
ON CONFLICT (user_id, role) DO NOTHING;
