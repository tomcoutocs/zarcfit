-- PF-311: Retier the trainer subscription plans.
--
-- Background: trainer-platform-schema.sql originally defined
-- `subscription_tier CHECK (... IN ('free','basic','pro','enterprise'))`,
-- but the Stripe checkout/webhook flow (src/lib/trainer-plans.ts,
-- src/app/api/webhooks/stripe/route.ts) has always read/written
-- 'starter' | 'growth' | 'pro' | 'free'. That mismatch meant a webhook
-- update to 'starter' or 'growth' would violate the old CHECK constraint
-- in a database where it was actually enforced. This migration widens the
-- constraint to the values the app really uses and keeps legacy values so
-- no historical row is invalidated.
--
-- Safe to re-run.

ALTER TABLE trainer_profiles DROP CONSTRAINT IF EXISTS trainer_profiles_subscription_tier_check;

ALTER TABLE trainer_profiles
  ADD CONSTRAINT trainer_profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'starter', 'growth', 'pro', 'basic', 'enterprise'));

-- New tiers (PF-311): Starter 5 clients / $29, Growth 50 clients / $79,
-- Pro 200 clients / $149. Multi-trainer seats on Pro (PF-314) are deferred.
-- Existing trainers on the old 20/50 caps keep their current `max_clients`
-- override (if one was ever set) — this migration does not touch data,
-- only the constraint. `max_clients` remains a per-trainer override on top
-- of the plan-derived limit (see resolveClientLimit in trainer-plans.ts).
