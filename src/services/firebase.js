import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);

let app = null;
let auth = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };

export function subscribeToAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signUpWithEmail(email, password, name) {
  if (!auth) throw new Error('Firebase not configured');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  return cred.user;
}

export async function signInWithEmail(email, password) {
  if (!auth) throw new Error('Firebase not configured');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  if (Platform.OS === 'web') {
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  }
  throw new Error('Google sign-in on mobile requires additional setup. Use email or web preview.');
}

export async function resetPassword(email) {
  if (!auth) throw new Error('Firebase not configured');
  await sendPasswordResetEmail(auth, email);
}

export async function logOut() {
  if (!auth) return;
  await signOut(auth);
}
