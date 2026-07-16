import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in environment.' },
      { status: 503 }
    );
  }

  const { priceId, customerEmail } = await request.json();
  if (!priceId || !customerEmail) {
    return NextResponse.json({ error: 'Missing priceId or customerEmail' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zarcfit.vercel.app';

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    customer_email: customerEmail,
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
