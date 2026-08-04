import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireTrainer } from '@/lib/api-auth';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

/**
 * Send a one-off Stripe invoice from a trainer to one of their clients,
 * billed on the trainer's connected Express account (PF-322/323).
 *
 * Platform fee: ZarcFit takes 0% of client payments for now (decision,
 * July 30 2026). To introduce a cut later, add `application_fee_amount`
 * (in cents) to the `stripe.invoices.create` call below — Stripe requires
 * the platform to be the one setting that fee, so it can't be bolted on
 * without a code change.
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
      { error: 'Connect your Stripe account in Settings before sending invoices.' },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const clientEmail: string | undefined = body?.clientEmail;
  const clientName: string | undefined = body?.clientName;
  const description: string | undefined = body?.description;
  const clientId: string | undefined = body?.clientId;
  const amountCents = Number(body?.amountCents);

  if (!clientEmail || !/\S+@\S+\.\S+/.test(clientEmail)) {
    return NextResponse.json({ error: 'A valid clientEmail is required' }, { status: 400 });
  }
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: 'amountCents must be a positive number' }, { status: 400 });
  }

  const stripeAccount = accountId;

  try {
    // Customers, invoices, and invoice items all live on the connected
    // account — every call below is scoped with { stripeAccount }.
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

    await stripe.invoiceItems.create(
      {
        customer: customer.id,
        amount: Math.round(amountCents),
        currency: 'usd',
        description: description || 'Training services',
      },
      { stripeAccount }
    );

    const invoice = await stripe.invoices.create(
      {
        customer: customer.id,
        collection_method: 'send_invoice',
        days_until_due: 7,
        pending_invoice_items_behavior: 'include',
        description: description || undefined,
        metadata: {
          trainer_id: auth.user.id,
          ...(clientId ? { client_id: clientId } : {}),
        },
        // No application_fee_amount — see file header comment.
      },
      { stripeAccount }
    );

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id, {}, { stripeAccount });
    const sent = await stripe.invoices.sendInvoice(finalized.id, {}, { stripeAccount });

    // CA-401: persist so the roster/detail UI can show status without
    // round-tripping to Stripe; kept in sync afterwards by the Connect
    // webhook (src/app/api/webhooks/stripe-connect/route.ts).
    const { error: upsertError } = await auth.supabase.from('trainer_client_invoices').upsert(
      {
        trainer_id: auth.user.id,
        client_id: clientId || null,
        stripe_invoice_id: sent.id,
        stripe_account_id: accountId,
        amount_cents: sent.amount_due ?? Math.round(amountCents),
        currency: sent.currency || 'usd',
        status: sent.status || 'open',
        description: description || null,
        hosted_invoice_url: sent.hosted_invoice_url || null,
        due_date: sent.due_date ? new Date(sent.due_date * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_invoice_id' }
    );

    if (upsertError) {
      // Non-fatal — the invoice was already sent to the client. Log so we
      // can investigate why local sync failed (e.g. table not migrated yet).
      console.error('Error saving invoice record:', upsertError);
    }

    return NextResponse.json({
      invoiceId: sent.id,
      hostedInvoiceUrl: sent.hosted_invoice_url,
      status: sent.status,
    });
  } catch (err) {
    console.error('Error creating Stripe Connect invoice:', err);
    const message = err instanceof Error ? err.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
