# Your checklist

Manual / decision items left after the product-feedback round. Code for Phases A–G is in `main`.

---

## Today / this week

- [ ] **Seed the demo client** (needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`)
  ```bash
  npm run seed:demo-client -- --trainer your@email.com
  ```
- [ ] **Walk `/trainer/clients/{demo-id}`** — Overview, Workouts, Nutrition, Progress, Notes — and write what you’d change
- [ ] **Click through the new UI locally** — dashboard name, sidebar order, program builder drag-and-drop, schedule month grid, Settings → Billing

---

## Stripe (launch blockers)

Do these in the [Stripe Dashboard](https://dashboard.stripe.com) before real checkouts:

- [ ] **Create products/prices** matching the new tiers
  - Starter — $29/mo — up to 5 clients
  - Growth — $79/mo — up to 50 clients
  - Pro — $149/mo — up to 200 clients
- [ ] **Put price IDs in env** (local + Vercel)
  - `NEXT_PUBLIC_STRIPE_PRICE_STARTER` / `STRIPE_PRICE_STARTER`
  - `NEXT_PUBLIC_STRIPE_PRICE_GROWTH` / `STRIPE_PRICE_GROWTH`
  - `NEXT_PUBLIC_STRIPE_PRICE_PRO` / `STRIPE_PRICE_PRO`
- [ ] **Register webhook** → `https://your-domain/api/webhooks/stripe`  
  Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] **Enable Customer Portal** (Billing → Customer portal)
- [ ] **Enable Connect Express** (Connect → Get started) so trainers can invoice clients
- [ ] **Smoke-test checkout** with card `4242 4242 4242 4242` and confirm `trainer_profiles` updates

Details: [STRIPE_SETUP.md](./STRIPE_SETUP.md)

---

## Optional but recommended

- [ ] Add `OPENAI_API_KEY` on Vercel (better AI workout/meal drafts)
- [ ] Prod smoke test: send a chat image attachment → lands in `user-uploads`
- [ ] Run Playwright E2E with real trainer + client test accounts (`E2E_*` in `.env`)

---

## Decisions (reply anytime — shapes later work)

- [ ] Confirm tier prices/caps feel right (or say what you want instead)
- [ ] Should ZarcFit ever take a % of client→trainer invoices? (currently **0%**)
- [ ] Multi-trainer / team seats — real near-term need, or later?
- [ ] Google Calendar / Zoom sync — wait until a paying trainer asks?

---

## Intentionally deferred (don’t block launch)

- Web push, 2FA, Redis rate limits  
- Google / Zoom / Calendly OAuth  
- Multi-trainer orgs  
- Custom exercise CRUD  
- Full paid/overdue invoice sync on the roster  

---

*See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the full backlog.*
