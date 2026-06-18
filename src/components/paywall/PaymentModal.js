import { useState, useMemo } from 'react';
import {
  View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const PLANS = {
  monthly: { title: 'Pro Monthly — $4.99/mo', cta: 'Pay $4.99/month' },
  annual: { title: 'Pro Annual — $39.99/yr', cta: 'Pay $39.99/year' },
};

function formatCard(text) {
  const clean = text.replace(/\D/g, '').slice(0, 16);
  const groups = clean.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

function formatExpiry(text) {
  const clean = text.replace(/\D/g, '').slice(0, 4);
  if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2);
  return clean;
}

/**
 * Fully in-app payment sheet — no external browser / Stripe redirect.
 * Parent supplies onSuccess({ plan, name, last4, expMonth, expYear }) which
 * activates Pro (and closes the sheet). Errors thrown by onSuccess surface here.
 */
export default function PaymentModal({ visible, plan = 'monthly', onClose, onSuccess }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const info = PLANS[plan] || PLANS.monthly;

  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const close = () => {
    if (loading) return;
    setError(null);
    onClose?.();
  };

  const handlePay = async () => {
    const digits = cardNumber.replace(/\s/g, '');
    if (name.trim().length < 2) { setError('Enter the name on your card.'); return; }
    if (digits.length < 15) { setError('Enter a valid card number.'); return; }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { setError('Enter expiry as MM/YY.'); return; }
    if (cvc.length < 3) { setError('Enter the security code (CVC).'); return; }

    setLoading(true);
    setError(null);
    try {
      const [expMonth, expYear] = expiry.split('/');
      await onSuccess?.({
        plan,
        name: name.trim(),
        cardNumber: digits,
        expMonth,
        expYear,
        cvc,
        last4: digits.slice(-4),
      });
      // Reset on success; the parent closes the sheet.
      setName(''); setCardNumber(''); setExpiry(''); setCvc('');
    } catch (err) {
      setError(err?.message || 'Payment failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{info.title}</Text>
            <TouchableOpacity onPress={close} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.secure}>🔒 Secured by Stripe</Text>

          <Text style={styles.label}>Name on card</Text>
          <TextInput
            style={styles.input}
            placeholder="John Smith"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Card number</Text>
          <TextInput
            style={styles.input}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={colors.textMuted}
            value={cardNumber}
            onChangeText={(t) => setCardNumber(formatCard(t))}
            keyboardType="numeric"
            maxLength={19}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Expiry</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor={colors.textMuted}
                value={expiry}
                onChangeText={(t) => setExpiry(formatExpiry(t))}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>CVC</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor={colors.textMuted}
                value={cvc}
                onChangeText={(t) => setCvc(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.payBtn, loading && styles.payBtnDisabled]}
            onPress={handlePay}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.payText}>{info.cta}</Text>}
          </TouchableOpacity>

          <Text style={styles.testNote}>Test card: 4242 4242 4242 4242 · 12/34 · 123</Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: colors.text, fontSize: 19, fontWeight: '800', flex: 1 },
  close: { color: colors.textSecondary, fontSize: 18, paddingLeft: 12 },
  secure: { color: colors.textSecondary, fontSize: 12, marginBottom: 20, textAlign: 'center' },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  error: { color: colors.danger, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  payBtn: { backgroundColor: colors.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  payBtnDisabled: { opacity: 0.7 },
  payText: { color: colors.onAccent, fontSize: 16, fontWeight: '800' },
  testNote: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 12 },
});
