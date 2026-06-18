import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useTheme } from '../../context/ThemeContext';
import ScreenLayout from '../../components/layout/ScreenLayout';
import AuthDivider from '../../components/auth/AuthDivider';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { useGoogleAuthRequest, isGoogleConfigured } from '../../services/googleAuth';
import { useToast } from '../../context/ToastContext';
import { isFirebaseConfigured } from '../../services/firebase';
import { isSupabaseConfigured } from '../../services/supabase';

export default function SignUpScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { signUp, googleSignIn, googleSignInWithToken } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [request, response, promptAsync] = useGoogleAuthRequest();
  const googleReady = isSupabaseConfigured || isFirebaseConfigured || isGoogleConfigured();

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken;
      if (token) handleGoogleToken(token);
    }
  }, [response]);

  const handleGoogleToken = async (accessToken) => {
    setLoading(true);
    try {
      const user = await googleSignInWithToken(accessToken);
      const first = (user.name || 'there').split(' ')[0];
      showToast(`Welcome, ${first}! 🎉`, 'success');
    } catch (e) {
      showToast('Google sign-in failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError('');
    if (!name || !email || !password) { setError('Fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (isSupabaseConfigured || isFirebaseConfigured) {
      setLoading(true);
      try { await googleSignIn(); } catch { showToast('Google sign-in failed.', 'error'); }
      finally { setLoading(false); }
      return;
    }
    if (!isGoogleConfigured()) { showToast('Add Google Client ID to .env', 'info'); return; }
    await promptAsync();
  };

  return (
    <ScreenLayout edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your health journey today</Text>

          <Input label="Name" value={name} onChangeText={setName} />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <Input label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Create Account" onPress={handleSignUp} loading={loading} style={styles.btn} />

          {googleReady && (
            <>
              <AuthDivider />
              <GoogleSignInButton onPress={handleGoogle} loading={loading} disabled={!request && !isFirebaseConfigured && !isSupabaseConfigured} />
            </>
          )}

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkWrap}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: 28 },
  btn: { marginTop: 8 },
  error: { color: colors.danger, marginBottom: 12, fontSize: 13 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { color: colors.textMuted, fontSize: 14 },
  linkBold: { color: colors.accent, fontWeight: '700' },
});
