import { Platform } from 'react-native';

/** True when the current URL looks like a Supabase OAuth redirect callback. */
export function hasOAuthCallbackInUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const { hash, search } = window.location;
  return (
    hash.includes('access_token=')
    || search.includes('code=')
    || search.includes('error=')
    || search.includes('error_description=')
  );
}

/** Strip OAuth query/hash params from the address bar. */
export function clearOAuthParamsFromUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const path = window.location.pathname || '/';
  window.history.replaceState({}, document.title, path);
}

/** Read OAuth error params from the callback URL (if any). */
export function parseOAuthCallbackError() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
  const raw = params.get('error_description')
    || hashParams.get('error_description')
    || params.get('error')
    || hashParams.get('error');
  if (!raw) return null;
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '));
  } catch {
    return raw.replace(/\+/g, ' ');
  }
}

/**
 * Redirect URL Supabase should send the browser back to after Google OAuth.
 * Must exactly match the origin the user is on when they click "Sign in"
 * and when they land with ?code= (PKCE flow state is tied to this URL).
 */
export function getWebOAuthRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return undefined;
}
