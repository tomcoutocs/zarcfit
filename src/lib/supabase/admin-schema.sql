-- ============================================
-- ADMIN PANEL SUPPORT FUNCTIONS
-- Run this AFTER schema.sql, trainer-platform-schema.sql, and blog-schema.sql
-- ============================================
--
-- Why this file exists:
-- The admin dashboard showed hardcoded stats and the "Users" nav link had
-- no page behind it. Listing/managing users requires reading auth.users
-- (email, created_at) which RLS on a normal table can't expose safely to
-- the client — so, following the same pattern as `get_trainer_clients` in
-- trainer-platform-schema.sql, these are SECURITY DEFINER functions that
-- check the caller is an admin themselves before returning anything.

-- ============================================
-- get_all_users_for_admin
-- Returns every user with their profile name and assigned roles, for the
-- admin "Users" page. Raises an exception if the caller isn't an admin.
-- ============================================
CREATE OR REPLACE FUNCTION get_all_users_for_admin()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  first_name TEXT,
  last_name TEXT,
  roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can list users';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::TEXT,
    u.created_at,
    up.first_name,
    up.last_name,
    COALESCE(
      ARRAY(SELECT ur.role FROM user_roles ur WHERE ur.user_id = u.id),
      ARRAY[]::TEXT[]
    ) AS roles
  FROM auth.users u
  LEFT JOIN user_profiles up ON up.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_users_for_admin() TO authenticated;

-- ============================================
-- admin_set_user_role
-- Grants or revokes a role for a user. Admin-only. `p_action` is 'grant' or
-- 'revoke' so this one function covers both the "Add" and "Remove" buttons.
-- ============================================
CREATE OR REPLACE FUNCTION admin_set_user_role(
  p_user_id UUID,
  p_role TEXT,
  p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can modify user roles';
  END IF;

  IF p_role NOT IN ('admin', 'trainer', 'client') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  IF p_action = 'grant' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, p_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF p_action = 'revoke' THEN
    DELETE FROM user_roles WHERE user_id = p_user_id AND role = p_role;
  ELSE
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_set_user_role(UUID, TEXT, TEXT) TO authenticated;

-- ============================================
-- get_admin_stats
-- Powers the numbers on the admin dashboard overview cards.
-- ============================================
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_admins BIGINT,
  total_trainers BIGINT,
  total_clients BIGINT,
  total_blog_posts BIGINT,
  published_blog_posts BIGINT,
  active_trainer_client_pairs BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can view admin stats';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users),
    (SELECT COUNT(*) FROM user_roles WHERE role = 'admin'),
    (SELECT COUNT(*) FROM user_roles WHERE role = 'trainer'),
    (SELECT COUNT(*) FROM user_roles WHERE role = 'client'),
    (SELECT COUNT(*) FROM blog_posts),
    (SELECT COUNT(*) FROM blog_posts WHERE status = 'published'),
    (SELECT COUNT(*) FROM trainer_clients WHERE status = 'active');
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;
