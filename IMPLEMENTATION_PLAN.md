# ZarcFit — Remaining Work

**Updated:** July 30, 2026  
**Related:** [STRIPE_SETUP.md](./STRIPE_SETUP.md) · [MIGRATION_RUNBOOK.md](./MIGRATION_RUNBOOK.md) · [PROJECT_AUDIT.md](./PROJECT_AUDIT.md)

Single backlog. Mark `[x]` when verified on staging/production.

**Effort:** `S` = ≤0.5 day · `M` = 1–2 days · `L` = 3–5 days · `XL` = 1+ week  
**ID prefixes:** `NG-` = launch/legacy · `PF-` = product feedback round (July 30)

---

# Part 1 — Launch gate (P0)

Manual Stripe Dashboard + Vercel steps. Code is already done.

| ID | Task | Effort | Status | Notes |
|----|------|--------|--------|-------|
| NG-201 | Stripe Dashboard products/prices | S | [ ] | New prices: Starter $29 / Growth $79 / Pro $149 — create in Stripe, set env vars |
| NG-203 | Webhook endpoint registration | S | [ ] | `/api/webhooks/stripe` |
| NG-204 | Enable Customer Portal | S | [ ] | Stripe → Billing → Customer portal |
| NG-206b | Prod checkout updates `trainer_profiles` | S | [ ] | Test card `4242…` after NG-201/203 |
| NG-207 | Enable Stripe Connect Express | S | [ ] | Stripe → Connect → Get started (Express) |
| QW-832 | Verify chat attachment upload in production | S | [ ] | Image in prod chat → `user-uploads` bucket |
| AI-901b | Add `OPENAI_API_KEY` to Vercel | S | [ ] | Optional — enables LLM meal/workout drafts |

---

# Part 2 — Product feedback round

## Phase A — Quick UI corrections (P1) ✅

All shipped. Dashboard name header, nav reorder, client status badges, meal builder template fixes.

## Phase B — Demo client (P1)

| ID | Task | Effort | Status | Notes |
|----|------|--------|--------|-------|
| PF-121 | Seed script | M | [x] | `npm run seed:demo-client -- --trainer you@example.com` |
| PF-122 | Populate demo data | M | [x] | |
| PF-123 | Walkthrough → collect your notes | S | [ ] | **Your turn** |
| PF-124 | Rework client detail from your notes | M | [ ] | Blocked on PF-123 |

## Phase C — Program builder rebuild (P1) ✅

Two-pane workspace: left = program (collapsible weeks/sessions), right = exercise database. Drag from library → session; reorder within session; Edit dialog for sets/reps/rest; generate draft + regenerate week preserved. Form videos on rows.

| ID | Task | Status |
|----|------|--------|
| PF-201–207 | dnd-kit two-pane builder | [x] |

## Phase D — Exercise form videos (P1) ✅

| ID | Task | Status | Notes |
|----|------|--------|-------|
| PF-211 | Curated YouTube URLs for seeded exercises | [x] | Applied to Supabase |
| PF-212 | Client workout "Watch form" modal | [x] | |
| PF-213 | Trainer builder video affordance | [x] | |
| PF-214 | Custom-exercise `video_url` field | [ ] | Deferred until custom exercise CRUD exists |

## Phase E — Client-first nutrition (P1) ✅

| ID | Task | Status |
|----|------|--------|
| PF-221–223 | Intake schema + onboarding + trainer edit | [x] |
| PF-231–235 | Client-scoped plans, macro step 1, flexible dieting, templates demoted | [x] |
| PF-241–244 | Dietary tags, chips, vegan validation, use_ai default | [x] |

**SQL applied:** `client-intake.sql`

## Phase F — Schedule as a calendar (P2) ✅

| ID | Task | Status | Notes |
|----|------|--------|-------|
| PF-301–305 | Month grid, +, block unavailable, week toggle, meeting link | [x] | |
| PF-306 | Google Calendar sync | [ ] | Deferred |
| PF-307 | Zoom / Calendly OAuth | [ ] | Deferred |

**SQL applied:** `calendar-unavailable.sql`

## Phase G — Billing & payments (P2) ✅ (MVP)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| PF-311 | Retier: 5 / 50 / 200 @ $29 / $79 / $149 | [x] | Create Stripe prices (NG-201) |
| PF-312 | Enforce clientLimit on invite | [x] | UI + RPC |
| PF-313 | Usage meter in Settings → Billing | [x] | |
| PF-314 | Multi-trainer seats | [ ] | Deferred |
| PF-321–323 | Stripe Connect Express + send invoice | [x] | Enable Connect in Dashboard (NG-207) |
| PF-324 | Payment status on roster | [x] | "Billing ready" badge (not full paid/overdue sync) |
| PF-325 | Payouts / tax docs | [ ] | Deferred |

**SQL applied:** `retier-subscription.sql`, `enforce-client-limit.sql`, `stripe-connect.sql`

Platform fee: **0%** for now (comment in invoice route marks where to add `application_fee_amount`).

---

# Part 3 — Still open (needs you)

| Item | Why |
|------|-----|
| PF-123 / PF-124 | Review demo client page and tell us what to change |
| NG-201 / 203 / 204 / 206b / 207 | Stripe Dashboard clicks |
| AI-901b | Optional OpenAI key on Vercel |
| QW-832 | Prod chat attachment smoke test |
| Seed demo client | `npm run seed:demo-client -- --trainer your@email.com` (needs `SUPABASE_SERVICE_ROLE_KEY`) |

---

# Part 4 — Deferred

| ID | Task |
|----|------|
| NG-503 | Web push |
| NG-505 | 2FA |
| NG-506 | Redis rate limiting |
| PF-306 / 307 | Calendar OAuth integrations |
| PF-314 | Multi-trainer teams |
| PF-325 | Payouts/tax documentation |
| PF-214 | Custom exercise CRUD + video field |

**Out of scope:** NG-601–605 · client AI coach · photo meal recognition · full RAG · AI message drafts

---

# Part 5 — Migrations applied this round (Supabase `zarcfit`)

1. `client_intake`
2. `calendar_unavailable`
3. `retier_subscription`
4. `stripe_connect_express_columns`
5. `enforce_client_limit`
6. `copy_nutrition_plan_type`
7. Exercise `video_url` UPDATEs (data)

---

# Part 6 — Recently completed

<details>
<summary>Shipped through product feedback round</summary>

- Phase A UI corrections (dashboard, nav, badges, meal builder)
- Demo client seed script
- Program builder two-pane drag-and-drop
- Exercise form videos (client + builder)
- Client intake onboarding + flexible dieting + AI dietary validation
- Trainer schedule month calendar + unavailable blocks + meeting links
- Tier retier, invite cap, usage meter, Stripe Connect invoice MVP
- 28 unit tests passing; production build clean

</details>

---

*Product feedback round largely complete July 30, 2026 — remaining items are manual Stripe setup + your demo-client walkthrough notes*
