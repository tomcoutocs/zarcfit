import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireTrainer } from '@/lib/api-auth';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

/**
 * Cancels a recurring client subscription (CA-404). `subscriptionId` is our
 * `trainer_client_subscriptions.id`, not the Stripe subscription ID.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  const auth = await requireTrainer();
  if ('response' in auth) return auth.response;

  const { subscriptionId } = await params;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in environment.' },
      { status: 503 }
    );
  }

  const { data: row } = await auth.supabase
    .from('trainer_client_subscriptions')
    .select('stripe_subscription_id, stripe_account_id')
    .eq('id', subscriptionId)
    .eq('trainer_id', auth.user.id)
    .single();

  if (!row) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  try {
    const cancelled = await stripe.subscriptions.cancel(row.stripe_subscription_id, undefined, {
      stripeAccount: row.stripe_account_id,
    });

    await auth.supabase
      .from('trainer_client_subscriptions')
      .update({
        status: cancelled.status || 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    return NextResponse.json({ status: cancelled.status });
  } catch (err) {
    console.error('Error cancelling Stripe Connect subscription:', err);
    const message = err instanceof Error ? err.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
