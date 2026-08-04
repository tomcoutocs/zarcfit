# ZarcFit — Competitive Gap Backlog

**Updated:** August 3, 2026  
**Source:** [COMPETITIVE_AUDIT.md](./COMPETITIVE_AUDIT.md) · Related: [TODO.md](./TODO.md) · [STRIPE_SETUP.md](./STRIPE_SETUP.md)

Single backlog from the competitive audit. Mark `[x]` when done.  
**Effort:** `S` ≤0.5 day · `M` 1–2 days · `L` 3–5 days · `XL` 1+ week  
**IDs:** `CA-*` = competitive audit gaps

**Positioning:** Solo-coach workbench. Do **not** build white-label apps, multi-location, or multi-trainer orgs in this plan.

---

# Phase 0 — Launch billing (P0, mostly ops)

Code exists in `src/app/api/stripe/*`. Close the gate so the SaaS story is real.

| ID | Task | Effort | Status | Notes |
|----|------|--------|--------|-------|
| CA-001 | Stripe products/prices: Starter $29 / Growth $79 / Pro $149 | S | [ ] | Manual — Stripe Dashboard · [STRIPE_SETUP.md](./STRIPE_SETUP.md) |
| CA-002 | Env price IDs local + Vercel | S | [ ] | Manual |
| CA-003 | Webhook → `/api/webhooks/stripe` | S | [ ] | Manual (+ Connect webhook when CA-401 live) |
| CA-004 | Customer Portal + Connect Express enabled | S | [ ] | Manual |
| CA-005 | Prod checkout smoke test updates `trainer_profiles` | S | [ ] | Manual — card `4242…` |
| CA-006 | Optional: `OPENAI_API_KEY` on Vercel | S | [ ] | Manual |
| CA-007 | Prod chat attachment smoke test | S | [ ] | Manual |

**Acceptance:** Trainer can subscribe, manage billing, and open Connect onboarding in production.

---

# Phase 1 — Exercise library depth (P0)

| ID | Task | Effort | Status | Notes |
|----|------|--------|--------|-------|
| CA-101 | Expand seed to **300+** exercises | L | [x] | 356 in Supabase · `exercise-library-expansion.sql` |
| CA-102 | Curate `video_url` for new exercises | L | [x] | `exercise-video-urls-expansion.sql` · 356/356 with video |
| CA-103 | Trainer custom exercise CRUD + `video_url` | M | [x] | `/trainer/programs/exercises` · `custom-exercises.sql` |
| CA-104 | Builder library stays fast at 300+ | S | [x] | `@tanstack/react-virtual` in ExerciseLibraryPane |

**Acceptance:** Library ≥300 with videos; trainer can add a custom exercise with optional form link.

---

# Phase 2 — PWA + web push (P0)

| ID | Task | Effort | Status | Notes |
|----|------|--------|--------|-------|
| CA-201 | Web app manifest + icons + installability | M | [x] | `app/manifest.ts` + `public/icons/` |
| CA-202 | Service worker offline shell | M | [x] | `public/sw.js`, registered prod-only |
| CA-203 | Web push infrastructure | L | [x] | VAPID + `push_subscriptions` — run `web-push.sql` in Supabase |
| CA-204 | Preference toggles wired to push | S | [x] | Trainer + client prefs |

**Acceptance:** Installable PWA; client gets a push for a new trainer message (Chrome/Android).

**Setup still needed:** apply `src/lib/supabase/web-push.sql` in Supabase, then set
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` in Vercel (generate with
`npx web-push generate-vapid-keys`). Without these, push is a silent no-op — nothing breaks.

---

# Phase 3 — Weekly check-ins + adherence nudges (P1)

| ID | Task | Effort | Status | Notes |
|----|------|--------|--------|-------|
| CA-301 | Schema: `client_check_ins` | M | [x] | `client-check-ins.sql` applied |
| CA-302 | Client weekly check-in form + banner | M | [x] | `/client/check-in` + banner |
| CA-303 | Trainer view on client Overview | M | [x] | Last 5 check-ins card |
| CA-304 | Missed-check-in nudge | M | [x] | Client banner + notify on log |
| CA-305 | Trainer email digest (missed check-ins) | M | [x] | Dashboard button + Resend route |

**Acceptance:** Client submits weekly check-in; trainer sees it; missed week nudges.

---

# Phase 4 — Client payment maturity (P1)

| ID | Task | Effort | Status | Notes |
|----|------|--------|--------|-------|
| CA-401 | Sync invoice status via Connect webhooks | L | [x] | `trainer_client_invoices` — run `trainer-client-invoices.sql` + set `STRIPE_CONNECT_WEBHOOK_SECRET` |
| CA-402 | Roster badges: Paid / Overdue / Unpaid / None | M | [x] | Per-client badge on `/trainer/clients` |
| CA-403 | Client detail invoice history | M | [x] | Resend / void — Billing tab |
| CA-404 | Recurring client packages on Connect | L | [x] | 0% platform fee — `trainer_client_subscriptions` |
| CA-405 | Payouts/tax note in Settings + STRIPE_SETUP | S | [x] | |

**Acceptance:** Trainer sees overdue vs paid on roster; can create recurring client subscription.

---

# Phase 5 — Brand clarity + SEO (P1/P2)

| ID | Task | Effort | Status | Notes |
|----|------|--------|--------|-------|
| CA-501 | Unify About: platform + founder story | M | [x] | About + FAQ aligned |
| CA-502 | Flexible-dieting / macros-only marketing | S | [x] | `LandingNutrition` + FAQ |
| CA-503 | “Real cost” pricing comparison page | M | [x] | `/main/compare` |
| CA-504 | `sitemap.ts` + `robots.ts` | S | [x] | App Router MetadataRoute |
| CA-505 | Per-route OG/metadata for `/main/*` | M | [x] | about/plans/faq/compare |
| CA-506 | Comparison pages vs TrueCoach / Everfit | M | [x] | `/main/compare/truecoach` · `everfit` |

**Acceptance:** About is SaaS-first; sitemap crawlable; comparison page live.

---

# Phase 6 — Productize adaptive programming (P1)

| ID | Task | Effort | Status | Notes |
|----|------|--------|--------|-------|
| CA-601 | Adaptive Programming on client Overview | M | [x] | `AdaptiveProgrammingCard` on client Overview; regenerate-week preview dialog |
| CA-602 | Trainer digest: too hard/easy this week | M | [x] | `get_trainer_difficulty_digest` RPC + dashboard digest card |
| CA-603 | Suggest swap after 2+ hard ratings (preview) | M | [x] | `src/lib/ai/adaptive-suggestions.ts`, surfaced in the Overview card |
| CA-604 | Landing copy for adaptive loop | S | [x] | "Adaptive programming" capability card |

**Acceptance:** Rating-driven suggestions without hunting the builder; marketing names the feature.

---

# Out of scope

- White-label / branded native apps  
- Multi-trainer orgs / studio seats  
- Google Calendar / Zoom / Calendly OAuth (paste-link stays)  
- Client AI coach, photo meals, full RAG  
- Redis rate limiting, 2FA (post-launch)

---

# Sprint map

| Sprint | Focus | IDs |
|--------|-------|-----|
| 0 | Stripe/Connect launch gate | CA-001–007 |
| 1 | Library 300+ + custom exercises | CA-101–104 |
| 2 | PWA + push | CA-201–204 |
| 3 | Check-ins | CA-301–305 |
| 4 | Connect maturity | CA-401–405 |
| 5 | Brand + SEO | CA-501–506 |
| 6 | Adaptive programming | CA-601–604 |

---

*Replaces product-feedback backlog · competitive audit Aug 3, 2026*
