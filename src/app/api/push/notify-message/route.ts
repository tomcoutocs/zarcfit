import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';
import { sendPushToUser } from '@/lib/push/send';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

// CA-203: fired best-effort by messagesApi.sendMessage right after a chat
// message is inserted. Looks up the conversation, figures out the other
// party, and pushes them a notification. Never blocks or fails the send —
// any error here just means no push went out.
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ('response' in auth) return auth.response;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ sent: false, skipped: true });
  }

  const body = (await request.json().catch(() => null)) as
    | { conversationId?: string; messageId?: string }
    | null;
  const conversationId = body?.conversationId;
  const messageId = body?.messageId;

  if (!conversationId || !messageId) {
    return NextResponse.json({ sent: false, error: 'Missing conversationId or messageId' }, { status: 400 });
  }

  try {
    const { data: conversation } = await admin
      .from('conversations')
      .select('trainer_id, client_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (!conversation) {
      return NextResponse.json({ sent: false });
    }

    const { trainer_id: trainerId, client_id: clientId } = conversation;
    if (auth.user.id !== trainerId && auth.user.id !== clientId) {
      return NextResponse.json({ sent: false }, { status: 403 });
    }

    const recipientId = auth.user.id === trainerId ? clientId : trainerId;

    const { data: message } = await admin
      .from('messages')
      .select('content, sender_id')
      .eq('id', messageId)
      .maybeSingle();

    // Only push for the message we're told about, and only if it really
    // came from the caller (avoids spoofing another sender's message).
    if (!message || message.sender_id !== auth.user.id) {
      return NextResponse.json({ sent: false });
    }

    const { data: senderProfile } = await admin
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', auth.user.id)
      .maybeSingle();

    const senderName =
      [senderProfile?.first_name, senderProfile?.last_name].filter(Boolean).join(' ').trim() ||
      auth.user.email ||
      'Someone';

    const preview = message.content?.trim().slice(0, 140) || 'Sent a message';
    const url = auth.user.id === trainerId ? '/client/chat' : `/trainer/messages?client=${clientId}`;

    await sendPushToUser(recipientId, {
      title: `New message from ${senderName}`,
      body: preview,
      url,
      tag: `message-${conversationId}`,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('notify-message push failed:', err);
    return NextResponse.json({ sent: false }, { status: 500 });
  }
}
