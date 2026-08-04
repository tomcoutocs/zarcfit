import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

let vapidConfigured = false;

/** Returns false (and leaves web-push unconfigured) if VAPID keys are missing. */
function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:support@zarcfit.com';

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Sends a web push notification to every device a user has subscribed on.
 * Best-effort: skips silently if VAPID keys aren't configured, never throws,
 * and prunes subscriptions the push service reports as gone (404/410).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!userId) return;

  try {
    if (!ensureVapidConfigured()) return;

    const admin = getAdminClient();
    if (!admin) return;

    const { data: subscriptions, error } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (error || !subscriptions?.length) return;

    const body = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body
          );
        } catch (err) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            // Subscription is gone (browser data cleared, uninstalled, etc.) — clean it up.
            await admin.from('push_subscriptions').delete().eq('id', sub.id);
          } else {
            console.error('Push send failed:', err);
          }
        }
      })
    );
  } catch (err) {
    console.error('sendPushToUser failed:', err);
  }
}
