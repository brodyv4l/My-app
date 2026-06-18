// Supabase Edge Function: create-checkout
// Deploy: npx supabase functions deploy create-checkout
// Secrets: STRIPE_SECRET_KEY, STRIPE_MONTHLY_PRICE_ID, STRIPE_ANNUAL_PRICE_ID

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const MONTHLY_PRICE = Deno.env.get('STRIPE_MONTHLY_PRICE_ID') ?? '';
const ANNUAL_PRICE = Deno.env.get('STRIPE_ANNUAL_PRICE_ID') ?? '';
const DEFAULT_APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:8081';
const TRIAL_DAYS = 14;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, '');
}

function wantsTrial(plan: string, startTrial: unknown) {
  if (plan === 'annual') return false;
  return startTrial === true || startTrial === 'true' || startTrial === 1 || startTrial === '1';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { plan, email, userId, returnUrl, startTrial } = await req.json();
    const priceId = plan === 'annual' ? ANNUAL_PRICE : MONTHLY_PRICE;
    const base = normalizeBaseUrl(returnUrl || DEFAULT_APP_URL);
    const trial = wantsTrial(plan || 'monthly', startTrial);

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Price ID not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      client_reference_id: userId || undefined,
      success_url: `${base}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}?checkout=cancel`,
      ...(trial ? { payment_method_collection: 'always' } : {}),
      subscription_data: {
        metadata: {
          userId: userId || '',
          plan: plan || 'monthly',
          startTrial: trial ? 'true' : 'false',
        },
        ...(trial ? {
          trial_period_days: TRIAL_DAYS,
          trial_settings: {
            end_behavior: { missing_payment_method: 'cancel' },
          },
        } : {}),
      },
      metadata: {
        userId: userId || '',
        plan: plan || 'monthly',
        startTrial: trial ? 'true' : 'false',
      },
    });

    return new Response(JSON.stringify({ url: session.url, trial }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
