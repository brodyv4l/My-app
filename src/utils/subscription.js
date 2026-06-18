import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_CODES, REDEEMED_CODES_KEY, CUSTOM_CODES_KEY } from '../constants/accessCodes';

export const TRIAL_DAYS = 14;

export function checkIsPro(profile) {
  if (!profile) return false;
  if (profile.isFounder) return true;
  if (profile.subscriptionStatus === 'pro') return true;
  if (profile.stripeSubscriptionId && !profile.subscriptionCancelAtPeriodEnd) return true;
  if (profile.subscriptionStatus === 'trial') {
    if (profile.trialEndDate) {
      const end = new Date(profile.trialEndDate + 'T23:59:59');
      if (end < new Date()) return false;
    }
    return true;
  }
  return false;
}

export function daysRemainingInTrial(profile) {
  if (profile.subscriptionStatus !== 'trial' || !profile.trialEndDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(profile.trialEndDate + 'T00:00:00');
  endDate.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((endDate - today) / msPerDay);
  // Never show more than TRIAL_DAYS, never below 0.
  return Math.min(Math.max(daysRemaining, 0), TRIAL_DAYS);
}

export function trialUsed(profile) {
  return !!(profile.trialStartDate && profile.trialEndDate);
}

export function trialExpired(profile) {
  if (!profile?.trialEndDate) return false;
  return new Date(profile.trialEndDate + 'T23:59:59') < new Date();
}

/** True when user had a trial, it lapsed, and they have no active Stripe subscription. */
export function shouldShowTrialExpired(profile) {
  if (!profile || profile.isFounder || profile.subscriptionStatus === 'pro') return false;
  if (profile.stripeSubscriptionId && !profile.subscriptionCancelAtPeriodEnd) return false;
  if (!trialUsed(profile) || !trialExpired(profile)) return false;
  return true;
}

export function effectiveSubscriptionStatus(profile) {
  if (!profile) return 'free';
  if (profile.isFounder || profile.subscriptionStatus === 'pro') return 'pro';
  // Stripe trial still active
  if (profile.subscriptionStatus === 'trial' && !trialExpired(profile)) return 'trial';
  // Stripe subscription continues after trial (auto-billing) unless cancelled
  if (profile.stripeSubscriptionId && !profile.subscriptionCancelAtPeriodEnd) return 'pro';
  if (profile.subscriptionStatus === 'trial' && trialExpired(profile)) return 'free';
  return profile.subscriptionStatus || 'free';
}

async function getRedeemedCodes() {
  try {
    const raw = await AsyncStorage.getItem(REDEEMED_CODES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function getCustomCodes() {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_CODES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function getAllCodes() {
  const custom = await getCustomCodes();
  return [...ACCESS_CODES, ...custom];
}

export async function redeemAccessCode(codeInput, userEmail) {
  const code = (codeInput || '').trim().toUpperCase();
  if (!code) return { ok: false, error: 'Please enter a code.' };

  const allCodes = await getAllCodes();
  const match = allCodes.find((c) => c.code === code);
  if (!match) return { ok: false, error: 'Invalid code. Check spelling and try again.' };
  if (!match.isActive) return { ok: false, error: 'This code has been deactivated.' };
  if (match.expiresAt && new Date(match.expiresAt) < new Date()) {
    return { ok: false, error: 'This code has expired.' };
  }

  const redeemed = await getRedeemedCodes();
  const usesForCode = redeemed.filter((r) => r.code === code).length;
  if (match.maxUses && usesForCode >= match.maxUses) {
    return { ok: false, error: 'This code has reached its maximum number of uses.' };
  }
  if (redeemed.some((r) => r.usedBy === userEmail)) {
    return { ok: false, error: "You've already redeemed an access code." };
  }

  const entry = { code, usedBy: userEmail || 'anonymous', usedAt: new Date().toISOString() };
  await AsyncStorage.setItem(REDEEMED_CODES_KEY, JSON.stringify([...redeemed, entry]));

  return {
    ok: true,
    type: match.type,
    code,
    profileUpdates: {
      subscriptionStatus: 'pro',
      accessCodeUsed: code,
      subscriptionEndDate: null,
      isFounder: match.type === 'founder',
      subscriptionPlan: null,
    },
  };
}

export async function createCustomCode({ code, type, maxUses }) {
  const custom = await getCustomCodes();
  const entry = {
    code: code.toUpperCase(),
    type: type === 'founder' ? 'founder' : 'friend',
    maxUses: maxUses === 'unlimited' ? null : Number(maxUses) || 10,
    isActive: true,
    expiresAt: null,
  };
  await AsyncStorage.setItem(CUSTOM_CODES_KEY, JSON.stringify([...custom, entry]));
  return entry;
}

export async function getCodeStats() {
  const redeemed = await getRedeemedCodes();
  const custom = await getCustomCodes();
  const all = [...ACCESS_CODES, ...custom];
  return all.map((c) => ({
    ...c,
    used: redeemed.filter((r) => r.code === c.code).length,
    status: c.isActive ? 'Active' : 'Inactive',
  }));
}
