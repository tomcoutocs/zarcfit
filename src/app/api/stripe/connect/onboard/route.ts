import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireTrainer } from '@/lib/api-auth';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

/**
 * Create (or reuse) a Stripe Connect Express account for the trainer and
 * return an Account Link URL to finish onboarding. PF-321.
 */
export async function POST() {
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
    .select('stripe_connect_account_id')
    .eq('id', auth.user.id)
    .single();

  let accountId = profile?.stripe_connect_account_id as string | null | undefined;

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: auth.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: { trainer_id: auth.user.id },
      });
      accountId = account.id;

      await auth.supabase
        .from('trainer_profiles')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', auth.user.id);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zarcfit.vercel.app';

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl}/trainer/settings?connect=refresh`,
      return_url: `${siteUrl}/trainer/settings?connect=return`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error('Error creating Stripe Connect account/link:', err);
    const message = err instanceof Error ? err.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * Refresh + return the trainer's Connect onboarding status. Called when the
 * trainer lands back on Settings after the Stripe onboarding flow, since
 * there's no webhook wired up for `account.updated` yet (MVP scope).
 */
export async function GET() {
  const auth = await requireTrainer();
  if ('response' in auth) return auth.response;

  const { data: profile } = await auth.supabase
    .from('trainer_profiles')
    .select('stripe_connect_account_id, stripe_connect_onboarded')
    .eq('id', auth.user.id)
    .single();

  const accountId = profile?.stripe_connect_account_id as string | null | undefined;
  if (!accountId) {
    return NextResponse.json({ onboarded: false, accountId: null });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ onboarded: Boolean(profile?.stripe_connect_onboarded), accountId });
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);
    const onboarded = Boolean(account.details_submitted && account.charges_enabled);

    if (onboarded !== profile?.stripe_connect_onboarded) {
      await auth.supabase
        .from('trainer_profiles')
        .update({ stripe_connect_onboarded: onboarded })
        .eq('id', auth.user.id);
    }

    return NextResponse.json({ onboarded, accountId });
  } catch (err) {
    console.error('Error refreshing Stripe Connect status:', err);
    return NextResponse.json({ onboarded: Boolean(profile?.stripe_connect_onboarded), accountId });
  }
}
