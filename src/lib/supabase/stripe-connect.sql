-- PF-321–324: Stripe Connect Express columns for trainer-bills-client invoicing.
-- Safe to re-run.

ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_trainer_profiles_stripe_connect_account
ON trainer_profiles(stripe_connect_account_id);

-- No new RLS policy needed — trainer_profiles already has
-- "Trainers can update their own profile" (USING auth.uid() = id) from
-- trainer-platform-schema.sql, which covers these two new columns.
