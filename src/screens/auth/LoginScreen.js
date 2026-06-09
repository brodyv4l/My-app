import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors, radius } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
  const { signIn, googleSignIn, isFirebaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);
    try {
      await googleSignIn();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>NutriTrack</Text>
          <Text style={styles.subtitle}>Precision nutrition tracking</Text>

          {!isFirebaseConfigured && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoText}>Demo mode — create a local account to explore</Text>
            </View>
          )}

          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />
          {isFirebaseConfigured && (
            <Button title="Continue with Google" onPress={handleGoogle} variant="outline" loading={loading} style={styles.btn} />
          )}

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.linkWrap}>
            <Text style={styles.link}>No account? <Text style={styles.linkBold}>Sign up</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  brand: { fontSize: 32, fontWeight: '700', color: colors.text, letterSpacing: -1, marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: 40 },
  demoBadge: { backgroundColor: colors.surface2, borderRadius: radius.sm, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  demoText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  forgot: { color: colors.accent, fontSize: 13, textAlign: 'right', marginBottom: 20 },
  btn: { marginBottom: 12 },
  error: { color: colors.danger, marginBottom: 12, fontSize: 13 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { color: colors.textMuted, fontSize: 14 },
  linkBold: { color: colors.accent, fontWeight: '600' },
});
