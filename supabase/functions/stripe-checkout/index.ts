// Supabase Edge Function: stripe-checkout
// In-app card payments (no external redirect). Test mode: sk_test_... + price IDs.
//
// Deploy:
//   npx supabase functions deploy stripe-checkout
//   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
//   npx supabase secrets set STRIPE_MONTHLY_PRICE_ID=price_xxx
//   npx supabase secrets set STRIPE_ANNUAL_PRICE_ID=price_xxx
//
// Stripe Dashboard → Settings → Payment methods → enable raw card data APIs (test mode).

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const MONTHLY_PRICE = Deno.env.get('STRIPE_MONTHLY_PRICE_ID') ?? '';
const ANNUAL_PRICE = Deno.env.get('STRIPE_ANNUAL_PRICE_ID') ?? '';

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

function normalizeExpYear(expYear: string | number) {
  const n = typeof expYear === 'string' ? parseInt(expYear, 10) : expYear;
  if (!Number.isFinite(n)) throw new Error('Invalid expiry year');
  return n < 100 ? 2000 + n : n;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405);
  }

  if (!stripe || !stripeKey.startsWith('sk_')) {
    return json({ success: false, error: 'Stripe is not configured on the server.' }, 503);
  }

  try {
    const {
      plan,
      userId,
      userEmail,
      cardNumber,
      expMonth,
      expYear,
      cvc,
      name,
      startTrial,
    } = await req.json();

    const priceId = plan === 'annual' ? ANNUAL_PRICE : MONTHLY_PRICE;
    const trialDays = startTrial && plan !== 'annual' ? 14 : 0;
    if (!priceId) {
      return json({ success: false, error: 'Subscription price is not configured.' }, 503);
    }

    const digits = String(cardNumber || '').replace(/\D/g, '');
    if (digits.length < 15) {
      return json({ success: false, error: 'Invalid card number.' }, 400);
    }

    const expMonthNum = parseInt(String(expMonth), 10);
    const expYearNum = normalizeExpYear(expYear);
    if (!expMonthNum || expMonthNum < 1 || expMonthNum > 12) {
      return json({ success: false, error: 'Invalid expiry month.' }, 400);
    }

    const cvcStr = String(cvc || '').replace(/\D/g, '');
    if (cvcStr.length < 3) {
      return json({ success: false, error: 'Invalid security code.' }, 400);
    }

    // Customer — reuse by email when possible
    let customer: Stripe.Customer;
    if (userEmail) {
      const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
      customer = existing.data[0]
        ?? await stripe.customers.create({
          email: userEmail,
          name: name || undefined,
          metadata: { userId: userId || '' },
        });
    } else {
      customer = await stripe.customers.create({
        name: name || undefined,
        metadata: { userId: userId || '' },
      });
    }

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: digits,
        exp_month: expMonthNum,
        exp_year: expYearNum,
        cvc: cvcStr,
      },
      billing_details: { name: name || undefined },
    });

    await stripe.paymentMethods.attach(paymentMethod.id, { customer: customer.id });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethod.id },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      default_payment_method: paymentMethod.id,
      metadata: { userId: userId || '', plan: plan || 'monthly' },
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      ...(trialDays ? {
        trial_period_days: trialDays,
        trial_settings: {
          end_behavior: { missing_payment_method: 'cancel' },
        },
      } : {}),
    });

    const okStatus = subscription.status === 'active' || subscription.status === 'trialing';
    if (!okStatus) {
      const pi = (subscription.latest_invoice as Stripe.Invoice)?.payment_intent as Stripe.PaymentIntent | undefined;
      const msg = pi?.last_payment_error?.message || `Subscription status: ${subscription.status}`;
      return json({ success: false, error: msg }, 402);
    }

    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString().slice(0, 10)
      : null;
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString().slice(0, 10)
      : null;

    return json({
      success: true,
      isTrialing: subscription.status === 'trialing',
      trialStartDate: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString().slice(0, 10)
        : null,
      trialEndDate: trialEnd,
      subscriptionId: subscription.id,
      customerId: customer.id,
      currentPeriodEnd: periodEnd,
      plan: plan || 'monthly',
    });
  } catch (err) {
    console.error('stripe-checkout error:', err);
    const message = err instanceof Error ? err.message : 'Payment failed. Try again.';
    return json({ success: false, error: message }, 402);
  }
});
