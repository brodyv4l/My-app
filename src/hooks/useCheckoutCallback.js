import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { TRIAL_DAYS } from '../utils/subscription';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import {
  parseCheckoutCallbackFromUrl,
  readStashedCheckoutReturn,
  clearCheckoutParamsFromUrl,
  verifyStripeCheckoutSession,
} from '../services/stripeCheckout';

import { getLocalDateString, shiftLocalDateKey } from '../utils/dates';

function addDays(isoDate, days) {
  return shiftLocalDateKey(isoDate, days);
}

function readCheckoutReturn() {
  return parseCheckoutCallbackFromUrl() || readStashedCheckoutReturn();
}

/**
 * Handles Stripe Checkout return URLs:
 *   ?checkout=success&session_id=...
 *   ?checkout=cancel
 */
export function useCheckoutCallback() {
  const { user, loading: authLoading } = useAuth();
  const { updateProfile } = useUser();
  const { showToast } = useToast();
  const handledRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || handledRef.current || authLoading || !user?.uid) return;

    const callback = readCheckoutReturn();
    if (!callback) return;

    if (callback.status === 'cancel') {
      handledRef.current = true;
      clearCheckoutParamsFromUrl();
      showToast('Checkout cancelled', 'info');
      return;
    }

    if (callback.status !== 'success' || !callback.sessionId) {
      showToast('Checkout incomplete', 'error');
      return;
    }

    handledRef.current = true;

    (async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw new Error(sessionError.message);
          if (!sessionData?.session) {
            throw new Error('Sign in again to activate your subscription.');
          }
        }

        const result = await verifyStripeCheckoutSession(callback.sessionId);
        const today = getLocalDateString();

        if (result.isTrialing) {
          const trialStart = result.trialStartDate || today;
          let trialEnd = result.trialEndDate || addDays(trialStart, TRIAL_DAYS);
          if (trialEnd <= today) trialEnd = addDays(today, TRIAL_DAYS);
          await updateProfile({
            subscriptionStatus: 'trial',
            subscriptionPlan: 'monthly',
            trialStartDate: trialStart,
            trialEndDate: trialEnd,
            subscriptionStartDate: today,
            subscriptionEndDate: result.currentPeriodEnd || trialEnd,
            subscriptionCancelAtPeriodEnd: false,
            stripeSubscriptionId: result.subscriptionId || null,
            stripeCustomerId: result.customerId || null,
          });
          clearCheckoutParamsFromUrl();
          showToast(`Your ${TRIAL_DAYS}-day Pro trial has started!`, 'success');
          return;
        }

        const end = result.currentPeriodEnd
          ? result.currentPeriodEnd
          : addDays(today, result.plan === 'annual' ? 365 : 30);

        await updateProfile({
          subscriptionStatus: 'pro',
          subscriptionPlan: result.plan || 'monthly',
          subscriptionStartDate: today,
          subscriptionEndDate: end,
          subscriptionCancelAtPeriodEnd: false,
          stripeSubscriptionId: result.subscriptionId || null,
          stripeCustomerId: result.customerId || null,
        });
        clearCheckoutParamsFromUrl();
        showToast('Welcome to Pro!', 'success');
      } catch (e) {
        handledRef.current = false;
        showToast(e?.message || 'Could not confirm payment', 'error');
      }
    })();
  }, [authLoading, user?.uid, showToast, updateProfile]);
}
