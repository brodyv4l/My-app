import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const hasCredentials = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Storage adapter: AsyncStorage on native, browser localStorage on web
const webStorage = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : undefined;
const storage = Platform.OS === 'web'
  ? webStorage
  : {
      getItem: (key) => AsyncStorage.getItem(key),
      setItem: (key, value) => AsyncStorage.setItem(key, value),
      removeItem: (key) => AsyncStorage.removeItem(key),
    };

const isWebClient = Platform.OS === 'web';

let _client = null;
if (hasCredentials) {
  try {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        // Web SPA: let supabase-js exchange ?code= once on load (avoid double exchange).
        detectSessionInUrl: isWebClient,
        flowType: 'pkce',
      },
    });
  } catch (e) {
    console.warn('Supabase client init failed:', e?.message);
    _client = null;
  }
}

export const supabase = _client;

// Only "configured" if the client actually initialized
export const isSupabaseConfigured = Boolean(_client);

export function supabaseUserToApp(sbUser) {
  if (!sbUser) return null;
  const meta = sbUser.user_metadata || {};
  const provider = sbUser.app_metadata?.provider
    || sbUser.identities?.find((i) => i.provider)?.provider
    || 'email';
  return {
    uid: sbUser.id,
    email: sbUser.email || '',
    name: meta.full_name || meta.name || meta.display_name || '',
    avatarUrl: meta.avatar_url || meta.picture || null,
    authProvider: provider,
    googleId: provider === 'google' ? (meta.sub || sbUser.id) : null,
    provider: 'supabase',
  };
}
