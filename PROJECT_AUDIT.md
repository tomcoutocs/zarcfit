# ZarcFit — Project Audit

**Audit date:** July 17, 2026  
**Baseline:** Pre-implementation audit (July 2026) · v2 commit `1392926` · v3 local (July 17, 2026)  
**Stack:** Next.js 15.2, React 19, TypeScript, Tailwind CSS, Supabase, TanStack Query, Sonner, Stripe (API)  
**Production:** [zarcfit.vercel.app](https://zarcfit.vercel.app) · Supabase project `emcxxlwklkmwuduywlna`

---

## Executive Summary

ZarcFit is a **feature-rich coach platform** (~93% MVP in code) after v2 P0 fixes and v3 quick wins + AI drafts. Client and trainer apps are largely complete with mobile navigation, CMS blog, messaging, nutrition/workout depth, Coral design refresh, and trainer-side draft generation.

**Launch gate:** Manual Stripe Dashboard setup (NG-201, NG-203, NG-204) and committing v3 local work to production.

Supabase migrations from the runbook were applied to production. Build and **19 unit tests** pass (July 17, 2026).

| Area | Maturity | Status |
|------|----------|--------|
| Client app | **93%** | Program picker, onboarding checklist, chat empty states |
| Trainer portal | **96%** | AI draft buttons, client summary, adherence widget |
| Admin | **92%** | Mobile nav |
| Marketing | **95%** | Hallmark landing + split-pill nav (local) |
| Auth & roles | **92%** | Coral auth shell; middleware solid |
| Database / SQL | **90%** | Migrations applied; +27 exercises in seed |
| Stripe / billing | **85%** | Code wired; Dashboard manual steps open |
| Messaging | **90%** | Attachments fixed (v2); prod verify pending |
| Notifications | **75%** | Realtime + prefs; web push deferred |
| AI / generation | **75%** | Rules/skeleton drafts; LLM optional |
| Testing & CI | **80%** | 19 unit + 8 E2E smoke |
| Security | **92%** | API routes auth-guarded (v2) |
| **Overall MVP** | **~93%** | Stripe Dashboard + commit v3 to go live |

---

## Architecture

### App routes (47 pages)

| Zone | Routes | Notes |
|------|--------|-------|
| Landing | `/` | Marketing homepage with animations |
| Marketing | `/main/plans`, `/main/blog`, `/main/blog/[slug]`, `/main/about`, `/main/contact`, `/main/faq` | Blog CMS-connected |
| Legal | `/terms`, `/privacy` | Static |
| Auth | `/auth/*` (7 routes) | Login, signup, reset, callback, invitation accept |
| Client | `/client/*` (9 routes) | Dashboard, workout, meal-plan, sleep, goals, progress, calendar, chat, profile |
| Trainer | `/trainer/*` (11 routes) | Dashboard, clients, programs, meal-plans, messages, schedule, settings |
| Admin | `/admin/*` (9 routes) | Blog CMS, users, contact inbox, settings |

Legacy redirects in `next.config.ts`: `/dashboard/*` → `/client/*`, `/main/programs` and `/main/coaching` → `/main/plans`.

### API routes (8)

| Route | Auth | Rate limit | Status |
|-------|------|------------|--------|
| `/api/food/search` | Public | ✅ 30/min/IP | ✅ Working |
| `/api/health-import` | API key | ✅ Strict | ✅ Working |
| `/api/sleep-records` | Session | — | ✅ Working |
| `/api/invitations/send-email` | **None** | — | ⚠️ P0 — open invite spam |
| `/api/notifications/send-email` | **None** | — | ⚠️ P0 — open email relay |
| `/api/stripe/checkout` | **None** | — | ⚠️ P0 — anyone can create sessions |
| `/api/stripe/portal` | **None** | — | ⚠️ P0 |
| `/api/webhooks/stripe` | Signature (broken) | — | ⚠️ P0 — no verify, wrong DB lookup |

Middleware (`src/middleware.ts`) guards `/trainer`, `/client`, `/admin` by role. All `/api/*` routes bypass auth checks.

---

## What's Complete (production-quality)

### Client app
- Workout logging, history tab auto-switch, analytics (volume + PRs)
- Meal plan weekly view, daily diary, serving size picker, copy meal, favorites
- Sleep tracking, goals, progress photos + side-by-side compare
- Calendar week/day views, session requests with trainer availability
- Chat: text, typing indicators, search, read receipts, optimistic send
- Profile: notification/privacy/unit preferences
- Mobile: 5-tab bottom bar + More drawer, unread message badges

### Trainer portal
- Client roster, detail views, quick actions, bulk pause/message
- Program + meal plan builders, duplicate templates, assign to clients
- Messaging, schedule, settings (incl. billing UI)
- Mobile nav, dashboard stats + client activity feed
- Invitation flow with email API + manual link fallback

### Admin & marketing
- Blog CMS → public `/main/blog` list + slug detail pages
- Contact form → admin contact inbox
- Admin user management

### Infrastructure
- `MIGRATION_RUNBOOK.md` (34 ordered SQL files) — in git at `388b066`
- GitHub Actions CI: lint + test + build
- Vitest + Playwright smoke scaffold
- React Query provider, Sonner toasts, loading skeletons on dashboards
- Rate limiting on food search + health import

---

## P0 Blockers (must fix before launch)

### 1. Message attachments use wrong storage bucket

```52:61:src/lib/supabase/storage.ts
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
```

`storage-schema.sql` creates only the `user-uploads` bucket. Profile uploads correctly use `user-uploads`; message attachments target a non-existent `avatars` bucket. **Fix:** Use `user-uploads` with path `messages/{userId}/...` or align schema + RLS.

### 2. Stripe webhook broken

```42:51:src/app/api/webhooks/stripe/route.ts
    if (email && customerId) {
      await admin
        .from('trainer_profiles')
        .update({ ... })
        .eq('email', email);
```

Problems:
- `trainer_profiles` has no `email` column — lookup never matches
- Signature header is read but **never verified** (`webhookSecret` unused)
- All subscriptions hardcoded to `subscription_tier: 'pro'`
- No handling for `customer.subscription.updated/deleted`

**Fix:** Lookup trainer via `auth.users` email → `trainer_profiles.id`; verify with Stripe SDK; map price ID → tier.

### 3. Unauthenticated API routes

| Route | Risk |
|-------|------|
| `/api/invitations/send-email` | Anyone can trigger Supabase invite emails |
| `/api/notifications/send-email` | Open Resend relay if key configured |
| `/api/stripe/checkout` | Session creation without login |
| `/api/stripe/portal` | Portal access without login |

**Fix:** Require authenticated trainer session; validate caller owns the resource.

---

## P1 Gaps (high priority)

| Gap | Location | Notes |
|-----|----------|-------|
| Billing copy conflict | `plans/page.tsx:61` vs `faq/page.tsx:122` | Plans says "coming soon"; FAQ promises live Stripe |
| Stripe env naming | `trainer-plans.ts:14-25` vs `.env.example` | `growth` maps to `STRIPE_PRICE_PRO`; no `STRIPE_PRICE_GROWTH` |
| Stripe Dashboard unset | External | ZF-1001 — products/prices/webhook endpoint |
| `run-migrations.sh` drift | Missing 2 files vs runbook | `message-attachments.sql`, `session-request-notifications.sql` |
| `SUPABASE_SETUP.md` stale | Lines 52-57 | Still documents 2-file migration only |
| Admin no mobile nav | `admin/layout.tsx` | Fixed sidebar only |
| Minimal test coverage | `__tests__/lib.test.ts` (2 tests) | No auth helpers, API, or E2E auth flows |
| Docs deleted locally | git status | `IMPLEMENTATION_PLAN.md`, `MIGRATION_RUNBOOK.md`, audit files marked deleted |
| Orphaned email API | `notifications/send-email/route.ts` | No callers in app code |
| In-memory rate limiter | `rate-limit.ts` | Resets on serverless cold start |

---

## P2 Polish (post-MVP)

| Item | Location / ID |
|------|---------------|
| Web push notifications | NG-503 (was ZF-803) |
| Accessibility pass | NG-504 (was ZF-1107) |
| Two-factor authentication | `profile/page.tsx:367` stub |
| FAQ search + categories | `faq/page.tsx:25-37` UI only |
| Enterprise integrations | `trainer-plans.ts:84` copy stub |
| Redis-backed rate limiting | Scale concern |
| Playwright in CI | `.github/workflows/ci.yml` |

---

## Database Status

**34 SQL files** in `src/lib/supabase/`. Production migrations applied July 16, 2026:

- Core schema (via earlier Supabase migrations)
- New: `blog-slug`, `user-preferences`, `meal-favorites`, `stripe-subscriptions`, `session-request-notifications`, `avatars` storage bucket

### Verification checklist (run in SQL Editor)

```sql
-- Tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename IN ('meal_favorites', 'user_notifications', 'messages', 'session_requests');

-- New columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'messages' AND column_name IN ('attachment_url', 'message_type');

-- RPCs
SELECT proname FROM pg_proc WHERE proname IN (
  'get_client_unread_message_count',
  'get_trainer_dashboard_stats',
  'notify_session_request_status'
);
```

---

## Security Summary

| Control | Status |
|---------|--------|
| Supabase RLS on core tables | ✅ |
| Middleware role guards | ✅ |
| API route authentication | ❌ 4 routes open |
| Stripe webhook verification | ❌ |
| Rate limiting (food, health) | ✅ In-memory |
| Service role server-only | ✅ |
| Env validation at build | ⚠️ Warns only |

---

## Testing & CI

| Asset | Coverage |
|-------|----------|
| `src/__tests__/lib.test.ts` | `slugifyTitle`, `rateLimit` (2 tests) |
| `e2e/smoke.spec.ts` | Landing + login page load |
| `.github/workflows/ci.yml` | lint, test, build — **no E2E** |
| `@testing-library/react` | In deps, unused |

---

## Stubs & Deferred UI

| Location | Finding |
|----------|---------|
| `client/profile/page.tsx:367` | "Coming Soon" — Two-Factor Authentication |
| `trainer-plans.ts:84` | "Custom integrations (coming soon)" |
| `plans/page.tsx:61` | "Paid subscriptions... coming soon" (conflicts with checkout code) |
| `faq/page.tsx:25` | Search input — no filter logic |

No `TODO`/`FIXME` comments in `src/`.

---

## Build & Deploy

- ✅ `npm run build` — passes (2 non-blocking ESLint warnings in Aurora/GradientText)
- ✅ `npm run test` — 2 Vitest tests pass
- ✅ Supabase migrations applied to prod
- ⚠️ Stripe env vars not configured in Vercel
- ⚠️ P0 bugs block feature verification in prod

---

## Recommended Path to MVP Launch

1. **Fix P0 blockers** — storage bucket, Stripe webhook, API auth (Phase 1 in new plan)
2. **Configure Stripe** — Dashboard products, env vars, webhook endpoint (Phase 2)
3. **Align billing copy** — FAQ + plans page consistency (Phase 2)
4. **Restore/sync docs** — runbook, setup guide (Phase 3)
5. **Expand tests + admin mobile** — regression safety (Phase 4)
6. **Staging smoke test** — login, invite, workout log, chat attachment, checkout
7. **Production deploy**

---

## Document History

| Document | Status |
|----------|--------|
| `PROJECT_AUDIT.md` (this file) | Current audit — July 16, 2026 |
| `IMPLEMENTATION_PLAN.md` | New plan — see companion doc |
| `PROJECT_AUDIT_POST_IMPLEMENTATION.md` | Superseded by this audit |
| Pre-implementation `PROJECT_AUDIT.md` (baseline) | Historical reference in git history |

---

*Next: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)*
