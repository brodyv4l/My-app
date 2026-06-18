import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { radius, spacing } from '../constants/theme';
import PaymentModal from '../components/paywall/PaymentModal';
import { processStripeCheckout, startStripeCheckoutRedirect } from '../services/stripeCheckout';
import { redeemAccessCode, trialUsed, trialExpired, TRIAL_DAYS } from '../utils/subscription';
import { getLocalDateString, shiftLocalDateKey } from '../utils/dates';

const FREE_FEATURES = [
  { ok: true, text: 'Food diary (3 entries/meal)' },
  { ok: true, text: 'Basic calorie & macro tracking' },
  { ok: true, text: 'Barcode scanner' },
  { ok: true, text: 'Streak tree (all stages)' },
  { ok: true, text: 'Water tracker' },
  { ok: true, text: 'Restaurant lookup' },
  { ok: true, text: 'AI Chat (10 msg/day)' },
  { ok: false, text: 'Unlimited food logging' },
  { ok: false, text: 'AI Photo Scanner' },
  { ok: false, text: 'Recipe Builder' },
  { ok: false, text: 'Grocery List' },
  { ok: false, text: 'Full Meal Plans + regeneration' },
  { ok: false, text: '30+ Micronutrients' },
  { ok: false, text: 'Meal Templates' },
  { ok: false, text: 'Habit Tracker & heatmap' },
  { ok: false, text: 'Progress photo comparison' },
  { ok: false, text: 'Unlimited AI Chat' },
  { ok: false, text: 'Data export' },
];

const PRO_FEATURES = [
  'Everything in Free, plus:',
  'Unlimited food logging', 'AI Photo Food Scanner', 'Recipe Builder',
  'Grocery List Generator', 'Full 7-day Meal Plans', 'Regenerate plans anytime',
  '30+ Micronutrients tracked', 'Meal Templates', 'Habit Tracker & heatmap',
  'Progress photo comparison', 'Unlimited AI Chat', 'Custom macro goals',
  'Nutrient report & radar chart', 'Data export', 'Priority support',
];

const FAQ = [
  { q: 'Can I cancel anytime?', a: 'Yes — cancel from your Profile at any time. You keep Pro until the end of your billing period.' },
  { q: 'Is my payment secure?', a: 'All payments are processed by Stripe — the same infrastructure used by Amazon and millions of other businesses worldwide.' },
  { q: 'What happens to my data if I cancel?', a: "Your data is always safe. You'll return to Free tier limits but never lose your logged history." },
  { q: 'Do access codes expire?', a: 'Codes issued by Foodprint never expire unless stated otherwise.' },
  { q: "What's included in the free trial?", a: `Full Pro access for ${TRIAL_DAYS} days. Add a card to start — $4.99/mo after unless you cancel before the trial ends.` },
];

export default function UpgradeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { profile, updateProfile } = useUser();
  const { showToast } = useToast();
  const [billing, setBilling] = useState('monthly');
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [success, setSuccess] = useState(null);
  const [payment, setPayment] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const showClose = route.params?.showClose !== false;

  const canStartTrial = !trialUsed(profile);
  const expired = trialExpired(profile);

  const handleUpgrade = async () => {
    const startingTrial = canStartTrial && !expired;
    if (Platform.OS === 'web') {
      setCheckoutBusy(true);
      try {
        await startStripeCheckoutRedirect({
          plan: startingTrial ? 'monthly' : billing,
          userId: user?.uid,
          userEmail: user?.email,
          startTrial: startingTrial,
        });
      } catch (e) {
        Alert.alert('Checkout Error', e?.message || 'Could not start checkout.');
      } finally {
        setCheckoutBusy(false);
      }
      return;
    }
    setPayment(startingTrial ? 'monthly' : billing);
  };

  const handlePaymentSuccess = async ({ plan, name, cardNumber, expMonth, expYear, cvc }) => {
    const startingTrial = canStartTrial && !expired && plan === 'monthly';
    const result = await processStripeCheckout({
      plan,
      userId: user?.uid,
      userEmail: user?.email,
      cardNumber,
      expMonth,
      expYear,
      cvc,
      name,
      startTrial: startingTrial,
    });

    const now = new Date();
    const today = getLocalDateString(now);

    if (result.isTrialing) {
      const end = result.trialEndDate || shiftLocalDateKey(today, TRIAL_DAYS);
      await updateProfile({
        subscriptionStatus: 'trial',
        subscriptionPlan: 'monthly',
        trialStartDate: result.trialStartDate || today,
        trialEndDate: end,
        subscriptionStartDate: today,
        subscriptionEndDate: result.currentPeriodEnd || end,
        subscriptionCancelAtPeriodEnd: false,
        stripeSubscriptionId: result.subscriptionId || null,
        stripeCustomerId: result.customerId || null,
      });
      setPayment(null);
      showToast(`Your ${TRIAL_DAYS}-day Pro trial has started!`, 'success');
      navigation.navigate('Main');
      return;
    }

    const end = result.currentPeriodEnd
      ? new Date(result.currentPeriodEnd + 'T12:00:00')
      : (() => {
          const d = new Date(now);
          if (plan === 'annual') d.setFullYear(d.getFullYear() + 1);
          else d.setMonth(d.getMonth() + 1);
          return d;
        })();

    await updateProfile({
      subscriptionStatus: 'pro',
      subscriptionPlan: plan,
      subscriptionStartDate: today,
      subscriptionEndDate: getLocalDateString(end),
      subscriptionCancelAtPeriodEnd: false,
      stripeSubscriptionId: result.subscriptionId || null,
      stripeCustomerId: result.customerId || null,
    });
    setPayment(null);
    showToast('Welcome to Pro! 🎉', 'success');
    navigation.navigate('Main');
  };

  const applyCode = async () => {
    setApplying(true);
    try {
      const result = await redeemAccessCode(code, user?.email);
      if (!result.ok) { Alert.alert('Code Error', result.error); return; }
      await updateProfile(result.profileUpdates);
      setSuccess(result);
    } finally { setApplying(false); }
  };

  if (success) {
    const isFounder = success.type === 'founder';
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrap}>
          <Text style={styles.successCheck}>✓</Text>
          <Text style={styles.successTitle}>{isFounder ? '👑 Founder Access Activated!' : '🎉 Pro Unlocked!'}</Text>
          <Text style={styles.successSub}>Full access granted — no expiration.</Text>
          <Button title="Start Using Foodprint 🚀" onPress={() => navigation.navigate('Main')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.topTitle}>Foodprint Pro</Text>
        {showClose ? <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.close}>✕</Text></TouchableOpacity> : <View style={{ width: 24 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heroEmoji}>💪</Text>
        <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
        <Text style={styles.heroSub}>Join thousands crushing their goals</Text>

        <View style={styles.toggle}>
          {['monthly', 'annual'].map((b) => (
            <TouchableOpacity key={b} style={[styles.toggleBtn, billing === b && styles.toggleOn]} onPress={() => setBilling(b)}>
              <Text style={[styles.toggleText, billing === b && styles.toggleTextOn]}>{b === 'monthly' ? 'Monthly' : 'Annual 🔥 Save 33%'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planName}>Free</Text>
          <Text style={styles.planPrice}>$0 / forever</Text>
          {FREE_FEATURES.map((f, i) => (
            <Text key={i} style={[styles.feat, !f.ok && styles.featOff]}>{f.ok ? '✓' : '✗'} {f.text}</Text>
          ))}
          <Button title="Current Plan" disabled variant="ghost" />
        </View>

        <View style={[styles.planCard, styles.proCard]}>
          <View style={styles.proBadge}><Text style={styles.proBadgeText}>Most Popular 🔥</Text></View>
          <Text style={styles.planName}>Pro ✨</Text>
          <Text style={styles.planPrice}>{billing === 'monthly' ? '$4.99 / month' : '$39.99 / year'}</Text>
          {billing === 'annual' && <Text style={styles.strike}>$59.88  <Text style={styles.saveBadge}>SAVE $19.89</Text></Text>}
          {PRO_FEATURES.map((f, i) => <Text key={i} style={styles.featPro}>✓ {f}</Text>)}
          <Button
            title={checkoutBusy ? 'Opening checkout…' : (canStartTrial && !expired ? `Start ${TRIAL_DAYS}-Day Free Trial →` : 'Upgrade to Pro →')}
            onPress={handleUpgrade}
            disabled={checkoutBusy}
          />
          {canStartTrial && !expired && (
            <Text style={styles.trialSub}>
              Card required. Full Pro for {TRIAL_DAYS} days, then $4.99/mo unless you cancel.
            </Text>
          )}
        </View>

        <View style={styles.codeSection}>
          <Text style={styles.codeTitle}>🎟️ Have an access code?</Text>
          <Text style={styles.codeSub}>Enter a code to unlock Pro for free</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="ENTER CODE"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
          />
          <Button title="Apply Code →" onPress={applyCode} loading={applying} />
        </View>

        <Text style={styles.sectionTitle}>What members say</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testimonials}>
          {[
            { stars: 5, text: "Finally an app that doesn't nickel-and-dime you for basic features. The AI scanner is insane.", author: 'Jordan M., lost 22 lbs' },
            { stars: 5, text: 'The meal plans + grocery list completely changed how I prep for the week. 10/10.', author: 'Aisha T., fitness coach' },
            { stars: 5, text: "I've tried every nutrition app. This streak tree kept me consistent for 90 days straight.", author: 'Marcus R., marathon runner' },
          ].map((t, i) => (
            <View key={i} style={styles.testCard}>
              <Text style={styles.stars}>{'⭐'.repeat(t.stars)}</Text>
              <Text style={styles.testText}>"{t.text}"</Text>
              <Text style={styles.testAuthor}>— {t.author}</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>FAQ</Text>
        {FAQ.map((item, i) => (
          <TouchableOpacity key={i} style={styles.faqItem} onPress={() => setFaqOpen(faqOpen === i ? null : i)}>
            <Text style={styles.faqQ}>{item.q}</Text>
            {faqOpen === i && <Text style={styles.faqA}>{item.a}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <PaymentModal
        visible={!!payment}
        plan={payment || 'monthly'}
        onClose={() => setPayment(null)}
        onSuccess={handlePaymentSuccess}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  back: { fontSize: 24, color: colors.text },
  close: { fontSize: 20, color: colors.textMuted },
  topTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  content: { padding: spacing.lg, paddingBottom: 40 },
  heroEmoji: { fontSize: 48, textAlign: 'center', marginBottom: spacing.sm },
  heroTitle: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  heroSub: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  toggle: { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radius.full, padding: 4, marginBottom: spacing.lg },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.full, alignItems: 'center' },
  toggleOn: { backgroundColor: colors.accent },
  toggleText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  toggleTextOn: { color: colors.onAccent },
  planCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  proCard: { borderColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 12 },
  proBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  proBadgeText: { fontSize: 10, fontWeight: '700', color: colors.onAccent },
  planName: { fontSize: 20, fontWeight: '800', color: colors.text },
  planPrice: { fontSize: 16, color: colors.textSecondary, marginVertical: 8 },
  strike: { fontSize: 13, color: colors.textMuted, textDecorationLine: 'line-through', marginBottom: 8 },
  saveBadge: { color: colors.danger, textDecorationLine: 'none', fontWeight: '700' },
  feat: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  featOff: { color: colors.borderLight },
  featPro: { fontSize: 13, color: colors.text, marginBottom: 4 },
  trialSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  codeSection: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  codeTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  codeSub: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  codeInput: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 14, color: colors.text, fontSize: 16, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  testimonials: { marginBottom: spacing.md },
  testCard: { width: 280, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
  stars: { marginBottom: 8 },
  testText: { fontSize: 14, color: colors.text, lineHeight: 20, fontStyle: 'italic' },
  testAuthor: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  faqItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  faqQ: { fontSize: 15, fontWeight: '600', color: colors.text },
  faqA: { fontSize: 14, color: colors.textMuted, marginTop: 8, lineHeight: 20 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  successCheck: { fontSize: 72, color: colors.accent, fontWeight: '800', marginBottom: spacing.lg },
  successTitle: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  successSub: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
});
