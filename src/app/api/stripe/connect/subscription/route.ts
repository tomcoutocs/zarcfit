import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireTrainer } from '@/lib/api-auth';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

/**
 * Creates a recurring monthly (or annual) coaching subscription for a
 * client, billed on the trainer's connected Express account (CA-404).
 * Mirrors the one-off invoice flow in ../invoice/route.ts: same Connect
 * account gate, same 0% platform fee (no application_fee_percent).
 */
export async function POST(request: NextRequest) {
  const auth = await requireTrainer();
  if ('response' in auth) return auth.response;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in environment.' },
      { status: 503 }
    );
  }

  const { data: profile } = await auth.supabase
    .from('trainer_profiles')
    .select('stripe_connect_account_id, stripe_connect_onboarded')
    .eq('id', auth.user.id)
    .single();

  const accountId = profile?.stripe_connect_account_id as string | null | undefined;
  if (!accountId || !profile?.stripe_connect_onboarded) {
    return NextResponse.json(
      { error: 'Connect your Stripe account in Settings before creating a subscription.' },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const clientEmail: string | undefined = body?.clientEmail;
  const clientName: string | undefined = body?.clientName;
  const clientId: string | undefined = body?.clientId;
  const description: string | undefined = body?.description;
  const amountCents = Number(body?.amountCents);
  const interval: 'month' | 'year' = body?.interval === 'year' ? 'year' : 'month';

  if (!clientEmail || !/\S+@\S+\.\S+/.test(clientEmail)) {
    return NextResponse.json({ error: 'A valid clientEmail is required' }, { status: 400 });
  }
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: 'amountCents must be a positive number' }, { status: 400 });
  }

  const stripeAccount = accountId;

  try {
    const existing = await stripe.customers.list({ email: clientEmail, limit: 1 }, { stripeAccount });
    const customer =
      existing.data[0] ||
      (await stripe.customers.create(
        {
          email: clientEmail,
          name: clientName || undefined,
          metadata: clientId ? { client_id: clientId } : undefined,
        },
        { stripeAccount }
      ));

    // Subscription items only accept an existing product ID in price_data
    // (unlike Checkout Sessions, which allow inline `product_data`) — so
    // create a lightweight product on the connected account first.
    const product = await stripe.products.create(
      { name: description || 'Coaching subscription' },
      { stripeAccount }
    );

    const subscription = await stripe.subscriptions.create(
      {
        customer: customer.id,
        items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(amountCents),
              recurring: { interval },
              product: product.id,
            },
          },
        ],
        metadata: {
          trainer_id: auth.user.id,
          ...(clientId ? { client_id: clientId } : {}),
        },
        // No application_fee_percent — 0% platform fee, matches invoicing.
      },
      { stripeAccount }
    );

    const item = subscription.items.data[0];

    const { error: upsertError } = await auth.supabase.from('trainer_client_subscriptions').upsert(
      {
        trainer_id: auth.user.id,
        client_id: clientId || null,
        stripe_account_id: accountId,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: item?.price?.id || null,
        amount_cents: Math.round(amountCents),
        currency: 'usd',
        interval,
        status: subscription.status,
        description: description || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' }
    );

    if (upsertError) {
      console.error('Error saving subscription record:', upsertError);
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (err) {
    console.error('Error creating Stripe Connect subscription:', err);
    const message = err instanceof Error ? err.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
