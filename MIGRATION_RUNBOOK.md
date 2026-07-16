# ZarcFit SQL Migration Runbook

**Last updated:** July 16, 2026  
**Source of truth:** All files in `src/lib/supabase/*.sql`

Use this runbook for **new Supabase projects** or to verify production has every migration applied.

---

## How to apply

### Supabase SQL Editor (recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Run each file below **in order**, one at a time
3. Wait for success before the next file
4. Re-running is safe where noted — most files use `IF NOT EXISTS` / `DROP POLICY IF EXISTS`

### Automated (requires psql + `SUPABASE_DB_PASSWORD` in `.env.local`)

```bash
./run-migrations.sh --list
```

---

## Ordered migration list

| # | File | Purpose | Required | Depends on |
|---|------|---------|----------|------------|
| 1 | `schema.sql` | Core tables: profiles, sleep, goals, exercises, workouts | ✅ | — |
| 2 | `fix-auth-trigger.sql` | Auth triggers, `get_auth_uid()` helper | ✅ | schema.sql |
| 3 | `trainer-platform-schema.sql` | Trainer/client roles, programs, meal plans, conversations | ✅ | schema.sql |
| 4 | `update-rls-policies.sql` | RLS updates for trainer platform tables | ✅ | trainer-platform-schema.sql |
| 5 | `workout-nutrition-rls.sql` | Workout + nutrition row-level security | ✅ | trainer-platform-schema.sql |
| 6 | `storage-schema.sql` | Storage bucket `user-uploads` + RLS | ✅ | — |
| 7 | `admin-schema.sql` | Admin stats RPC, role helpers | ✅ | user_roles |
| 8 | `blog-schema.sql` | `blog_posts` table + RLS | ✅ | user_roles |
| 9 | `contact-schema.sql` | `contact_messages` table + RLS | ✅ | user_roles |
| 10 | `meal-diary.sql` | Daily food diary entries | ✅ | trainer-platform-schema.sql |
| 11 | `health-import.sql` | Apple Health webhook data tables | ✅ | schema.sql |
| 12 | `session-requests.sql` | Client session request workflow | ✅ | trainer-platform-schema.sql |
| 13 | `client-search.sql` | Client search RPC | ✅ | trainer-platform-schema.sql |
| 14 | `invitation-flow.sql` | Trainer invitation tokens | ✅ | trainer-platform-schema.sql |
| 15 | `invite-only-clients.sql` | Restrict client signup to invitations | ✅ | invitation-flow.sql |
| 16 | `ensure-signup-role.sql` | Assign role on signup trigger | ✅ | user_roles |
| 17 | `default-client-role.sql` | Default client role for edge cases | ✅ | user_roles |
| 18 | `prevent-trainer-as-client.sql` | Block trainers from client role | ✅ | user_roles |
| 19 | `backfill-client-trainers.sql` | Backfill trainer–client links | ⚠️ One-time | invitation-flow.sql |
| 20 | `fix-trainer-client-queries.sql` | SECURITY DEFINER RPCs for roster | ✅ | trainer-platform-schema.sql |
| 21 | `trainer-plan-templates.sql` | Reusable program/meal templates | ✅ | trainer-platform-schema.sql |
| 22 | `exercise-log-difficulty.sql` | Difficulty ratings on exercise logs | ✅ | schema.sql |
| 23 | `exercise-library-seed.sql` | Seed default exercises | Optional | exercises table |
| 24 | `messaging-access.sql` | Chat RLS policies | ✅ | conversations/messages |
| 25 | `notifications.sql` | In-app notifications + triggers | ✅ | messaging, workouts |
| 26 | `trainer-activity.sql` | Trainer dashboard stats + activity RPC | ✅ | notifications.sql |
| 27 | `sleep-unique-constraint.sql` | UNIQUE (user_id, date) on sleep_tracking | ✅ | schema.sql |
| 28 | `blog-slug.sql` | Add slug column for public blog URLs | ✅ | blog-schema.sql |
| 29 | `message-read-receipts.sql` | Client unread count RPC | ✅ | messaging-access.sql |
| 30 | `message-attachments.sql` | `attachment_url`, `message_type` on messages | ✅ | messaging-access.sql |
| 31 | `user-preferences.sql` | Notification/privacy/unit preferences | ✅ | user_profiles |
| 32 | `meal-favorites.sql` | Saved meals library | Optional | meal-diary.sql |
| 33 | `stripe-subscriptions.sql` | Stripe IDs on trainer profiles | ✅ | trainer-platform-schema.sql |
| 34 | `session-request-notifications.sql` | Notify on session approve/decline | ✅ | session-requests.sql, notifications.sql |
| 35 | `message-storage-rls.sql` | Storage RLS for `messages/{user_id}/` uploads | ✅ | storage-schema.sql, message-attachments.sql |

**Note:** Message attachments use the `user-uploads` bucket at path `messages/{user_id}/{filename}` (see NG-101).

---

## Production verification checklist

```sql
-- Tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename IN (
  'user_notifications', 'conversations', 'messages',
  'client_invitations', 'blog_posts', 'contact_messages',
  'food_diary_entries', 'session_requests', 'meal_favorites'
);

-- Key functions
SELECT proname FROM pg_proc WHERE proname IN (
  'get_trainer_dashboard_stats',
  'get_unread_notification_count',
  'get_client_unread_message_count',
  'notify_session_request_status'
);

-- New columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'messages' AND column_name IN ('attachment_url', 'message_type');
```

---

## Auth URL configuration

In Supabase → **Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| Site URL | `https://zarcfit.vercel.app` |
| Redirect URLs | `https://zarcfit.vercel.app/auth/callback` |
| | `https://zarcfit.vercel.app/auth/login` |
| | `https://zarcfit.vercel.app/auth/reset-password` |
| | `http://localhost:3000/auth/callback` (dev) |

---

## Vercel environment variables

See `.env.example` for the full list. Required: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.

---

*See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for post-migration launch tasks.*
