# Your checklist

Synced to [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) (competitive gap backlog).

---

## Phase 0 — Launch billing (do these in Stripe / Vercel)

Code is ready; these are **manual Dashboard / env** steps:

- [ ] **CA-001** Create products/prices: Starter $29 · Growth $79 · Pro $149
- [ ] **CA-002** Put price IDs in `.env.local` + Vercel  
  `NEXT_PUBLIC_STRIPE_PRICE_STARTER` / `GROWTH` / `PRO` (and server `STRIPE_PRICE_*`)
- [ ] **CA-003** Webhook → `https://your-domain/api/webhooks/stripe`  
  Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] **CA-003b** Connect webhook → `/api/webhooks/stripe-connect` + `STRIPE_CONNECT_WEBHOOK_SECRET`  
  (invoice + subscription events — see [STRIPE_SETUP.md](./STRIPE_SETUP.md))
- [ ] **CA-004** Enable Customer Portal + Connect Express
- [ ] **CA-005** Smoke-test checkout with `4242…` → `trainer_profiles` updates
- [ ] **CA-006** (Optional) `OPENAI_API_KEY` on Vercel
- [ ] **CA-007** Prod chat image → `user-uploads` bucket
- [ ] **Push** Set Vercel `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`  
  (`npx web-push generate-vapid-keys`)

Details: [STRIPE_SETUP.md](./STRIPE_SETUP.md)

---

## Code backlog status

| Phase | Status |
|-------|--------|
| 1 Exercise library 300+ + custom CRUD | Done (356 exercises, virtualized builder, `/trainer/programs/exercises`) |
| 2 PWA + web push | Done (apply `web-push.sql` ✓ · set VAPID in Vercel) |
| 3 Weekly check-ins | Done |
| 4 Connect invoice sync + recurring | Done (set Connect webhook secret) |
| 5 Brand + SEO | Done |
| 6 Adaptive programming productization | Done |

---

## Out of scope for now

White-label apps · multi-trainer orgs · Google/Zoom OAuth · client AI coach

---

*Full backlog: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) · Audit: [COMPETITIVE_AUDIT.md](./COMPETITIVE_AUDIT.md)*
