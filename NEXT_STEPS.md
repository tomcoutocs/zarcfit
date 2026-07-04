# ZarcFit — Next Steps

Last updated: July 4, 2026

All six implementation phases from the feature roadmap are complete and pushed to `main`. This document reflects what to do next in Supabase, environment setup, and product polish.

---

## 1. Run SQL migrations in Supabase (required)

Run these files **in order** in the Supabase SQL Editor. Each file is idempotent where noted.

| Order | File | Purpose |
|-------|------|---------|
| 1 | `src/lib/supabase/schema.sql` | Core tables |
| 2 | `src/lib/supabase/trainer-platform-schema.sql` | Trainer/client platform |
| 3 | `src/lib/supabase/workout-nutrition-rls.sql` | Workout & nutrition RLS |
| 4 | `src/lib/supabase/invitation-flow.sql` | Email invitations |
| 5 | `src/lib/supabase/update-rls-policies.sql` | RLS fixes |
| 6 | `src/lib/supabase/fix-auth-trigger.sql` | Auth trigger |
| 7 | `src/lib/supabase/exercise-library-seed.sql` | Exercise library seed |
| 8 | `src/lib/supabase/blog-schema.sql` | Blog |
| 9 | `src/lib/supabase/contact-schema.sql` | Contact form |
| 10 | `src/lib/supabase/admin-schema.sql` | Admin RPCs |
| 11 | `src/lib/supabase/client-search.sql` | Client search & connection requests |
| 12 | `src/lib/supabase/trainer-activity.sql` | Trainer dashboard stats & activity feed |
| 13 | `src/lib/supabase/storage-schema.sql` | Avatars & progress photo bucket |
| 14 | `src/lib/supabase/session-requests.sql` | Client session request flow |
| 15 | `src/lib/supabase/meal-diary.sql` | Daily food diary table |
| 16 | `src/lib/supabase/health-import.sql` | Health import API keys |

---

## 2. Environment variables

Add to `.env.local` (and Vercel/hosting):

```env
# Existing Supabase vars
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# FatSecret food search (Phase 5)
FATSECRET_CLIENT_ID=
FATSECRET_CLIENT_SECRET=
```

Register at [FatSecret Platform](https://platform.fatsecret.com/) for API credentials. Without these, food search returns a friendly error; manual food entry still works.

`SUPABASE_SERVICE_ROLE_KEY` is required for the health import webhook (`/api/health-import`).

---

## 3. Verify new features end-to-end

### Client
- **Dashboard** — Active goals card with link to `/client/goals`
- **Profile** — Upload avatar; Preferences tab shows Health Auto Export setup
- **Progress** — Upload progress photos; gallery + weight chart
- **Calendar** — Request a coaching session from your trainer
- **Workout** — Start workout from assigned program; edit log entries inline
- **Meal Plan** — Daily Diary tab: search foods, log by meal type

### Trainer
- **Dashboard** — Live stats (workouts this week, unread messages, sessions today) + activity feed
- **Schedule** — Approve/decline pending session requests
- **Programs** — Open **Builder** to add sessions and exercises
- **Settings** — Upload business avatar

### Apple Health (manual export)
1. Client opens Profile → Preferences → copy webhook URL + API key
2. Configure [Health Auto Export](https://healthautoexport.com/) on iOS to POST JSON
3. Payload maps sleep → `sleep_tracking`, weight → `progress_tracking`, workouts → `workout_logs`

---

## 4. Recommended polish (priority order)

### P1 — Production hardening
- [ ] Add unique constraint on `sleep_tracking (user_id, date)` for cleaner health imports
- [ ] Rate-limit `/api/health-import` and `/api/food/search`
- [ ] Add integration tests for session request approve/decline RPC
- [ ] Verify RLS on `food_diary_entries` and `session_requests` with real trainer/client accounts

### P2 — UX improvements
- [ ] Switch to logs tab automatically after "Start" from program
- [ ] Show trainer working hours when client requests a session
- [ ] FatSecret serving-size picker (currently parses description text)
- [ ] Progress photo comparison view (side-by-side dates)
- [ ] Trainer notifications when client sends session request or logs workout

### P3 — Future integrations
- [ ] Cronometer/MyFitnessPal — no public API; daily diary + FatSecret is the supported path
- [ ] Native Apple Health — requires iOS app or continued Health Auto Export webhook
- [ ] Wearables beyond manual export — consider Terra/Spike aggregators if budget allows

---

## 5. Deployment checklist

- [ ] All SQL migrations applied to production Supabase
- [ ] Env vars set on hosting platform
- [ ] Storage bucket `user-uploads` created (via `storage-schema.sql`)
- [ ] Smoke test: signup → client dashboard → log workout → trainer sees activity
- [ ] Smoke test: client session request → trainer approve → event on calendar

---

## 6. What was delivered (phase summary)

| Phase | Delivered |
|-------|-----------|
| **1** | Dashboard active goals; trainer activity feed + live stat cards |
| **2** | Supabase Storage; profile avatars; progress photo upload & gallery |
| **3** | `session_requests` table; client propose / trainer approve-decline |
| **4** | Program builder; start workout from program; workout log editing |
| **5** | Daily food diary; FatSecret search API; manual food logging |
| **6** | Health import webhook; per-user API keys; profile setup UI |

---

## 7. Git commits (this rollout)

```
f356b46 Phase 1: Dashboard goals polish and trainer activity feed
023ee23 Phase 2: Storage bucket, profile avatars, and progress photos
16155d9 Phase 3: Client session requests with trainer approve/decline flow
e2ba2b8 Phase 4: Program builder, start from program, and workout log editing
[latest] Phase 5-6: Daily food diary with FatSecret search and Apple Health import webhook
```

For questions or bugs, check the trainer/client flows above against your Supabase RLS policies first — most issues trace back to missing SQL migrations or inactive trainer-client relationships.
