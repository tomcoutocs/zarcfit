# ZarcFit Admin Scripts

This directory contains utility scripts for managing the ZarcFit application.

## Creating an Admin User

The `create-admin.js` script helps you create an admin user with the email `admin@zarcfit.com`.

### Prerequisites

- Node.js 16 or higher
- Supabase project with Auth and Database set up
- Valid `.env` file with Supabase credentials

### Usage

1. Make sure your `.env` file contains the following Supabase variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Run the script with:
   ```bash
   npm run create-admin
   ```

3. Follow the prompts to create a password for the admin user.

4. After successful creation, you'll receive a confirmation message.

5. Check the email inbox for `admin@zarcfit.com` to confirm the account.

6. Once confirmed, you can log in to the admin dashboard at `/admin`.

## Seeding a Demo Client

`seed-demo-client.js` creates a fully-populated client attached to your trainer
account, so the client detail page can be reviewed with data in every tab.

### Prerequisites

- A trainer account that already exists (sign up through the app first)
- `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` — the anon key cannot create auth
  users or bypass RLS

### Usage

```bash
npm run seed:demo-client -- --trainer you@example.com
```

Re-run with `--reset` to wipe the previously seeded data before reseeding:

```bash
npm run seed:demo-client -- --trainer you@example.com --reset
```

### What it creates

| Area | Data |
|------|------|
| Profile | Jordan Reyes, 178 cm, bio, `client` role |
| Relationship | Active `trainer_clients` row, accepted 88 days ago |
| Program | 12-week recomposition, 3 weeks × 3 sessions, exercises from the library |
| History | 8 workout logs with per-exercise difficulty ratings |
| Progress | 7 weigh-ins trending down, 2 goals |
| Nutrition | 2,200 kcal plan, 5 days of meals, 5 of 7 days of food diary |
| Notes | 4 client notes, 2 pinned |
| Sleep | 14 nights |

The demo login is printed at the end so you can also view the client side of the
app. Override the credentials with `DEMO_CLIENT_EMAIL` / `DEMO_CLIENT_PASSWORD`.

### Troubleshooting

- **"Missing Supabase environment variables"**: Check that your `.env` file exists and contains the required variables.
- **"Error creating admin user"**: This could be due to:
  - The email is already registered (you can use the forgot password feature)
  - Network connectivity issues
  - Invalid Supabase credentials
- **"Could not create profile entry"**: This may happen if:
  - The database tables are not properly set up
  - Row Level Security (RLS) is preventing the operation

If you encounter issues, check the Supabase console for more details. 