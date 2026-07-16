import { NextRequest, NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const auth = await requireTrainer();
  if ('response' in auth) return auth.response;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in environment.' },
      { status: 503 }
    );
  }

  const { priceId } = await request.json();
  if (!priceId) {
    return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zarcfit.vercel.app';
  const customerEmail = auth.user.email;
  if (!customerEmail) {
    return NextResponse.json({ error: 'Account email required' }, { status: 400 });
  }

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    customer_email: customerEmail,
    client_reference_id: auth.user.id,
    'metadata[trainer_id]': auth.user.id,
    success_url: `${siteUrl}/trainer/settings?billing=success`,
    cancel_url: `${siteUrl}/main/plans?billing=cancelled`,
  });

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.error?.message || 'Stripe error' }, { status: 502 });
  }

  return NextResponse.json({ url: data.url });
}
