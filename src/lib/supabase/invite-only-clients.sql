-- Invite-only clients: only assign roles at signup when explicitly requested.
-- Trainers self-register with signup_role=trainer; clients register via invitation
-- (signup_role=client + invitation_signup=true) or accept_client_invitation().

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

DROP TRIGGER IF EXISTS assign_client_role_on_signup ON auth.users;
DROP TRIGGER IF EXISTS assign_signup_role_on_signup ON auth.users;
CREATE TRIGGER assign_signup_role_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION assign_signup_role();

-- Stop auto-granting client role on login for users without a role.
DROP FUNCTION IF EXISTS ensure_client_role();
