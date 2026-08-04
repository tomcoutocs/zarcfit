-- Phase 4: Connect payment maturity (CA-401, CA-404).
-- Persists Stripe Connect invoices/subscriptions a trainer sends/creates
-- for their clients, kept in sync via the Connect webhook
-- (src/app/api/webhooks/stripe-connect/route.ts). ZarcFit takes 0%
-- platform fee on all of this — see stripe-connect.sql / STRIPE_SETUP.md.
--
-- Safe to re-run.

-- ============================================
-- trainer_client_invoices (CA-401)
-- ============================================
CREATE TABLE IF NOT EXISTS trainer_client_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT NOT NULL,
  stripe_account_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  -- 'payment_failed' isn't a native Stripe invoice status — it's set from
  -- the `invoice.payment_failed` webhook event so the roster/detail UI can
  -- distinguish "still trying to collect" from a plain open invoice.
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible', 'payment_failed')) DEFAULT 'open',
  description TEXT,
  hosted_invoice_url TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stripe_invoice_id)
);

CREATE INDEX IF NOT EXISTS idx_trainer_client_invoices_trainer ON trainer_client_invoices(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_invoices_client ON trainer_client_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_invoices_account ON trainer_client_invoices(stripe_account_id);

ALTER TABLE trainer_client_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their invoices" ON trainer_client_invoices;
CREATE POLICY "Trainers can view their invoices"
ON trainer_client_invoices FOR SELECT
USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Clients can view their invoices" ON trainer_client_invoices;
CREATE POLICY "Clients can view their invoices"
ON trainer_client_invoices FOR SELECT
USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Trainers can insert their invoices" ON trainer_client_invoices;
CREATE POLICY "Trainers can insert their invoices"
ON trainer_client_invoices FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update their invoices" ON trainer_client_invoices;
CREATE POLICY "Trainers can update their invoices"
ON trainer_client_invoices FOR UPDATE
USING (auth.uid() = trainer_id);

-- The Connect webhook (src/app/api/webhooks/stripe-connect/route.ts) writes
-- with the service role key, which bypasses RLS entirely — no extra policy
-- needed for that sync path.

-- ============================================
-- trainer_client_subscriptions (CA-404)
-- Recurring monthly/annual coaching packages a trainer bills a client on
-- their own connected account. Same 0% platform fee as one-off invoices.
-- ============================================
CREATE TABLE IF NOT EXISTS trainer_client_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_account_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  stripe_price_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL DEFAULT 'month',
  status TEXT NOT NULL CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')) DEFAULT 'incomplete',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stripe_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_trainer_client_subscriptions_trainer ON trainer_client_subscriptions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_subscriptions_client ON trainer_client_subscriptions(client_id);

ALTER TABLE trainer_client_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their client subscriptions" ON trainer_client_subscriptions;
CREATE POLICY "Trainers can view their client subscriptions"
ON trainer_client_subscriptions FOR SELECT
USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Clients can view their subscriptions" ON trainer_client_subscriptions;
CREATE POLICY "Clients can view their subscriptions"
ON trainer_client_subscriptions FOR SELECT
USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Trainers can insert their client subscriptions" ON trainer_client_subscriptions;
CREATE POLICY "Trainers can insert their client subscriptions"
ON trainer_client_subscriptions FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update their client subscriptions" ON trainer_client_subscriptions;
CREATE POLICY "Trainers can update their client subscriptions"
ON trainer_client_subscriptions FOR UPDATE
USING (auth.uid() = trainer_id);
