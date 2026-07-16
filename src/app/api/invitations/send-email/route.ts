import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { email, invitationUrl, trainerName, personalMessage } = body as {
    email?: string;
    invitationUrl?: string;
    trainerName?: string;
    personalMessage?: string;
  };

  if (!email || !invitationUrl) {
    return NextResponse.json({ error: 'Missing email or invitation URL' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zarcfit.vercel.app';

  // Supabase inviteUserByEmail sends auth invite; for custom invitation links
  // we use the admin API to send a magic link style invite when possible.
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: invitationUrl.startsWith('http') ? invitationUrl : `${siteUrl}${invitationUrl}`,
    data: {
      invitation_url: invitationUrl,
      trainer_name: trainerName || 'Your trainer',
      personal_message: personalMessage || '',
    },
  });

  if (error) {
    // Fallback: invitation still works via manual link copy
    return NextResponse.json({
      sent: false,
      error: error.message,
      fallback: 'Copy the invitation link manually',
    });
  }

  return NextResponse.json({ sent: true, user: data.user?.id });
}
