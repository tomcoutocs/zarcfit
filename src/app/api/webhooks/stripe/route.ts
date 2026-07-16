import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { tierFromStripePriceId } from '@/lib/trainer-plans';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

async function updateTrainerSubscription(
  admin: ReturnType<typeof getAdminClient>,
  trainerId: string,
  fields: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string | null;
    subscription_status?: string;
    subscription_tier?: string;
  }
) {
  if (!admin) return;
  await admin.from('trainer_profiles').update(fields).eq('id', trainerId);
}

async function resolveTierFromSubscription(stripe: Stripe, subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;
  return tierFromStripePriceId(priceId);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const stripe = getStripe();
  const admin = getAdminClient();

  if (!webhookSecret || !stripe || !admin) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const trainerId =
      session.metadata?.trainer_id ||
      session.client_reference_id ||
      null;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

    if (trainerId && customerId) {
      let tier = 'starter';
      if (subscriptionId) {
        tier = await resolveTierFromSubscription(stripe, subscriptionId);
      }

      await updateTrainerSubscription(admin, trainerId, {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId ?? null,
        subscription_status: 'active',
        subscription_tier: tier,
      });
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    if (!customerId) return NextResponse.json({ received: true });

    const tier = tierFromStripePriceId(subscription.items.data[0]?.price?.id);
    const status =
      subscription.status === 'active' || subscription.status === 'trialing'
        ? 'active'
        : subscription.status;

    await admin
      .from('trainer_profiles')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: status,
        subscription_tier: tier,
      })
      .eq('stripe_customer_id', customerId);
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    if (!customerId) return NextResponse.json({ received: true });

    await admin
      .from('trainer_profiles')
      .update({
        stripe_subscription_id: null,
        subscription_status: 'cancelled',
        subscription_tier: 'free',
      })
      .eq('stripe_customer_id', customerId);
  }

  return NextResponse.json({ received: true });
}
