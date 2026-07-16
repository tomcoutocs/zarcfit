import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in environment.' },
      { status: 503 }
    );
  }

  const { customerId } = await request.json();
  if (!customerId) {
    return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zarcfit.vercel.app';

  const params = new URLSearchParams({
    customer: customerId,
    return_url: `${siteUrl}/trainer/settings?billing=portal`,
  });

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
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
