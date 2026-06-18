import { Platform } from 'react-native';

/** True when the app is running on a local Expo web dev server. */
function isLocalWebDevOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

/** Canonical app origin for OAuth, password reset, and Stripe return URLs. */
export function getAppBaseUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/$/, '');
    // Local `npx expo start --web` must return here after Stripe/OAuth, not production URL from .env.
    if (isLocalWebDevOrigin(origin)) return origin;
  }

  const fromEnv = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'http://localhost:8081';
}

export function buildAppUrl(path = '/') {
  const base = getAppBaseUrl();
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
