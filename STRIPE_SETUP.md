# Stripe Setup Guide (NG-201 – NG-204)

Complete these steps in the [Stripe Dashboard](https://dashboard.stripe.com) before enabling live billing.

## 1. Create products & prices (NG-201)

Create three recurring monthly products:

| Plan | Price | Env var |
|------|-------|---------|
| Starter | $29/mo | `NEXT_PUBLIC_STRIPE_PRICE_STARTER` |
| Growth | $59/mo | `NEXT_PUBLIC_STRIPE_PRICE_GROWTH` |
| Pro | $99/mo | `NEXT_PUBLIC_STRIPE_PRICE_PRO` |

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
