import { NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api-auth';

export async function POST() {
  const auth = await requireTrainer();
  if ('response' in auth) return auth.response;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in environment.' },
      { status: 503 }
    );
  }

  const { data: profile } = await auth.supabase
    .from('trainer_profiles')
    .select('stripe_customer_id')
    .eq('id', auth.user.id)
    .single();

  const customerId = profile?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json(
      { error: 'No Stripe customer on file. Subscribe to a plan first.' },
      { status: 400 }
    );
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
