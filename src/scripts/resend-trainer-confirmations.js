/**
 * Send auth emails to trainer accounts.
 * - Unconfirmed trainers: signup confirmation resend
 * - Confirmed trainers (--all): magic-link login email (signup resend is a no-op once confirmed)
 *
 * Usage:
 *   node --experimental-modules src/scripts/resend-trainer-confirmations.js
 *   node --experimental-modules src/scripts/resend-trainer-confirmations.js --signup-all
 *   node --experimental-modules src/scripts/resend-trainer-confirmations.js --all
 *   node --experimental-modules src/scripts/resend-trainer-confirmations.js --signup-all trainer@example.com
 *
 * By default only unconfirmed trainers receive a signup confirmation.
 * Pass --signup-all to resend signup confirmation to every trainer account.
 * Pass --all to email every trainer account (magic link if already confirmed).
 * Pass explicit emails to skip the service-role user lookup.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

for (const envFile of ['.env.local', '.env']) {
  const envPath = path.join(rootDir, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://zarcfit.vercel.app'
).replace(/\/$/, '');

const includeConfirmed = process.argv.includes('--all');
const signupAll = process.argv.includes('--signup-all');
const cliEmails = process.argv.filter((arg) => arg.includes('@') && !arg.startsWith('--'));
const signupRedirectTo = `${SITE_URL}/auth/login?emailConfirmed=1`;
const magicLinkRedirectTo = `${SITE_URL}/auth/callback`;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars. Need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const adminClient = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

async function listTrainerUsers() {
  if (cliEmails.length > 0) {
    if (!adminClient) {
      return cliEmails.map((email) => ({ email, confirmed: !signupAll }));
    }

    const trainers = [];
    let page = 1;

    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
      if (error) {
        throw new Error(`Failed to list users: ${error.message}`);
      }

      for (const user of data.users) {
        if (!user.email || !cliEmails.includes(user.email)) continue;
        trainers.push({
          email: user.email,
          confirmed: !!(user.email_confirmed_at || user.confirmed_at),
        });
      }

      if (data.users.length < 200) break;
      page += 1;
    }

    const found = new Set(trainers.map((trainer) => trainer.email.toLowerCase()));
    for (const email of cliEmails) {
      if (!found.has(email.toLowerCase())) {
        trainers.push({ email, confirmed: !signupAll });
      }
    }

    return trainers;
  }

  if (!adminClient) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing. Pass trainer emails directly: node resend-trainer-confirmations.js --all trainer@example.com'
    );
  }

  const { data: trainerRoles, error: rolesError } = await adminClient
    .from('user_roles')
    .select('user_id')
    .eq('role', 'trainer');

  if (rolesError) {
    throw new Error(`Failed to load trainer roles: ${rolesError.message}`);
  }

  const trainerIds = new Set((trainerRoles ?? []).map((row) => row.user_id));
  const trainers = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    for (const user of data.users) {
      const signupRole = user.user_metadata?.signup_role ?? user.user_metadata?.role;
      const isTrainer = trainerIds.has(user.id) || signupRole === 'trainer';
      if (!isTrainer || !user.email) continue;

      trainers.push({
        email: user.email,
        confirmed: !!(user.email_confirmed_at || user.confirmed_at),
      });
    }

    if (data.users.length < 200) break;
    page += 1;
  }

  const unique = new Map();
  for (const trainer of trainers) {
    unique.set(trainer.email.toLowerCase(), trainer);
  }

  return [...unique.values()];
}

async function sendTrainerAuthEmail(trainer) {
  if (!trainer.confirmed || signupAll) {
    return publicClient.auth.resend({
      type: 'signup',
      email: trainer.email,
      options: { emailRedirectTo: signupRedirectTo },
    });
  }

  if (!includeConfirmed) {
    return { error: null, skipped: true };
  }

  return publicClient.auth.signInWithOtp({
    email: trainer.email,
    options: {
      emailRedirectTo: magicLinkRedirectTo,
      shouldCreateUser: false,
    },
  });
}

async function resendTrainerConfirmations() {
  console.log('\n=== Send trainer auth emails ===\n');
  console.log(`Signup redirect: ${signupRedirectTo}`);
  console.log(`Magic-link redirect: ${magicLinkRedirectTo}`);
  console.log(
    signupAll
      ? 'Mode: signup confirmation to all trainers'
      : includeConfirmed
        ? 'Mode: all trainers'
        : 'Mode: unconfirmed trainers only'
  );

  const trainers = await listTrainerUsers();
  const targets = signupAll
    ? trainers
    : includeConfirmed
      ? trainers
      : trainers.filter((trainer) => !trainer.confirmed);

  if (targets.length === 0) {
    console.log('\nNo trainer accounts matched the selected criteria.');
    if (!includeConfirmed && !signupAll) {
      console.log('All trainer accounts are already confirmed. Pass --signup-all to force signup confirmation resends, or --all for magic-link login emails.');
    }
    return;
  }

  console.log(`\nSending to ${targets.length} trainer account(s):\n`);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const trainer of targets) {
    const status = trainer.confirmed ? 'confirmed' : 'unconfirmed';
    const emailType =
      !trainer.confirmed || signupAll ? 'signup confirmation' : 'magic link';
    process.stdout.write(`- ${trainer.email} (${status}, ${emailType}) ... `);

    const { error, skipped: wasSkipped } = await sendTrainerAuthEmail(trainer);

    if (wasSkipped) {
      skipped += 1;
      console.log('skipped');
    } else if (error) {
      failed += 1;
      console.log(`failed (${error.message})`);
    } else {
      sent += 1;
      console.log('sent');
    }
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}, Skipped: ${skipped}`);
}

resendTrainerConfirmations().catch((error) => {
  console.error('\nScript failed:', error.message);
  process.exit(1);
});
