import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase, isSupabaseConfigured } from './supabase';
import { getAppBaseUrl } from '../utils/appUrl';

/**
 * In-app card payment via stripe-checkout edge function (native / fallback).
 */
export async function processStripeCheckout({
  plan,
  userId,
  userEmail,
  cardNumber,
  expMonth,
  expYear,
  cvc,
  name,
  startTrial = false,
}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Payments are not configured. Use an access code or try again later.');
  }

  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      plan,
      userId: userId || undefined,
      userEmail: userEmail || undefined,
      cardNumber: String(cardNumber || '').replace(/\s/g, ''),
      expMonth,
      expYear,
      cvc,
      name,
      startTrial: !!startTrial,
    },
  });

  if (error) {
    throw new Error(error.message || 'Payment failed. Try again.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.success) {
    throw new Error('Payment failed. Try again.');
  }

  return data;
}

/**
 * Stripe Checkout redirect (recommended on web — no raw card API required).
 */
export async function startStripeCheckoutRedirect({ plan, userId, userEmail, startTrial = false }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Payments are not configured. Use an access code or try again later.');
  }

  const returnUrl = getAppBaseUrl();
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      plan,
      userId: userId || undefined,
      email: userEmail || undefined,
      returnUrl,
      startTrial: !!startTrial,
    },
  });

  if (error) {
    throw new Error(error.message || 'Could not start checkout.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.url) {
    throw new Error('Checkout URL missing. Deploy the create-checkout edge function.');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(data.url);
    return { redirecting: true };
  }

  await WebBrowser.openBrowserAsync(data.url);
  return { redirecting: true };
}

/** Verify a completed Stripe Checkout session and return subscription details. */
export async function verifyStripeCheckoutSession(sessionId) {
  if (!isSupabaseConfigured || !supabase || !sessionId) {
    throw new Error('Invalid checkout session.');
  }

  const { data, error } = await supabase.functions.invoke('verify-checkout', {
    body: { sessionId },
  });

  if (error) {
    throw new Error(error.message || 'Could not verify payment.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.success) {
    throw new Error('Payment was not completed.');
  }

  return data;
}

/** Cancel a Stripe subscription at period end (keeps Pro until billing period ends). */
export async function cancelStripeSubscription(subscriptionId, userId) {
  if (!isSupabaseConfigured || !supabase || !subscriptionId) {
    throw new Error('No active subscription to cancel.');
  }

  const { data, error } = await supabase.functions.invoke('cancel-subscription', {
    body: { subscriptionId, userId: userId || undefined },
  });

  if (error) {
    throw new Error(error.message || 'Could not cancel subscription.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.success) {
    throw new Error('Could not cancel subscription.');
  }

  return data;
}

const CHECKOUT_SESSION_KEY = 'foodprint-checkout-session';
const CHECKOUT_STATUS_KEY = 'foodprint-checkout-status';

export function parseCheckoutCallbackFromUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const checkout = params.get('checkout');
  if (!checkout) return null;
  return {
    status: checkout,
    sessionId: params.get('session_id') || null,
  };
}

/** Persist Stripe return params immediately so a reload/auth race cannot lose them. */
export function stashCheckoutReturnFromUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const callback = parseCheckoutCallbackFromUrl();
  if (!callback) return null;
  if (callback.sessionId) window.sessionStorage.setItem(CHECKOUT_SESSION_KEY, callback.sessionId);
  window.sessionStorage.setItem(CHECKOUT_STATUS_KEY, callback.status);
  return callback;
}

export function readStashedCheckoutReturn() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const status = window.sessionStorage.getItem(CHECKOUT_STATUS_KEY);
  if (!status) return null;
  return {
    status,
    sessionId: window.sessionStorage.getItem(CHECKOUT_SESSION_KEY) || null,
  };
}

export function clearStashedCheckoutReturn() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  window.sessionStorage.removeItem(CHECKOUT_STATUS_KEY);
}

export function clearCheckoutParamsFromUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const path = window.location.pathname || '/';
  window.history.replaceState({}, document.title, path);
  clearStashedCheckoutReturn();
}
