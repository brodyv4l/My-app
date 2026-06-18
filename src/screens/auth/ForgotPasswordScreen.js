import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useTheme } from '../../context/ThemeContext';
import ScreenLayout from '../../components/layout/ScreenLayout';

export default function ForgotPasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { forgotPassword, isFirebaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    if (!email) { setError('Enter your email'); return; }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {sent ? 'Check your email for a reset link.' : 'Enter your email and we will send you a reset link.'}
          </Text>

          {!sent && (
            <>
              {!isFirebaseConfigured && (
                <Text style={styles.warn}>Password reset requires Firebase configuration in .env</Text>
              )}
              <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title="Send Reset Link" onPress={handleReset} loading={loading} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  back: { marginBottom: 24 },
  backText: { color: colors.accent, fontSize: 15 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: 28, lineHeight: 22 },
  warn: { color: colors.warning, fontSize: 13, marginBottom: 16 },
  error: { color: colors.danger, marginBottom: 12, fontSize: 13 },
});
