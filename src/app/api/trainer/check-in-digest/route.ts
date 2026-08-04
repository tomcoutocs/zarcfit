import { NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api-auth';

type MissedClient = {
  client_id: string;
  client_name: string;
  client_email: string;
  last_check_in_date: string | null;
};

export async function POST() {
  const auth = await requireTrainer();
  if ('response' in auth) return auth.response;

  const { data, error } = await auth.supabase.rpc('get_missed_check_ins', { p_days: 7 });

  if (error) {
    console.error('Error fetching missed check-ins:', error);
    return NextResponse.json({ error: 'Failed to load missed check-ins' }, { status: 500 });
  }

  const missedClients = (data as MissedClient[]) || [];

  if (missedClients.length === 0) {
    return NextResponse.json({ sent: false, reason: 'none_missed', clients: [] });
  }

  if (!auth.user.email) {
    return NextResponse.json({ sent: false, reason: 'no_email', clients: missedClients });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // TODO: wire up Resend (or another transactional email provider) once
    // RESEND_API_KEY is configured. Until then, the missed-client list is
    // still returned so the trainer dashboard can render it directly.
    return NextResponse.json({ sent: false, skipped: true, clients: missedClients });
  }

  const from = process.env.RESEND_FROM_EMAIL || 'ZarcFit <notifications@zarcfit.com>';
  const rows = missedClients
    .map((client) => {
      const last = client.last_check_in_date
        ? new Date(client.last_check_in_date).toLocaleDateString()
        : 'Never checked in';
      return `<li>${client.client_name} (${client.client_email}) — last check-in: ${last}</li>`;
    })
    .join('');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [auth.user.email],
      subject: `${missedClients.length} client${missedClients.length === 1 ? '' : 's'} missed their weekly check-in`,
      html: `<p>The following clients haven't logged a weekly check-in in the last 7 days:</p><ul>${rows}</ul>`,
      text: missedClients
        .map((c) => `${c.client_name} (${c.client_email}) — last check-in: ${c.last_check_in_date || 'Never'}`)
        .join('\n'),
    }),
  });

  const resData = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { sent: false, error: resData.message || 'Failed to send email', clients: missedClients },
      { status: 502 }
    );
  }

  return NextResponse.json({ sent: true, id: resData.id, clients: missedClients });
}
