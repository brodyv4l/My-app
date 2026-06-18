// Supabase Edge Function: verify-checkout
// Deploy: npx supabase functions deploy verify-checkout

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!stripe || !stripeKey.startsWith('sk_')) {
    return json({ success: false, error: 'Stripe is not configured on the server.' }, 503);
  }

  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return json({ success: false, error: 'Missing session ID.' }, 400);
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const paid = session.status === 'complete'
      && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');

    if (!paid) {
      return json({ success: false, error: 'Payment not completed.' }, 402);
    }

    const sub = session.subscription as Stripe.Subscription | string | null;
    const subscription = typeof sub === 'string'
      ? await stripe.subscriptions.retrieve(sub)
      : sub;

    const plan = session.metadata?.plan
      || subscription?.metadata?.plan
      || 'monthly';

    const nowSec = Math.floor(Date.now() / 1000);
    const isTrialing = subscription?.status === 'trialing'
      || session.metadata?.startTrial === 'true'
      || (!!subscription?.trial_end && subscription.trial_end > nowSec);
    const periodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString().slice(0, 10)
      : null;
    const trialEnd = subscription?.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString().slice(0, 10)
      : null;
    const trialStart = subscription?.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString().slice(0, 10)
      : null;

    return json({
      success: true,
      plan,
      isTrialing,
      trialStartDate: trialStart,
      trialEndDate: trialEnd,
      subscriptionId: subscription?.id || null,
      customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
      currentPeriodEnd: periodEnd,
    });
  } catch (err) {
    console.error('verify-checkout error:', err);
    const message = err instanceof Error ? err.message : 'Verification failed.';
    return json({ success: false, error: message }, 500);
  }
});
