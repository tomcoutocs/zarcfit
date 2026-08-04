import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireTrainer } from '@/lib/api-auth';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

/**
 * Voids an unpaid Connect invoice so it stops being collectible (CA-403).
 * `invoiceId` is our `trainer_client_invoices.id`, not the Stripe invoice ID.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const auth = await requireTrainer();
  if ('response' in auth) return auth.response;

  const { invoiceId } = await params;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in environment.' },
      { status: 503 }
    );
  }

  const { data: row } = await auth.supabase
    .from('trainer_client_invoices')
    .select('stripe_invoice_id, stripe_account_id')
    .eq('id', invoiceId)
    .eq('trainer_id', auth.user.id)
    .single();

  if (!row) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  try {
    const voided = await stripe.invoices.voidInvoice(
      row.stripe_invoice_id,
      {},
      { stripeAccount: row.stripe_account_id }
    );

    await auth.supabase
      .from('trainer_client_invoices')
      .update({
        status: voided.status || 'void',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    return NextResponse.json({ status: voided.status });
  } catch (err) {
    console.error('Error voiding Stripe Connect invoice:', err);
    const message = err instanceof Error ? err.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
