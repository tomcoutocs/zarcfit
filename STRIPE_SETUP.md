# Stripe Setup Guide (CA-001 – CA-005 / NG-201 – NG-204)

Complete these steps in the [Stripe Dashboard](https://dashboard.stripe.com) before enabling live billing.

Competitive backlog IDs: **CA-001** prices · **CA-002** env · **CA-003** webhook · **CA-004** portal + Connect · **CA-005** smoke test.

## 1. Create products & prices (NG-201)

Create three recurring monthly products:

| Plan | Clients | Price | Env var |
|------|---------|-------|---------|
| Starter | 5 | $29/mo | `NEXT_PUBLIC_STRIPE_PRICE_STARTER` |
| Growth | 50 | $79/mo | `NEXT_PUBLIC_STRIPE_PRICE_GROWTH` |
| Pro | 200 | $149/mo | `NEXT_PUBLIC_STRIPE_PRICE_PRO` |

(PF-311 retier, July 30 2026 — was 5 / 20 / 50 clients at $29 / $59 / $99)

Copy each **Price ID** (starts with `price_`) into Vercel environment variables.

## 2. API keys (NG-202)

In Stripe → **Developers → API keys**:

| Variable | Source |
|----------|--------|
| `STRIPE_SECRET_KEY` | Secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key |

## 3. Webhook endpoint (NG-203)

1. Stripe → **Developers → Webhooks → Add endpoint**
2. URL: `https://zarcfit.vercel.app/api/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET` in Vercel

## 4. Customer Portal (NG-204)

Stripe → **Settings → Billing → Customer portal**

Enable:
- Update payment methods
- Cancel subscriptions
- Pause subscriptions (optional)

## 5. Verify in staging (NG-206)

1. Log in as trainer on staging/production
2. Visit `/main/plans` → Subscribe on a tier
3. Complete Stripe test checkout (card `4242 4242 4242 4242`)
4. Confirm `trainer_profiles.subscription_tier` updates in Supabase
5. Open **Trainer Settings → Billing → Manage** → portal loads

## Test cards

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Declined |

Use any future expiry and any CVC.

## 6. Stripe Connect — trainer bills their clients (PF-321–324, CA-401–405)

Separate from the subscription billing above. Trainers connect their own Stripe account and invoice their clients directly; ZarcFit takes **0% platform fee** on these payments (decision, July 30 2026) — for both one-off invoices and recurring packages.

1. Stripe → **Connect → Get started** → enable Express accounts for your platform.
2. No extra env vars needed for onboarding/invoicing — uses the same `STRIPE_SECRET_KEY`. The Connect webhook (step 6 below) needs one more env var.
3. Run the SQL migrations (in order): `retier-subscription.sql`, `enforce-client-limit.sql`, `stripe-connect.sql`, `trainer-client-invoices.sql`.
4. From a trainer account: Settings → Billing → "Connect Stripe to bill clients" → complete Express onboarding → land back on Settings, which re-checks status via `GET /api/stripe/connect/onboard`.
5. Once connected, use "Send Invoice" (Settings → Billing, or the client detail page) to email a one-off Stripe-hosted invoice, or "Set up recurring package" (client detail → Billing tab) for a monthly/annual subscription.

### Connect webhook — invoice/subscription sync (CA-401)

Invoices and subscriptions are created on each trainer's *connected* account, so they need their own webhook endpoint — separate from `/api/webhooks/stripe` above, which only ever sees platform-account events.

1. Stripe → **Developers → Webhooks → Add endpoint**.
2. URL: `https://zarcfit.vercel.app/api/webhooks/stripe-connect`
3. Toggle **"Listen to events on Connected accounts"** (this is what populates `event.account` with the connected account ID — the handler ignores events without it).
4. Events to listen for:
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.voided`
   - `invoice.updated`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the signing secret → `STRIPE_CONNECT_WEBHOOK_SECRET` in Vercel (this is a *different* secret than `STRIPE_WEBHOOK_SECRET` — Connect webhook endpoints sign independently).

Once wired up, `trainer_client_invoices` and `trainer_client_subscriptions` stay in sync automatically — this powers the Paid/Overdue/Unpaid/None roster badges (CA-402) and the client detail invoice history (CA-403).

### Payouts & tax (CA-405)

Payouts, 1099-K reporting, and any sales/use tax on client payments are the trainer's own Stripe Express account's responsibility, not ZarcFit's — Stripe issues 1099-Ks directly to trainers who meet the reporting threshold, and [Stripe Tax](https://dashboard.stripe.com/settings/tax) can be enabled per-connected-account if a trainer needs to collect tax. ZarcFit does not calculate, collect, or remit tax on Connect payments, and this doc is not tax or legal advice.

**Deferred:** a platform fee (the invoice/subscription routes have comments marking exactly where to add `application_fee_amount` / `application_fee_percent` later).
