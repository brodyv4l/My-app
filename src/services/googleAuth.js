/*
  Google Sign-In Setup:
  1. Go to console.cloud.google.com
  2. Create a new project or select existing
  3. Enable Google+ API / People API
  4. Go to Credentials → Create OAuth 2.0 Client ID
  5. Add authorized redirect URIs:
     - https://auth.expo.io/@your-username/foodprint
     - Your Supabase callback URL if using Supabase:
       https://[project].supabase.co/auth/v1/callback
  6. Copy Client ID to .env as:
     EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
  7. For iOS: also create an iOS OAuth client ID
     EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
  8. For Android: create Android OAuth client ID
     EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxx
*/

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import { isSupabaseConfigured } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_IOS_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

// expo-auth-session's Google provider throws during render if the required
// client id for the current platform is missing. We now use Supabase OAuth for
// Google sign-in, so this expo-auth-session flow is only a local fallback.
// Guard the hook so a missing client id can never crash the auth screens.
const NOOP_REQUEST = [null, null, async () => ({ type: 'dismiss' })];

export function useGoogleAuthRequest() {
  // Supabase handles Google OAuth — avoid expo-auth-session hook on native (needs platform client IDs).
  if (isSupabaseConfigured) {
    return NOOP_REQUEST;
  }

  const hasPlatformClientId = Platform.OS === 'ios'
    ? !!(GOOGLE_IOS_ID || GOOGLE_WEB_ID)
    : Platform.OS === 'android'
      ? !!(GOOGLE_ANDROID_ID || GOOGLE_WEB_ID)
      : !!GOOGLE_WEB_ID;

  if (!hasPlatformClientId) {
    return NOOP_REQUEST;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return Google.useAuthRequest({
    clientId: GOOGLE_WEB_ID,
    iosClientId: GOOGLE_IOS_ID,
    androidClientId: GOOGLE_ANDROID_ID,
    webClientId: GOOGLE_WEB_ID,
    redirectUri: makeRedirectUri({ scheme: 'foodprint' }),
  });
}

export function isGoogleConfigured() {
  return !!(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID);
}

export async function fetchGoogleUserInfo(accessToken) {
  const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Google profile');
  return res.json();
}
