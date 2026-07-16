# ZarcFit — Full Project Audit

**Audit date:** July 16, 2026  
**Scope:** Codebase review only — no changes made  
**Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase (Auth, Postgres, Storage, Realtime)

---

## Executive Summary

ZarcFit has evolved from a consumer fitness tracker into a **trainer–client coaching platform**. The core product is largely functional: authentication, role-based routing, client tracking (workouts, nutrition, sleep, goals, progress), trainer tooling (programs, meal plans, messaging, scheduling), and an admin panel are wired to Supabase.

The main gaps fall into four buckets:

1. **Incomplete or placeholder UI** — calendar views, profile security/preferences, billing, public blog
2. **Ops / production hardening** — migration coverage, rate limiting, tests, API security polish
3. **UX friction** — mobile navigation, misleading copy, dev-only UI shown to users, broken marketing assets
4. **Documentation drift** — several markdown files describe an older `/dashboard/*` app state

Overall maturity: **~75–80% of an MVP coach platform**, with polish and monetization still ahead.

---

## Architecture Overview

| Area | Routes | Status |
|------|--------|--------|
| Marketing | `/`, `/main/*`, `/terms`, `/privacy` | Mostly complete |
| Auth | `/auth/*` | Complete |
| Client app | `/client/*` | Largely complete |
| Trainer portal | `/trainer/*` | Largely complete |
| Admin | `/admin/*` | Partial (no contact inbox) |
| API routes | `/api/food/search`, `/api/health-import`, `/api/sleep-records` | Partial hardening |

**Roles:** `admin`, `trainer`, `client` — enforced in middleware via `user_roles`.

**Canonical client routes:** `/client/*` (legacy `/dashboard` redirects to `/client` only at the root).

---

## What Is Fully Implemented

### Authentication & onboarding
- Email/password login, signup, forgot/reset password, email verification
- Trainer-only public signup (`/auth/signup` always creates trainer accounts)
- Client onboarding via invitation token (`/auth/accept-invitation`)
- Role-based middleware and protected layouts
- Global error boundaries (`error.tsx`, `global-error.tsx`)

### Client features (`/client/*`)
| Feature | Route | Backend | Notes |
|---------|-------|---------|-------|
| Dashboard overview | `/client` | ✅ | Goals, events, trainer card, notifications |
| Workout logging | `/client/workout` | ✅ | Today's workout, history, assigned programs |
| Meal planning | `/client/meal-plan` | ✅ | Weekly plan + daily food diary tabs |
| Sleep tracking | `/client/sleep` | ✅ | Full CRUD, charts, stats |
| Goals | `/client/goals` | ✅ | CRUD with progress bars |
| Progress | `/client/progress` | ✅ | Measurements, weight chart, photo upload |
| Calendar | `/client/calendar` | ✅ | Month view, events, session requests |
| Chat | `/client/chat` | ✅ | Realtime messaging with trainers |
| Profile | `/client/profile` | ⚠️ | Avatar, health import; several tabs stubbed |

### Trainer features (`/trainer/*`)
| Feature | Route | Backend | Notes |
|---------|-------|---------|-------|
| Dashboard | `/trainer/dashboard` | ✅ | Live stats, activity feed, notifications |
| Clients | `/trainer/clients` | ✅ | Roster, invitations, client detail tabs |
| Programs | `/trainer/programs` + builder | ✅ | Templates, assignment, exercise library |
| Meal plans | `/trainer/meal-plans` + editor | ✅ | Templates, assignment, food search |
| Messages | `/trainer/messages` | ✅ | Realtime chat |
| Schedule | `/trainer/schedule` | ✅ | Events + session request approve/decline |
| Settings | `/trainer/settings` | ✅ | Profile, avatar, booking preferences |

### Admin (`/admin/*`)
- Real stats via `get_admin_stats()` RPC
- Blog CRUD (backed by `blog_posts` table)
- User management (grant/revoke roles)
- Password change in settings

### Integrations
- **Food search:** USDA FoodData Central + Open Food Facts fallback (`/api/food/search`)
- **Health import:** Webhook for Apple Health Auto Export (`/api/health-import`)
- **Storage:** Avatar and progress photo uploads (Supabase Storage)

---

## What Needs Implementation

### 🔴 High priority — user-facing gaps

#### 1. Public blog not connected to admin CMS
- Admin writes to `blog_posts` (`/admin/blog/*`)
- Public `/main/blog` is **entirely static** hardcoded content
- No public post detail routes (e.g. `/main/blog/[slug]`)
- Search and category filters on the blog page are non-functional
- Referenced images (`/assets/images/blog-*.jpg`) **do not exist** in `public/` — broken visuals

#### 2. Billing & subscriptions (marketing promises vs. reality)
- `/main/plans` shows pricing tiers; CTAs go to trainer signup only
- FAQ and contact copy references **Stripe billing**, pause/cancel flows — **no Stripe integration exists**
- DB schema has `stripe_customer_id`, `stripe_subscription_id`, `subscription_tier` on trainer profiles
- Trainer settings has no billing/subscription UI
- Client profile shows hardcoded **"Free Plan"**

#### 3. Client invitation email delivery
- Invitations create DB records + tokens
- Trainers must **manually copy invitation links** from the clients page
- UI copy says "Invitation Sent!" / "Send an email invitation" — **misleading** (no email is sent)

#### 4. Calendar week & day views
- Month view works; week and day tabs show **"coming soon"** placeholders

#### 5. Client profile — security & preferences stubs
Explicit "Coming Soon" buttons for:
- Two-factor authentication
- Notification preferences
- Privacy settings

Health Auto Export setup **is** implemented under Preferences.

#### 6. Admin contact message inbox
- Contact form submits to `contact_messages` table
- **No admin UI** to view or respond to submissions

---

### 🟠 Medium priority — feature depth

#### 7. Workout analytics
- Logging and history exist
- Missing: progression charts, volume trends, personal records (PRs), exercise-specific history

#### 8. Nutrition enhancements
- Daily diary + weekly meal plan both exist (good)
- Missing: meal library/favorites, copy meal to another day, serving-size picker (food search parses description text only)
- `NEXT_STEPS.md` references FatSecret; code uses **USDA + Open Food Facts** instead

#### 9. Progress photo comparison
- Gallery and upload work
- No side-by-side before/after comparison view

#### 10. Messaging limitations
- Text-only chat with realtime
- No file/image attachments, read receipts, typing indicators, or message search

#### 11. Push & email notifications
- In-app notifications exist (`user_notifications` + triggers in `notifications.sql`)
- Trainer settings toggles for email/push — **no web push or email delivery implementation**
- Client dashboard notifications don't use Realtime (messages do)

#### 12. Social auth
- Google/Apple buttons on login/signup
- Requires Supabase OAuth provider configuration; no in-app handling for misconfiguration

#### 13. Social/community features
- No feeds, following, challenges, or leaderboards (intentionally deferred; no schema)

---

### 🟡 Infrastructure & production readiness

#### 14. Database migration coverage gaps
`NEXT_STEPS.md` lists 16 SQL files, but **several critical files are omitted**:

| Missing from migration docs | Purpose |
|----------------------------|---------|
| `notifications.sql` | In-app notifications table + triggers |
| `messaging-access.sql` | Chat RLS policies |
| `prevent-trainer-as-client.sql` | Data integrity |
| `invite-only-clients.sql` | Client signup restrictions |
| `ensure-signup-role.sql` | Role assignment on signup |
| `exercise-log-difficulty.sql` | Workout difficulty ratings |
| `trainer-plan-templates.sql` | Program/meal templates |
| `fix-trainer-client-queries.sql` | Query fixes |

`run-migrations.sh` only runs **2 of 26** SQL files — severely outdated vs. actual app needs.

#### 15. API hardening
- No rate limiting on `/api/health-import` or `/api/food/search`
- Health import uses service-role key (by design) — needs rate limits + optional IP allowlisting
- No unique constraint on `sleep_tracking (user_id, date)` — duplicate rows possible on health import

#### 16. Testing
- **Zero** unit, integration, or E2E test files in the repo
- No CI test pipeline evident

#### 17. Dead / unused dependencies
- `next-auth` in `package.json` — **not used anywhere** (Supabase Auth is the sole auth system)

#### 18. Legacy route redirects incomplete
- `/dashboard` → `/client` works
- Subroutes like `/dashboard/workout` are **not** redirected

#### 19. Environment & build concerns
- Placeholder Supabase credentials allow builds without env vars (middleware + browser client)
- Can mask misconfiguration until runtime in production

---

### 🟢 Known placeholders (honest, not bugs)

These are visible stubs pending product decisions:

| Location | Placeholder |
|----------|-------------|
| `/client/calendar` | Week/day views |
| `/client/profile` | 2FA, notifications, privacy |
| `/lib/trainer-plans.ts` | "Custom integrations (coming soon)" on Enterprise plan |

---

## Documentation Debt

Several docs are **significantly outdated** and should not be trusted without re-verification:

| File | Issue |
|------|-------|
| `FEATURE_STATUS.md` | References `/dashboard/*`, marks workout/meal/chat as mockups — **incorrect** |
| `README.md` | Describes consumer sleep-tracking app; missing trainer platform, 26 SQL files, env vars |
| `IMPLEMENTATION_ROADMAP.md` | Mixed accurate history + stale "missing tables" section |
| `run-migrations.sh` | Only 2 migrations; misleading for new setups |

`NEXT_STEPS.md` (July 4, 2026) is the most accurate operational guide but incomplete on SQL file list.

---

## UX Improvement Suggestions

### Navigation & mobile

1. **Client mobile bottom bar shows only 4 of 9 nav items** (Overview, Chat, Workout, Meal Plan). Goals, Progress, Sleep, Calendar, and Profile are hidden unless the hamburger menu is opened. Consider a "More" tab or reordering by usage frequency.

2. **Trainer portal has no mobile navigation menu** — only a header with avatar. Trainers on phones cannot reach Clients, Programs, Messages, etc. without typing URLs. Add a mobile drawer matching the desktop sidebar.

3. **Remove the "Dashboard Implementation" dev card** on `/client` — it exposes internal architecture (`dashboard-api.ts`, table names) to end users and breaks immersion.

### Onboarding & empty states

4. **Clarify client entry path everywhere** — landing, FAQ, and signup already say clients join via invitation; reinforce this on `/auth/login` and in empty trainer/chat states.

5. **Fix invitation UX copy** — change "Invitation Sent!" to "Invitation Created — copy link to share" until automated email is built. Show the link immediately on the success screen.

6. **First-time client checklist** — when a new client has no trainer, program, or goals, show a guided checklist ("Connect with trainer → Review program → Log first workout").

### Workout & nutrition flows

7. **Auto-switch to History tab** after starting/completing a workout from a program (noted in `NEXT_STEPS.md`).

8. **Unified nutrition mental model** — meal plan has "Daily Diary" and "Weekly Plan" tabs; add brief inline explanation of how they relate to trainer-assigned plans.

9. **Serving size picker** after food search — let users adjust portions before logging instead of accepting parsed defaults.

10. **Progress photo comparison** — side-by-side view with date picker for before/after motivation.

### Calendar & scheduling

11. **Implement week/day views** or hide those tabs until ready — clickable "coming soon" tabs create dead-end frustration.

12. **Show trainer working hours** when clients request sessions (trainer settings has timezone/duration; surface availability to clients).

13. **Session request feedback** — toast/notification when trainer approves or declines (in-app notification triggers may exist; ensure they fire for session requests).

### Messaging & notifications

14. **Unread badges** on client/trainer nav for Messages (like notifications feed already does for activity).

15. **Realtime notification updates** on dashboards (poll or Supabase Realtime subscription).

16. **Deep links from notifications** — ensure all `link_path` values land on the correct screen (workout, message thread, etc.).

### Marketing site

17. **Wire public blog to CMS** — highest-impact marketing fix; admin content is wasted otherwise.

18. **Fix broken blog images** — add assets under `public/assets/images/` or use Supabase Storage URLs from `blog_posts.featured_image`.

19. **Make FAQ/blog search functional** — or remove search UI until implemented.

20. **Align FAQ billing copy with reality** — remove Stripe references until integrated, or add "coming soon" disclaimers.

### Profile & settings

21. **Phone number** still lives in auth metadata only (no `user_profiles` column) — consider consolidating or documenting why.

22. **Unit preferences** — weight (kg/lb), height (cm/ft), first day of week — especially for US users.

23. **Accessibility** — audit form labels, focus states, and color contrast on animated landing components (GSAP/motion-heavy UI).

### Trainer workflow

24. **Client detail tabs** are functional but read-heavy — add quick actions (assign program, send message) from Workouts/Nutrition tabs.

25. **Bulk client actions** — archive, pause, or message multiple clients.

26. **Program/meal plan duplication** — "Duplicate template" for faster coach workflows.

### Performance & polish

27. **Data caching** — no React Query/SWR; every navigation refetches from Supabase. Add caching for dashboard, client lists, and exercise library.

28. **Loading skeletons** — many pages use spinners only; skeletons improve perceived performance.

29. **Optimistic updates** — chat and workout log edits would feel snappier with optimistic UI.

30. **Toast system** — success/error feedback is inconsistent (inline alerts vs. silent failures); standardize with a toast library.

---

## Priority Matrix

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| P0 | Complete SQL migration docs + runbook | Prevents production breakage | Low |
| P0 | Fix public blog + broken images | Marketing credibility | Medium |
| P1 | Trainer mobile navigation | Trainer daily usability | Medium |
| P1 | Invitation email or honest UX copy | Trust & onboarding | Low–Medium |
| P1 | Remove client dashboard dev card | Professional polish | Trivial |
| P1 | Rate-limit health import + food search | Security | Low |
| P2 | Stripe/billing or remove pricing claims | Legal/trust | High |
| P2 | Calendar week/day views | Client scheduling UX | Medium |
| P2 | Admin contact inbox | Support workflow | Low |
| P2 | Workout analytics / PR tracking | Core fitness value | Medium–High |
| P3 | Automated test suite | Regression safety | High |
| P3 | Push/email notifications | Engagement | High |
| P3 | Social features | New product surface | Very high |

---

## Suggested Implementation Order

**Phase 1 — Quick wins (polish & trust)**  
Remove dev UI, fix invitation copy, fix blog images, expand mobile nav, update stale docs.

**Phase 2 — Content & ops**  
Public blog reader, admin contact inbox, complete migration guide, rate limiting, sleep unique constraint.

**Phase 3 — Revenue & retention**  
Stripe integration (or defer pricing page), notification preferences, calendar week/day views, workout analytics.

**Phase 4 — Scale**  
Test suite, caching layer, push notifications, messaging attachments, social features (if desired).

---

## Files Worth Reviewing First

| Purpose | Path |
|---------|------|
| Client nav & mobile UX | `src/app/client/layout.tsx` |
| Trainer mobile gap | `src/app/trainer/layout.tsx` |
| Dev card to remove | `src/app/client/page.tsx` (lines ~500–528) |
| Static public blog | `src/app/main/blog/page.tsx` |
| Calendar stubs | `src/app/client/calendar/page.tsx` |
| Profile placeholders | `src/app/client/profile/page.tsx` |
| Invitation flow | `src/app/trainer/clients/add/page.tsx`, `trainer-api.ts` |
| Migration source of truth | `src/lib/supabase/*.sql`, `NEXT_STEPS.md` |
| Outdated status doc | `FEATURE_STATUS.md` |

---

## Conclusion

ZarcFit is a **solid coach-platform MVP** with real Supabase-backed features across client tracking, trainer management, and admin tooling. The largest user-visible gaps are **marketing/blog disconnect**, **billing fiction vs. implementation**, **mobile trainer navigation**, and **placeholder profile/calendar features**. The largest engineering gaps are **migration documentation**, **zero test coverage**, and **API hardening**.

The codebase is well-structured (`dashboard-api.ts`, `trainer-api.ts`, role middleware, component library) and most remaining work is **connecting, polishing, and productionizing** rather than greenfield building.

---

*This audit was generated from static codebase analysis. Runtime verification (Supabase migrations applied, OAuth providers configured, Vercel env vars) was not performed in this environment.*
