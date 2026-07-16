# Supabase Setup & Migration Guide

## Quick Start

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Navigate to **Settings > API**
   - Copy your **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy your **anon public key**
4. Navigate to **Settings > Database**
   - Copy or reset your **Database Password**

### Step 2: Create Environment File

Create a `.env.local` file in the project root with your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_PASSWORD=your_database_password
```

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_PASSWORD=your_secure_password_123
```

### Step 3: Run Migrations

**Use the full migration runbook** — do not run only two files.

See **[MIGRATION_RUNBOOK.md](./MIGRATION_RUNBOOK.md)** for the complete ordered list of 34 SQL files.

#### Quick start (Supabase SQL Editor)

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run each file from `src/lib/supabase/` **in the order listed in MIGRATION_RUNBOOK.md**
3. Wait for success before the next file

List all files:

```bash
./run-migrations.sh --list
```

#### Option A: Using psql (advanced)

```bash
# Replace with your actual credentials
psql "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres" \
  -f src/lib/supabase/trainer-platform-schema.sql

psql "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres" \
  -f src/lib/supabase/update-rls-policies.sql
```

#### Option D: Using Supabase CLI

```bash
# Link your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
npx supabase db push --db-url "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
```

---

## What the Migrations Do

### Migration 1: `trainer-platform-schema.sql`

Creates the following tables:
- ✅ `user_roles` - User role management (admin/trainer/client)
- ✅ `trainer_profiles` - Trainer business information
- ✅ `trainer_settings` - Trainer preferences and settings
- ✅ `trainer_clients` - Trainer-client relationships
- ✅ `client_invitations` - Invitation system
- ✅ `client_notes` - Private notes trainers write about clients
- ✅ `conversations` - Message threads
- ✅ `messages` - Individual messages
- ✅ `program_assignments` - Link workout programs to clients

Also creates:
- Helper functions (`has_role`, `get_trainer_clients`)
- Triggers (auto-create trainer profile, update conversation timestamps)
- Row Level Security (RLS) policies for all tables

### Migration 2: `update-rls-policies.sql`

Updates RLS policies on existing tables to allow trainers to view client data:
- ✅ `workout_programs` - Trainers can view client programs
- ✅ `workout_logs` - Trainers can view client workouts
- ✅ `nutrition_plans` - Trainers can view client meal plans
- ✅ `nutrition_logs` - Trainers can view client meals
- ✅ `progress_tracking` - Trainers can view client progress
- ✅ `sleep_tracking` - Trainers can view client sleep data
- ✅ `goals` - Trainers can view client goals
- ✅ `calendar_events` - Trainers can view client calendar
- ✅ `user_profiles` - Trainers can view client profiles

**Important:** Trainers can only view data for their ACTIVE clients (status = 'active' in `trainer_clients` table)

---

## Verification

After running migrations, verify everything is set up correctly:

### 1. Check Tables Exist

In Supabase Dashboard > Table Editor, you should see these new tables:
- user_roles
- trainer_profiles
- trainer_settings
- trainer_clients
- client_invitations
- client_notes
- conversations
- messages
- program_assignments

### 2. Check RLS Policies

In Supabase Dashboard > Authentication > Policies, each table should have multiple policies.

### 3. Test Authentication

```bash
# Start the development server
npm run dev

# Visit http://localhost:3000/auth/signup
# Create a trainer account
# You should be redirected to /trainer/dashboard
```

---

## Troubleshooting

### Error: "relation already exists"

**Solution:** The table was already created. You can:
1. Drop the existing table in Supabase Dashboard > SQL Editor:
   ```sql
   DROP TABLE IF EXISTS table_name CASCADE;
   ```
2. Or skip that part of the migration

### Error: "permission denied"

**Solution:** Make sure you're using the database password, not the anon key.

### Error: "password authentication failed"

**Solution:** 
1. Go to Supabase Dashboard > Settings > Database
2. Reset your database password
3. Update your `.env.local` file
4. Try again

### Error: "psql: command not found"

**Solution:** Install PostgreSQL client:
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y postgresql-client

# macOS
brew install postgresql
```

Or use the Supabase Dashboard SQL Editor instead.

### Error: "connection refused"

**Solution:** Check your project URL and ensure your Supabase project is active.

---

## Security Notes

### Never Commit These Files:
- ❌ `.env.local`
- ❌ `.env`
- ❌ Any file with credentials

These are already in `.gitignore`.

### Secrets in Cursor Cloud Agents

If you're using Cursor Cloud Agents, add these secrets in:
**Cursor Dashboard > Cloud Agents > Secrets**

This is more secure than environment files.

---

## Post-Migration Testing

### Test Trainer Flow:
1. ✅ Sign up as trainer at `/auth/signup`
2. ✅ Select "Trainer/Coach" role
3. ✅ Get redirected to `/trainer/dashboard`
4. ✅ Click "Invite Client"
5. ✅ Fill out invitation form
6. ✅ Check `client_invitations` table in Supabase

### Test Client Flow:
1. ✅ Sign up as client at `/auth/signup`
2. ✅ Select "Client" role
3. ✅ Get redirected to `/client/dashboard`
4. ✅ Access existing features (sleep, workout, etc.)

### Test Role Protection:
1. ✅ Try accessing `/trainer/dashboard` as a client → should redirect
2. ✅ Try accessing `/client/dashboard` as a trainer → should redirect
3. ✅ Try accessing protected routes while logged out → should redirect to login

---

## Next Steps After Migration

1. ✅ **Configure Email** (optional for invitations to actually send)
   - Supabase Dashboard > Authentication > Email Templates
   - Or set up SMTP

2. ✅ **Connect Workout Data** to trainer views
   - Trainer can already query client workouts via RLS
   - Just need to display in `/trainer/clients/[clientId]` page

3. ✅ **Build Real-time Messaging**
   - Infrastructure is ready
   - Add Supabase Realtime subscriptions

4. ✅ **Program Assignment UI**
   - Table exists, API functions exist
   - Build UI to assign programs

---

## Support

If you encounter issues:
1. Check the Supabase Dashboard logs
2. Check browser console for errors
3. Check `TROUBLESHOOTING.md` (if it exists)
4. Review `IMPLEMENTATION_COMPLETE.md` for architecture details

---

*Last Updated: July 3, 2026*
