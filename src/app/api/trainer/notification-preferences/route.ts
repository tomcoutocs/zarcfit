import { NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api-auth';

export async function POST() {
  const auth = await requireTrainer();
  if ('response' in auth) return auth.response;

  if (!auth.user.email) {
    return NextResponse.json({ sent: false, reason: 'no_email' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ sent: false, skipped: true });
  }

  const from = process.env.RESEND_FROM_EMAIL || 'ZarcFit <notifications@zarcfit.com>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [auth.user.email],
      subject: 'ZarcFit notification preferences updated',
      text: 'Your email notification preferences were saved. You will receive emails about new messages and bookings when enabled.',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ sent: false, error: data.message }, { status: 502 });
  }

  return NextResponse.json({ sent: true, id: data.id });
}
