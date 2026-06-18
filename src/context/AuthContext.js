import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured, supabaseUserToApp } from '../services/supabase';
import { ensureUserProfile } from '../services/supabaseData';
import { getWebOAuthRedirectUrl, hasOAuthCallbackInUrl, parseOAuthCallbackError, clearOAuthParamsFromUrl } from '../services/authSession';
import { buildAppUrl } from '../utils/appUrl';
import { fetchGoogleUserInfo } from '../services/googleAuth';
import { isFirebaseConfigured, subscribeToAuth, signUpWithEmail, signInWithEmail, signInWithGoogle, resetPassword, logOut } from '../services/firebase';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext(null);
const LOCAL_USERS_KEY = 'foodprint-local-users';
const LOCAL_SESSION_KEY = 'foodprint-session';

async function getLocalUsers() {
  const raw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}
async function saveLocalUsers(users) {
  await AsyncStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const bootstrappedRef = useRef(false);

  const setLocalSession = useCallback(async (u) => {
    setUser(u);
    if (u) await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
    else await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
  }, []);

  const applySessionUser = useCallback(async (sbUser) => {
    const appUser = supabaseUserToApp(sbUser);
    setUser(appUser);
    if (appUser?.uid) {
      ensureUserProfile(appUser.uid, sbUser).catch((e) => {
        console.warn('ensureUserProfile:', e?.message);
      });
    }
    return appUser;
  }, []);

  useEffect(() => {
    let active = true;
    let supaSub;

    async function bootstrap() {
      try {
        if (isSupabaseConfigured) {
          if (Platform.OS === 'web' && hasOAuthCallbackInUrl()) {
            const oauthErr = parseOAuthCallbackError();
            if (oauthErr) {
              clearOAuthParamsFromUrl();
              if (active) setAuthError(oauthErr);
            }
          }

          // detectSessionInUrl (web) exchanges ?code= automatically inside getSession().
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError && active) {
            console.warn('getSession:', sessionError.message);
            if (hasOAuthCallbackInUrl()) {
              setAuthError(sessionError.message || 'Google sign-in failed.');
              clearOAuthParamsFromUrl();
            }
          } else if (active && data?.session?.user) {
            if (Platform.OS === 'web' && hasOAuthCallbackInUrl()) {
              clearOAuthParamsFromUrl();
            }
            await applySessionUser(data.session.user);
          } else if (active) {
            setUser(null);
          }
          bootstrappedRef.current = true;
        } else if (!isFirebaseConfigured) {
          const s = await AsyncStorage.getItem(LOCAL_SESSION_KEY);
          if (active && s) setUser(JSON.parse(s));
        }
      } catch (e) {
        console.warn('Auth init failed:', e?.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    let fbUnsub;
    if (isFirebaseConfigured && !isSupabaseConfigured) {
      fbUnsub = subscribeToAuth((fbUser) => {
        setUser(fbUser ? { uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName || '', provider: 'firebase' } : null);
        if (active) setLoading(false);
      });
    } else if (isSupabaseConfigured) {
      const res = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!active) return;
        if (__DEV__) console.log('Auth state change:', event, session?.user?.email);

        if (session?.user) {
          await applySessionUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'INITIAL_SESSION' && bootstrappedRef.current && !session) {
          setUser(null);
        }
      });
      supaSub = res?.data?.subscription;
      bootstrap();
    } else {
      bootstrap();
    }

    return () => {
      active = false;
      if (supaSub) supaSub.unsubscribe();
      if (fbUnsub) fbUnsub();
    };
  }, [applySessionUser]);

  const signUp = useCallback(async (email, password, name) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || '' } },
      });
      if (!error && data?.session?.user) {
        const appUser = await applySessionUser(data.session.user);
        return { ...appUser, isNew: true };
      }
      if (error) throw new Error(error.message);
      throw new Error('Check your email to confirm your account, then sign in.');
    }
    if (isFirebaseConfigured) {
      const fbUser = await signUpWithEmail(email, password, name);
      return { uid: fbUser.uid, email: fbUser.email, name: name || '', provider: 'firebase' };
    }
    const users = await getLocalUsers();
    if (users[email]) throw new Error('Account already exists');
    const su = { uid: 'local-' + Date.now(), email, name: name || '', provider: 'local', password };
    users[email] = su;
    await saveLocalUsers(users);
    const { password: _p, ...safe } = su;
    await setLocalSession(safe);
    return safe;
  }, [applySessionUser, setLocalSession]);

  const signIn = useCallback(async (email, password) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.session?.user) {
        const appUser = await applySessionUser(data.session.user);
        return appUser;
      }
      throw new Error(error?.message || 'Invalid email or password');
    }
    if (isFirebaseConfigured) {
      const fbUser = await signInWithEmail(email, password);
      return { uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName || '', provider: 'firebase' };
    }
    const users = await getLocalUsers();
    const found = users[email];
    if (!found || found.password !== password) throw new Error('Invalid email or password');
    const { password: _p, ...safe } = found;
    await setLocalSession(safe);
    return safe;
  }, [applySessionUser, setLocalSession]);

  const googleSignIn = useCallback(async () => {
    if (isSupabaseConfigured) {
      if (Platform.OS === 'web') {
        const redirectTo = getWebOAuthRedirectUrl();
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
        if (error) throw new Error(error.message);
        if (data?.url) window.location.assign(data.url);
        return;
      }

      const redirectTo = AuthSession.makeRedirectUri({
        scheme: 'foodprint',
        path: 'auth/callback',
      });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw new Error(error.message);

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          const url = result.url;

          if (url.includes('code=')) {
            const { data: cd, error: ce } = await supabase.auth.exchangeCodeForSession(url);
            if (ce) throw new Error(ce.message);
            if (cd?.user) return applySessionUser(cd.user);
          }

          const hash = url.includes('#') ? url.split('#')[1] : '';
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken) {
            const { data: sd, error: se } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            if (se) throw new Error(se.message);
            if (sd?.user) return applySessionUser(sd.user);
          }

          const { data: gs } = await supabase.auth.getSession();
          if (gs?.session?.user) return applySessionUser(gs.session.user);
          throw new Error('Google sign-in did not return a session. Add this redirect URL in Supabase: ' + redirectTo);
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          return null;
        }
      }
      return;
    }
    if (isFirebaseConfigured) {
      const fbUser = await signInWithGoogle();
      return { uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName || '', provider: 'firebase' };
    }
    throw new Error('Configure Supabase or Firebase for Google sign-in');
  }, [applySessionUser]);

  const googleSignInWithToken = useCallback(async (accessToken) => {
    const userInfo = await fetchGoogleUserInfo(accessToken);
    const users = await getLocalUsers();
    const email = userInfo.email;
    if (!email) throw new Error('Google sign-in failed');
    let su = users[email];
    const isNew = !su;
    su = su
      ? { ...su, name: userInfo.name || su.name, avatarUrl: userInfo.picture || su.avatarUrl, googleId: userInfo.id, authProvider: 'google', isNew: false }
      : { uid: 'google-' + userInfo.id, email, name: userInfo.name || '', provider: 'google', googleId: userInfo.id, avatarUrl: userInfo.picture || null, authProvider: 'google', isNew: true };
    users[email] = su;
    await saveLocalUsers(users);
    const { password: _p, ...safe } = su;
    await setLocalSession(safe);
    return { ...safe, isNew };
  }, [setLocalSession]);

  const forgotPassword = useCallback(async (email) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildAppUrl('/'),
      });
      if (error) throw new Error(error.message);
      return;
    }
    if (isFirebaseConfigured) { await resetPassword(email); return; }
    throw new Error('Password reset is not available in demo mode.');
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      if (isSupabaseConfigured) await supabase.auth.signOut();
      else if (isFirebaseConfigured) await logOut();
    } catch (e) { console.warn('signOut:', e?.message); }
    await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async (email) => {
    const users = await getLocalUsers();
    if (email && users[email]) { delete users[email]; await saveLocalUsers(users); }
    try {
      if (isSupabaseConfigured) await supabase.auth.signOut();
      else if (isFirebaseConfigured) await logOut();
    } catch (e) { console.warn('deleteAccount:', e?.message); }
    await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      authError,
      clearAuthError: () => setAuthError(null),
      signUp,
      signIn,
      googleSignIn,
      googleSignInWithToken,
      forgotPassword,
      signOut: signOutUser,
      deleteAccount,
      isFirebaseConfigured,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
