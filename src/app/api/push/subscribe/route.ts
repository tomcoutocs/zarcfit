import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

type SubscribeBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

// CA-203: save/remove a browser push subscription for the authenticated
// user. Uses the session-bound Supabase client so RLS enforces "users
// manage their own rows" (see web-push.sql) — no service role needed here.
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ('response' in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as SubscribeBody | null;
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const authKey = body?.keys?.auth;

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: 'Missing endpoint or keys' }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: auth.user.id,
        endpoint,
        p256dh,
        auth: authKey,
      },
      { onConflict: 'endpoint' }
    );

  if (error) {
    console.error('Failed to save push subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }

  return NextResponse.json({ subscribed: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if ('response' in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  const endpoint = body?.endpoint;

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('Failed to remove push subscription:', error);
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }

  return NextResponse.json({ subscribed: false });
}
