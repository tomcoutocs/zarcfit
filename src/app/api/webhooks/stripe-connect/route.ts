import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

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

/**
 * Handles Stripe events from trainers' *connected* Express accounts —
 * separate from the platform SaaS webhook at /api/webhooks/stripe, which
 * only ever sees events on the platform account. CA-401.
 *
 * Configure this as its own endpoint in the Stripe Dashboard (Developers →
 * Webhooks → Add endpoint → toggle "Listen to events on Connected
 * accounts"), which populates `event.account` with the connected account
 * ID for every event. See STRIPE_SETUP.md.
 */
function resolveInvoiceStatus(invoice: Stripe.Invoice, eventType: string): string {
  if (eventType === 'invoice.payment_failed') return 'payment_failed';
  if (eventType === 'invoice.voided') return 'void';
  if (eventType === 'invoice.paid') return 'paid';
  return invoice.status || 'open';
}

async function syncInvoice(
  admin: NonNullable<ReturnType<typeof getAdminClient>>,
  invoice: Stripe.Invoice,
  accountId: string,
  eventType: string
) {
  // Only invoices created through /api/stripe/connect/invoice carry this
  // metadata — ignore anything else on the connected account.
  const trainerId = invoice.metadata?.trainer_id;
  if (!trainerId || !invoice.id) return;

  const { error } = await admin.from('trainer_client_invoices').upsert(
    {
      trainer_id: trainerId,
      client_id: invoice.metadata?.client_id || null,
      stripe_invoice_id: invoice.id,
      stripe_account_id: accountId,
      amount_cents: invoice.amount_due ?? invoice.total ?? 0,
      currency: invoice.currency || 'usd',
      status: resolveInvoiceStatus(invoice, eventType),
      description: invoice.description || null,
      hosted_invoice_url: invoice.hosted_invoice_url || null,
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_invoice_id' }
  );

  if (error) console.error('Error syncing Connect invoice from webhook:', error);
}

async function syncSubscription(
  admin: NonNullable<ReturnType<typeof getAdminClient>>,
  subscription: Stripe.Subscription,
  accountId: string
) {
  const trainerId = subscription.metadata?.trainer_id;
  if (!trainerId) return;

  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  const item = subscription.items.data[0];

  const { error } = await admin.from('trainer_client_subscriptions').upsert(
    {
      trainer_id: trainerId,
      client_id: subscription.metadata?.client_id || null,
      stripe_account_id: accountId,
      stripe_customer_id: customerId || '',
      stripe_subscription_id: subscription.id,
      stripe_price_id: item?.price?.id || null,
      amount_cents: item?.price?.unit_amount ?? 0,
      currency: subscription.currency || 'usd',
      interval: item?.price?.recurring?.interval || 'month',
      status: subscription.status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' }
  );

  if (error) console.error('Error syncing Connect subscription from webhook:', error);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET?.trim();
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

  // Connect webhook endpoints populate `event.account`; fall back to a
  // Stripe-Account header in case this is ever wired up differently.
  const accountId = event.account || request.headers.get('stripe-account');
  if (!accountId) {
    return NextResponse.json({ received: true });
  }

  const invoiceEventTypes = ['invoice.paid', 'invoice.payment_failed', 'invoice.voided', 'invoice.updated'];
  if (invoiceEventTypes.includes(event.type)) {
    await syncInvoice(admin, event.data.object as Stripe.Invoice, accountId, event.type);
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    await syncSubscription(admin, event.data.object as Stripe.Subscription, accountId);
  }

  return NextResponse.json({ received: true });
}
