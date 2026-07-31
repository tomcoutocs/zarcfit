# Stripe Setup Guide (NG-201 – NG-204)

Complete these steps in the [Stripe Dashboard](https://dashboard.stripe.com) before enabling live billing.

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

## 6. Stripe Connect — trainer bills their clients (PF-321–324)

Separate from the subscription billing above. Trainers connect their own Stripe account and invoice their clients directly; ZarcFit takes **0% platform fee** on these payments (decision, July 30 2026).

1. Stripe → **Connect → Get started** → enable Express accounts for your platform.
2. No extra env vars needed — uses the same `STRIPE_SECRET_KEY`.
3. Run the SQL migrations (in order): `retier-subscription.sql`, `enforce-client-limit.sql`, `stripe-connect.sql`.
4. From a trainer account: Settings → Billing → "Connect Stripe to bill clients" → complete Express onboarding → land back on Settings, which re-checks status via `GET /api/stripe/connect/onboard`.
5. Once connected, use "Send Invoice" (Settings → Billing, or the client detail page) to email a one-off Stripe-hosted invoice.

**Deferred:** recurring per-client subscriptions, automatic paid/overdue sync on the roster (only a static "Billing ready" badge exists today), payouts/1099-K documentation, and a platform fee (the code has a comment marking exactly where to add `application_fee_amount` later).
