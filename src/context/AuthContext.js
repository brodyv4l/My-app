import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  subscribeToAuth, signUpWithEmail, signInWithEmail, signInWithGoogle,
  resetPassword, logOut, isFirebaseConfigured,
} from '../services/firebase';

const AuthContext = createContext(null);
const LOCAL_USERS_KEY = 'nutritrack-local-users';
const LOCAL_SESSION_KEY = 'nutritrack-session';

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

  useEffect(() => {
    if (isFirebaseConfigured) {
      return subscribeToAuth((fbUser) => {
        setUser(fbUser ? {
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || '',
          provider: 'firebase',
        } : null);
        setLoading(false);
      });
    }

    AsyncStorage.getItem(LOCAL_SESSION_KEY).then((session) => {
      if (session) setUser(JSON.parse(session));
      setLoading(false);
    });
    return undefined;
  }, []);

  const setLocalSession = async (sessionUser) => {
    setUser(sessionUser);
    await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionUser));
  };

  const signUp = useCallback(async (email, password, name) => {
    if (isFirebaseConfigured) {
      const fbUser = await signUpWithEmail(email, password, name);
      return { uid: fbUser.uid, email: fbUser.email, name: name || fbUser.displayName || '', provider: 'firebase' };
    }
    const users = await getLocalUsers();
    if (users[email]) throw new Error('Account already exists');
    const sessionUser = { uid: `local-${Date.now()}`, email, name, provider: 'local', password };
    users[email] = sessionUser;
    await saveLocalUsers(users);
    await setLocalSession(sessionUser);
    return sessionUser;
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (isFirebaseConfigured) {
      const fbUser = await signInWithEmail(email, password);
      return { uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName || '', provider: 'firebase' };
    }
    const users = await getLocalUsers();
    const found = users[email];
    if (!found || found.password !== password) throw new Error('Invalid email or password');
    const { password: _, ...sessionUser } = found;
    await setLocalSession(sessionUser);
    return sessionUser;
  }, []);

  const googleSignIn = useCallback(async () => {
    const fbUser = await signInWithGoogle();
    return { uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName || '', provider: 'firebase' };
  }, []);

  const forgotPassword = useCallback(async (email) => {
    if (isFirebaseConfigured) {
      await resetPassword(email);
      return;
    }
    throw new Error('Password reset requires Firebase. Configure Firebase in .env or use demo mode.');
  }, []);

  const signOutUser = useCallback(async () => {
    if (isFirebaseConfigured) await logOut();
    else await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, signUp, signIn, googleSignIn, forgotPassword, signOut: signOutUser,
      isFirebaseConfigured,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
