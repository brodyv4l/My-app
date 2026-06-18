// Supabase Edge Function: cancel-subscription
// Deploy: npx supabase functions deploy cancel-subscription

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
    const { subscriptionId, userId } = await req.json();
    if (!subscriptionId) {
      return json({ success: false, error: 'Missing subscription ID.' }, 400);
    }

    const existing = await stripe.subscriptions.retrieve(subscriptionId);
    const ownerId = existing.metadata?.userId || '';
    if (userId && ownerId && ownerId !== userId) {
      return json({ success: false, error: 'Subscription does not belong to this account.' }, 403);
    }

    const sub = existing.cancel_at_period_end
      ? existing
      : await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString().slice(0, 10)
      : null;

    return json({
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: periodEnd,
    });
  } catch (err) {
    console.error('cancel-subscription error:', err);
    const message = err instanceof Error ? err.message : 'Cancellation failed.';
    return json({ success: false, error: message }, 500);
  }
});
