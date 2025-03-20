# ZarcoFit - Fitness & Health Tracking Application

ZarcoFit is a comprehensive fitness and health tracking application built with Next.js and Supabase. The application helps users track their sleep, workouts, nutrition, and overall wellness.

## Features

- **Sleep Tracking**: Record sleep duration, quality, and phases
- **Detailed Analytics**: Visualize your health data with interactive charts
- **User Profiles**: Personalized experience with user accounts
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Visualization**: Recharts for data visualization
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account and project

### Environment Setup

1. Clone the repository
2. Create a `.env.local` file in the root directory with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Database Setup

ZarcoFit requires specific tables and functions in your Supabase database. You can find the SQL setup scripts in:

- `src/lib/supabase/schema.sql` - Main schema setup
- `src/lib/supabase/fix-auth-trigger.sql` - Auth triggers and functions

You can run these scripts in the Supabase SQL Editor to set up your database.

## Troubleshooting

### Auth.uid Issues

If you encounter the "Error accessing auth.uid: {}" error:

1. Navigate to the Sleep Tracking dashboard
2. Use the Connection Troubleshooter to check your connection
3. Go to the "Auth Fixes" tab and copy the SQL script
4. Run the SQL in your Supabase SQL Editor
5. Return to the app and verify the connection is working

### RLS Policies

Row Level Security policies are required for the application to function properly. The SQL setup scripts include these policies, but if you're experiencing permission issues:

1. Verify that RLS is enabled on your tables
2. Check that policies exist for SELECT, INSERT, UPDATE, and DELETE operations
3. Ensure the policies are using `auth.uid()` correctly to match the user_id column

## Development

This project follows a feature-based directory structure:

- `components/` - Reusable UI components
- `app/` - Next.js App Router pages
- `hooks/` - Custom React hooks
- `lib/` - Utility functions and libraries
- `context/` - React context providers
- `public/` - Static assets

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Recharts Documentation](https://recharts.org/en-US/)
