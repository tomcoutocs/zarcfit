import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ sent: false, skipped: true });
  }

  const body = await request.json();
  const { to, subject, html, text } = body as {
    to?: string;
    subject?: string;
    html?: string;
    text?: string;
  };

  if (!to || !subject || (!html && !text)) {
    return NextResponse.json({ error: 'Missing to, subject, or body' }, { status: 400 });
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
      to: [to],
      subject,
      html: html || undefined,
      text: text || undefined,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { sent: false, error: data.message || 'Failed to send email' },
      { status: 502 }
    );
  }

  return NextResponse.json({ sent: true, id: data.id });
}
