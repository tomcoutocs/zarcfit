-- Ensure every client account has an active trainer relationship.
-- Run after invite-only-clients.sql.

-- 1. Activate legacy pending connection requests (pre-invite-only flow)
UPDATE trainer_clients
SET status = 'active',
    accepted_at = COALESCE(accepted_at, NOW())
WHERE status = 'pending';

-- 2. Link clients who accepted email invitations (match by email)
INSERT INTO trainer_clients (trainer_id, client_id, status, accepted_at)
SELECT ci.trainer_id, u.id, 'active', COALESCE(ci.used_at, NOW())
FROM auth.users u
INNER JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'client'
INNER JOIN client_invitations ci
  ON lower(ci.email) = lower(u.email)
  AND ci.status = 'accepted'
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur_trainer
  WHERE ur_trainer.user_id = u.id AND ur_trainer.role = 'trainer'
)
ON CONFLICT (trainer_id, client_id) DO UPDATE
SET status = 'active',
    accepted_at = COALESCE(trainer_clients.accepted_at, EXCLUDED.accepted_at);

-- 3. Assign remaining orphan clients to the earliest trainer account
INSERT INTO trainer_clients (trainer_id, client_id, status, accepted_at)
SELECT primary_trainer.id, orphan.client_id, 'active', NOW()
FROM (
  SELECT u.id AS client_id
  FROM auth.users u
  INNER JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'client'
  WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur_trainer
    WHERE ur_trainer.user_id = u.id AND ur_trainer.role = 'trainer'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM trainer_clients tc
    WHERE tc.client_id = u.id
      AND tc.status = 'active'
  )
) orphan
CROSS JOIN (
  SELECT u.id
  FROM auth.users u
  INNER JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'trainer'
  ORDER BY u.created_at ASC
  LIMIT 1
) primary_trainer
WHERE orphan.client_id <> primary_trainer.id
ON CONFLICT (trainer_id, client_id) DO UPDATE
SET status = 'active',
    accepted_at = COALESCE(trainer_clients.accepted_at, EXCLUDED.accepted_at);
