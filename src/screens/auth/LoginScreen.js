import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import ScreenLayout from '../../components/layout/ScreenLayout';
import AuthDivider from '../../components/auth/AuthDivider';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { useGoogleAuthRequest, isGoogleConfigured } from '../../services/googleAuth';
import { useToast } from '../../context/ToastContext';
import { isFirebaseConfigured } from '../../services/firebase';
import { isSupabaseConfigured } from '../../services/supabase';

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { signIn, googleSignIn, googleSignInWithToken, authError, clearAuthError } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [request, response, promptAsync] = useGoogleAuthRequest();
  const googleReady = isSupabaseConfigured || isFirebaseConfigured || isGoogleConfigured();

  useEffect(() => {
    if (!authError) return;
    showToast(authError, 'error');
    clearAuthError();
  }, [authError, showToast, clearAuthError]);

  useEffect(() => {
    if (response?.type === 'cancel') return;
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken;
      if (token) handleGoogleToken(token);
    } else if (response?.type === 'error') {
      showToast('Google sign-in failed. Try again.', 'error');
    }
  }, [response]);

  const handleGoogleToken = async (accessToken) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured) {
        await googleSignIn();
      } else {
        const user = await googleSignInWithToken(accessToken);
        const first = (user.name || 'there').split(' ')[0];
        showToast(`Welcome, ${first}! 🎉`, 'success');
      }
    } catch (e) {
      const msg = e.message?.includes('already exists')
        ? 'An account with this email already exists. Sign in with email instead.'
        : e.message?.includes('network') || e.message?.includes('fetch')
        ? 'No connection. Check internet and retry.'
        : 'Google sign-in failed. Try again.';
      showToast(msg, 'error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (isSupabaseConfigured || isFirebaseConfigured) {
      setLoading(true);
      try {
        await googleSignIn();
      } catch (e) {
        showToast('Google sign-in failed. Try again.', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!isGoogleConfigured()) {
      showToast('Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to .env', 'info');
      return;
    }
    await promptAsync();
  };

  return (
    <ScreenLayout edges={['top', 'bottom']}>
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>Foodprint</Text>
          <Text style={styles.subtitle}>Precision nutrition tracking</Text>

          {!isFirebaseConfigured && !isSupabaseConfigured && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoText}>Demo mode — create a local account or use Google</Text>
            </View>
          )}

          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />

          {googleReady && (
            <>
              <AuthDivider />
              <GoogleSignInButton onPress={handleGoogle} loading={loading} disabled={!request && !isFirebaseConfigured && !isSupabaseConfigured} />
            </>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.linkWrap}>
            <Text style={styles.link}>No account? <Text style={styles.linkBold}>Sign up</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
    </ScreenLayout>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  brand: { fontSize: 32, fontWeight: '700', color: colors.text, letterSpacing: -1, marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: 40 },
  demoBadge: { backgroundColor: colors.surface2, borderRadius: radius.sm, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  demoText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  forgot: { color: colors.accent, fontSize: 13, textAlign: 'right', marginBottom: 20 },
  btn: { marginBottom: 4 },
  error: { color: colors.danger, marginBottom: 12, fontSize: 13 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { color: colors.textMuted, fontSize: 14 },
  linkBold: { color: colors.accent, fontWeight: '600' },
});
