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