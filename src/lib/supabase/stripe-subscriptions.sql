-- Stripe subscription columns on trainer profiles (ZF-1001)
-- Safe to re-run — columns may already exist from trainer-platform-schema.sql

ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

CREATE INDEX IF NOT EXISTS idx_trainer_profiles_stripe_customer
ON trainer_profiles(stripe_customer_id);
