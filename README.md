# ZarcFit — Trainer–Client Coaching Platform

ZarcFit is a **trainer–client coaching platform** built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Trainer portal** — clients, workout/meal plan templates, messaging, scheduling
- **Client app** — workouts, nutrition diary, sleep, goals, progress, calendar, chat
- **Admin panel** — blog CMS, user roles, contact inbox
- **Marketing site** — landing, FAQ, plans, public blog

## Tech stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth, Postgres, Storage, Realtime)
- **Deployment:** Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.example`](./.env.example). Required for production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Database migrations

**Do not use the old 2-file migration script alone.** Use the full runbook:

→ **[MIGRATION_RUNBOOK.md](./MIGRATION_RUNBOOK.md)** — ordered list of all 30+ SQL files

→ **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** — credentials, auth URLs, troubleshooting

## Documentation

| Doc | Purpose |
|-----|---------|
| [PROJECT_AUDIT.md](./PROJECT_AUDIT.md) | Full codebase audit (July 2026) |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Phased task tracker |
| [MIGRATION_RUNBOOK.md](./MIGRATION_RUNBOOK.md) | SQL migration order |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Supabase configuration |

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
npm run test     # Vitest unit tests
npm run test:e2e # Playwright smoke tests
```

## Roles

- **Trainer** — signs up at `/auth/signup`, manages clients at `/trainer/*`
- **Client** — joins via trainer invitation at `/auth/accept-invitation`
- **Admin** — granted via `user_roles` table, accesses `/admin/*`

## License

ISC
