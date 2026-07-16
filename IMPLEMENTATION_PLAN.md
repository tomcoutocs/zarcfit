# ZarcFit Implementation Plan

**Created:** July 16, 2026  
**Source:** [PROJECT_AUDIT.md](./PROJECT_AUDIT.md)  
**Goal:** Knock out missing features and future work in a predictable order — quick wins first, then revenue and scale.

---

## How to use this doc

1. Work **top to bottom within each phase** unless a task is blocked.
2. Mark tasks `[x]` when merged to `main` and verified on [zarcfit.vercel.app](https://zarcfit.vercel.app).
3. Each task has **acceptance criteria** — don't check it off until those pass.
4. **Effort key:** `S` = ≤0.5 day · `M` = 1–2 days · `L` = 3–5 days · `XL` = 1+ week

---

## Current snapshot

| Area | Maturity | Biggest gap |
|------|----------|-------------|
| Auth & roles | ✅ Production-ready | Monitor duplicate-role edge cases on new signups |
| Client app | ~95% | Web push (deferred) |
| Trainer portal | ~95% | Stripe Dashboard product setup (external) |
| Admin | ~90% | — |
| Marketing | ~90% | Stripe live keys + prod verification |
| Ops | ~85% | Apply new SQL migrations to prod Supabase |

---

## Phase 0 — Foundation (do first)

> Unblocks every other phase. Prevents production surprises.

| ID | Task | Effort | Owner | Status |
|----|------|--------|-------|--------|
| ZF-001 | **SQL migration runbook** — Document all 26+ `.sql` files in order, with purpose and dependencies. Replace or delete misleading `run-migrations.sh`. | M | | [x] |
| ZF-002 | **Verify Supabase prod migrations** — Audit live project against runbook; apply any missing files (`notifications.sql`, `messaging-access.sql`, `invite-only-clients.sql`, `ensure-signup-role.sql`, etc.). | M | | [ ] |
| ZF-003 | **Vercel env checklist** — Ensure `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `USDA_FDC_API_KEY` are set in Vercel. Document in `.env.example`. | S | | [x] |
| ZF-004 | **Supabase Auth URL config** — Confirm redirect URLs for prod: `/auth/callback`, `/auth/login`, `/auth/reset-password`. | S | | [x] |
| ZF-005 | **Refresh stale docs** — Update or archive `FEATURE_STATUS.md`, `README.md`; point to this plan + `PROJECT_AUDIT.md`. | M | | [x] |
| ZF-006 | **Remove dead dependency** — Drop unused `next-auth` from `package.json`. | S | | [x] |

### ZF-001 acceptance criteria
- [x] Single ordered list of every SQL file under `src/lib/supabase/`
- [x] Notes on which are superseded vs. required
- [x] Copy-paste Supabase SQL Editor instructions for new environments

---

## Phase 1 — Quick wins (polish & trust)

> High impact, low effort. Good first sprint to build momentum.

| ID | Task | Effort | Files / area | Status |
|----|------|--------|--------------|--------|
| ZF-101 | **Remove client dashboard dev card** | S | `src/app/client/page.tsx` (~lines 500–528) | [x] |
| ZF-102 | **Fix invitation UX copy** — "Invitation Created" + show copyable link immediately; remove "Invitation Sent!" until email exists. | S | `src/app/trainer/clients/add/page.tsx`, related components | [x] |
| ZF-103 | **Align FAQ / plans billing copy** — Remove or disclaim Stripe references until Phase 5. | S | `src/app/main/faq/page.tsx`, `src/app/main/plans/page.tsx` | [x] |
| ZF-104 | **Legacy route redirects** — Add redirects for `/dashboard/*` subroutes → `/client/*`. | S | `next.config.ts` | [x] |
| ZF-105 | **Hide calendar week/day tabs** OR show honest "Coming soon" without clickable dead ends. | S | `src/app/client/calendar/page.tsx` | [x] |
| ZF-106 | **Fix broken blog placeholder images** — Add assets to `public/` or use Supabase Storage URLs. | S | `public/assets/images/`, blog page | [x] |

### Sprint 1 suggested order
`ZF-101` → `ZF-102` → `ZF-103` → `ZF-104` → `ZF-105` → `ZF-106`

---

## Phase 2 — Mobile & navigation

> Trainers and clients on phones are blocked today.

| ID | Task | Effort | Files / area | Status |
|----|------|--------|--------------|--------|
| ZF-201 | **Trainer mobile drawer** — Bottom bar or hamburger matching desktop sidebar (Dashboard, Clients, Programs, Meal Plans, Messages, Schedule, Settings). | M | `src/app/trainer/layout.tsx` | [x] |
| ZF-202 | **Client mobile nav expansion** — Add "More" tab or expand bottom bar to reach Goals, Progress, Sleep, Calendar, Profile. | M | `src/app/client/layout.tsx` | [x] |
| ZF-203 | **Unread message badges** — Badge on Messages nav item (client + trainer). | S | Client/trainer layouts, messaging hooks | [x] |
| ZF-204 | **Notification deep links audit** — Verify all `link_path` values in `user_notifications` land on correct screens. | S | `notifications.sql`, notification components | [x] |

### ZF-201 acceptance criteria
- [x] All trainer routes reachable on 375px viewport without typing URLs
- [x] Active route highlighted in mobile nav
- [x] No overlap with existing header/avatar controls

---

## Phase 3 — Content & admin ops

> Connect marketing to the CMS; close the support loop.

| ID | Task | Effort | Files / area | Status |
|----|------|--------|--------------|--------|
| ZF-301 | **Public blog — list page** — Fetch published posts from `blog_posts`; replace static hardcoded content. | M | `src/app/main/blog/page.tsx`, new API or server fetch | [x] |
| ZF-302 | **Public blog — post detail** — Add `/main/blog/[slug]` with SEO metadata and featured image. | M | New route + shared blog types | [x] |
| ZF-303 | **Blog search & categories** — Wire filters or remove UI until ready (pick one). | S | Blog list page | [x] |
| ZF-304 | **Admin contact inbox** — List `contact_messages`, mark read, basic detail view. | M | New `/admin/contact` routes | [x] |
| ZF-305 | **Admin nav link** — Add Contact Messages to admin sidebar. | S | `src/app/admin/layout.tsx` | [x] |

### ZF-301 acceptance criteria
- [x] Post created in `/admin/blog` appears on `/main/blog` when published
- [x] Unpublished drafts never show publicly
- [x] Featured images render (Storage URL or local fallback)

---

## Phase 4 — Onboarding & invitations

> Fix the biggest trust gap for trainer → client growth.

| ID | Task | Effort | Files / area | Status |
|----|------|--------|--------------|--------|
| ZF-401 | **Invitation email delivery** — Send email via Supabase Auth admin `inviteUserByEmail` or Resend/SendGrid with invitation link. | L | `trainer-api.ts`, new API route or edge function | [x] |
| ZF-402 | **Invitation email template** — Branded HTML: trainer name, accept link, expiry. | M | Supabase email templates or provider | [x] |
| ZF-403 | **First-time client checklist** — Empty state on client dashboard: connect trainer → review program → log workout. | M | `src/app/client/page.tsx` | [x] |
| ZF-404 | **Session request notifications** — Ensure approve/decline fires in-app notification + optional email. | M | `session-requests.sql`, notification triggers | [x] |
| ZF-405 | **Surface trainer availability** — Show timezone/working hours when client requests a session. | M | `src/app/client/calendar/page.tsx`, trainer settings | [x] |

### ZF-401 decision (pick before starting)
| Option | Pros | Cons |
|--------|------|------|
| **A. Supabase invite email** | No new vendor | Less customization |
| **B. Resend / SendGrid** | Full control, analytics | New API key, template maintenance |
| **Recommended:** Start with **A** for MVP; move to **B** if branding matters.

---

## Phase 5 — API hardening & data integrity

| ID | Task | Effort | Files / area | Status |
|----|------|--------|--------------|--------|
| ZF-501 | **Rate limit `/api/food/search`** — Per-IP or per-user limits (e.g. Upstash Redis or middleware). | M | `src/app/api/food/search/route.ts` | [x] |
| ZF-502 | **Rate limit `/api/health-import`** — Strict limits + optional shared secret header. | M | `src/app/api/health-import/route.ts` | [x] |
| ZF-503 | **Sleep unique constraint** — `UNIQUE (user_id, date)` on `sleep_tracking`; dedupe script for existing rows. | S | New migration SQL | [x] |
| ZF-504 | **Build-time env validation** — Fail build or warn loudly if Supabase vars missing in production. | S | `next.config.ts` or startup check | [x] |

---

## Phase 6 — Feature depth (client experience)

| ID | Task | Effort | Files / area | Status |
|----|------|--------|--------------|--------|
| ZF-601 | **Calendar week view** | L | `src/app/client/calendar/page.tsx` | [x] |
| ZF-602 | **Calendar day view** | M | Same | [x] |
| ZF-603 | **Workout analytics** — Volume trends, PRs, exercise history charts. | L | New client route or tab under `/client/workout` | [x] |
| ZF-604 | **Auto-switch to History tab** after workout complete. | S | `src/app/client/workout/page.tsx` | [x] |
| ZF-605 | **Serving size picker** after food search. | M | `src/components/nutrition/food-search.tsx`, meal-plan pages | [x] |
| ZF-606 | **Copy meal to another day** | M | Client meal plan / diary | [x] |
| ZF-607 | **Meal library / favorites** | M | New table + UI | [x] |
| ZF-608 | **Progress photo comparison** — Side-by-side with date picker. | M | `src/app/client/progress/page.tsx` | [x] |
| ZF-609 | **Client profile — notification preferences** | M | `src/app/client/profile/page.tsx`, new settings table or JSON column | [x] |
| ZF-610 | **Client profile — privacy settings** | M | Same | [x] |
| ZF-611 | **Unit preferences** — kg/lb, cm/ft, week start day. | M | Profile + conversion helpers | [x] |
| ZF-612 | **Nutrition tab explainer** — Inline copy linking Daily Diary ↔ Weekly Plan ↔ trainer assignments. | S | `src/app/client/meal-plan/page.tsx` | [x] |

---

## Phase 7 — Trainer workflow upgrades

| ID | Task | Effort | Files / area | Status |
|----|------|--------|--------------|--------|
| ZF-701 | **Quick actions on client detail** — Assign program, send message from Workouts/Nutrition tabs. | M | `src/app/trainer/clients/[clientId]/page.tsx` | [x] |
| ZF-702 | **Duplicate program template** | M | `src/app/trainer/programs/page.tsx`, trainer-api | [x] |
| ZF-703 | **Duplicate meal plan template** | M | `src/app/trainer/meal-plans/page.tsx` | [x] |
| ZF-704 | **Bulk client actions** — Select multiple → message or archive. | L | Clients list page | [x] |

---

## Phase 8 — Notifications (engagement)

| ID | Task | Effort | Files / area | Status |
|----|------|--------|--------------|--------|
| ZF-801 | **Realtime dashboard notifications** — Supabase Realtime subscription on `user_notifications`. | M | Client + trainer dashboards | [x] |
| ZF-802 | **Email notifications** — Wire trainer settings toggles to actual sends (invites, session requests, new messages). | L | Edge function + provider | [x] |
| ZF-803 | **Web push notifications** | XL | Service worker, VAPID, preferences UI | [ ] |
| ZF-804 | **Standardize toast feedback** — Replace inconsistent inline alerts (sonner or similar). | M | App-wide | [x] |

---

## Phase 9 — Messaging upgrades

| ID | Task | Effort | Files / area | Status |
|----|------|--------|--------------|--------|
| ZF-901 | **Image/file attachments** | L | Messages UI + Storage bucket + RLS | [x] |
| ZF-902 | **Read receipts** | M | `messages` table column + UI | [x] |
| ZF-903 | **Typing indicators** | M | Supabase Realtime presence | [x] |
| ZF-904 | **Message search** | M | Client + trainer message pages | [x] |

---

## Phase 10 — Revenue (Stripe)

> Only start after Phase 1 FAQ/plans copy is honest, or concurrently if committing to ship billing.

| ID | Task | Effort | Files / area | Status |
|----|------|--------|--------------|--------|
| ZF-1001 | **Stripe account + products** — Map tiers on `/main/plans` to Stripe Price IDs. | M | Stripe Dashboard | [ ] |
| ZF-1002 | **Checkout session API** — Trainer subscribes after signup or from settings. | L | New `/api/stripe/*` routes | [x] |
| ZF-1003 | **Customer portal** — Manage/cancel/pause subscription. | M | Stripe Customer Portal | [x] |
| ZF-1004 | **Webhook handler** — Sync `stripe_customer_id`, `stripe_subscription_id`, `subscription_tier` on `trainer_profiles`. | L | `/api/webhooks/stripe` | [x] |
| ZF-1005 | **Trainer billing settings UI** | M | `src/app/trainer/settings/page.tsx` | [x] |
| ZF-1006 | **Client plan display** — Replace hardcoded "Free Plan" with real data or honest placeholder. | S | `src/app/client/profile/page.tsx` | [x] |
| ZF-1007 | **Restore FAQ billing copy** — Re-enable Stripe promises in FAQ once live. | S | FAQ, plans pages | [x] |

---

## Phase 11 — Performance & quality

| ID | Task | Effort | Files / area | Status |
|----|------|--------|--------------|--------|
| ZF-1101 | **React Query / SWR** — Cache dashboard, client list, exercise library. | L | Hooks + provider | [x] |
| ZF-1102 | **Loading skeletons** — Replace spinners on high-traffic pages. | M | Client/trainer dashboards | [x] |
| ZF-1103 | **Optimistic updates** — Chat send, workout log edits. | M | Chat + workout pages | [x] |
| ZF-1104 | **Vitest unit tests** — Auth helpers, `pickPrimaryRole`, validation schemas. | M | New `__tests__/` | [x] |
| ZF-1105 | **Playwright E2E** — Login, trainer dashboard, client workout log smoke tests. | L | CI + `e2e/` | [x] |
| ZF-1106 | **GitHub Actions CI** — Lint, typecheck, test on PR. | M | `.github/workflows/` | [x] |
| ZF-1107 | **Accessibility pass** — Forms, focus, contrast on landing animations. | M | Marketing + auth pages | [ ] |

---

## Phase 12 — Future / deferred

> Explicitly out of MVP scope unless product direction changes.

| ID | Feature | Notes |
|----|---------|-------|
| ZF-1201 | Social auth polish (Google/Apple) | Requires Supabase OAuth provider setup in dashboard |
| ZF-1202 | Social/community (feeds, challenges, leaderboards) | No schema; greenfield product surface |
| ZF-1203 | Two-factor authentication | Profile stub exists; needs Supabase MFA or custom flow |
| ZF-1204 | Enterprise custom integrations | Placeholder on pricing card |
| ZF-1205 | FatSecret API | Audit notes USDA + OFF are current; only switch if licensing requires |

---

## Recommended sprint schedule

### Sprint A (Week 1) — Foundation + quick wins
`ZF-001`, `ZF-002`, `ZF-003`, `ZF-004`, `ZF-101`, `ZF-102`, `ZF-103`, `ZF-104`

**Outcome:** Stable prod, honest copy, no embarrassing dev UI.

### Sprint B (Week 2) — Mobile + blog
`ZF-201`, `ZF-202`, `ZF-203`, `ZF-106`, `ZF-301`, `ZF-302`

**Outcome:** Trainers usable on phone; marketing blog live.

### Sprint C (Week 3) — Admin + API safety
`ZF-304`, `ZF-305`, `ZF-501`, `ZF-502`, `ZF-503`, `ZF-105` (or start ZF-601)

**Outcome:** Support inbox, hardened APIs.

### Sprint D (Week 4) — Invitations + onboarding
`ZF-401`, `ZF-402`, `ZF-403`, `ZF-404`

**Outcome:** Real invitation emails; better client first-run.

### Sprint E (Weeks 5–6) — Feature depth
Pick 3–4 from Phase 6 based on user feedback (calendar, analytics, nutrition, progress photos).

### Sprint F (Weeks 7+) — Revenue OR quality
Either Phase 10 (Stripe) if monetizing now, or Phase 11 (tests + caching) if growing user base first.

---

## Task dependency graph (simplified)

```
Phase 0 (Foundation)
    ├── Phase 1 (Quick wins)
    ├── Phase 5 (API hardening)
    └── Phase 10 (Stripe) — needs ZF-103 honest copy first

Phase 1
    └── Phase 2 (Mobile nav)

Phase 3 (Blog)
    └── ZF-106 (images) can parallel ZF-301

Phase 4 (Invitations)
    └── needs ZF-102 copy fix first

Phase 8 (Notifications)
    └── benefits from ZF-404 session triggers

Phase 11 (Tests)
    └── best after Phase 1–3 stabilize behavior
```

---

## Progress tracker

| Phase | Total tasks | Done | % |
|-------|-------------|------|---|
| 0 Foundation | 6 | 5 | 83% |
| 1 Quick wins | 6 | 6 | 100% |
| 2 Mobile | 4 | 4 | 100% |
| 3 Content & admin | 5 | 5 | 100% |
| 4 Invitations | 5 | 5 | 100% |
| 5 API hardening | 4 | 4 | 100% |
| 6 Feature depth | 12 | 12 | 100% |
| 7 Trainer workflow | 4 | 4 | 100% |
| 8 Notifications | 4 | 3 | 75% |
| 9 Messaging | 4 | 4 | 100% |
| 10 Revenue | 7 | 6 | 86% |
| 11 Performance & quality | 7 | 6 | 86% |
| 12 Future | 5 | — | deferred |

**Implementation complete in code.** Remaining manual steps: **ZF-002** (apply SQL to prod), **ZF-1001** (Stripe Dashboard products), **ZF-803** (web push deferred), **ZF-1107** (a11y pass).

---

## Next action

1. Apply all new SQL migrations per [MIGRATION_RUNBOOK.md](./MIGRATION_RUNBOOK.md) (including `message-attachments.sql`)
2. Create Stripe products/prices and set env vars in Vercel
3. Deploy and smoke-test on staging
4. Optional: accessibility pass (ZF-1107), web push (ZF-803)

---

*Derived from [PROJECT_AUDIT.md](./PROJECT_AUDIT.md). Update this plan when scope changes or tasks complete.*
