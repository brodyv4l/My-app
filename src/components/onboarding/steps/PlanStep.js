import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { radius, spacing } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { calculateOnboardingPlan } from '../../../utils/onboardingPlan';

const LOADING_MESSAGES = [
  'Calculating your metabolism...',
  'Optimizing your macros...',
  'Personalizing your plan...',
];

export default function PlanStep({ survey, plan, onPlanReady }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [phase, setPhase] = useState('loading');
  const [msgIndex, setMsgIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const computed = plan || calculateOnboardingPlan(survey);

  useEffect(() => {
    const spinAnim = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    );
    spinAnim.start();

    Animated.timing(progress, { toValue: 1, duration: 2000, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();

    const msgTimer = setInterval(() => setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length), 700);
    const doneTimer = setTimeout(() => {
      setPhase('results');
      onPlanReady?.(computed);
    }, 2000);

    return () => { clearInterval(msgTimer); clearTimeout(doneTimer); spinAnim.stop(); };
  }, []);

  const spinRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (phase === 'loading') {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingTitle}>Building your plan...</Text>
        <Animated.Text style={[styles.gear, { transform: [{ rotate: spinRotate }] }]}>⚙️</Animated.Text>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
        <Text style={styles.loadingMsg}>{LOADING_MESSAGES[msgIndex]}</Text>
      </View>
    );
  }

  const { calories, protein, carbs, fat, waterGoalOz, explanation, weeksEstimate } = computed;
  const showWeeks = (survey.goalType === 'lose' || survey.goalType === 'gain') && weeksEstimate;

  return (
    <View style={styles.results}>
      <Text style={styles.calNum}>{calories.toLocaleString()}</Text>
      <Text style={styles.calLabel}>cal/day</Text>

      <View style={styles.macroRow}>
        <View style={styles.macroBadge}><Text style={styles.macroEmoji}>🟡</Text><Text style={styles.macroText}>{protein}g Protein</Text></View>
        <View style={styles.macroBadge}><Text style={styles.macroEmoji}>🔵</Text><Text style={styles.macroText}>{carbs}g Carbs</Text></View>
        <View style={styles.macroBadge}><Text style={styles.macroEmoji}>🔴</Text><Text style={styles.macroText}>{fat}g Fat</Text></View>
      </View>

      <Text style={styles.water}>💧 {waterGoalOz} oz water daily</Text>

      {showWeeks ? (
        <Text style={styles.weeks}>At this pace you'll reach your goal in ~{weeksEstimate} weeks</Text>
      ) : null}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>{explanation}</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  loadingWrap: { alignItems: 'center', paddingVertical: spacing.xl },
  loadingTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.xl },
  gear: { fontSize: 48, marginBottom: spacing.lg },
  barTrack: { width: '100%', height: 6, backgroundColor: colors.surface2, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.md },
  barFill: { height: 6, backgroundColor: colors.accent },
  loadingMsg: { fontSize: 15, color: colors.textMuted },
  results: { alignItems: 'center' },
  calNum: { fontSize: 56, fontWeight: '800', color: colors.accent, letterSpacing: -2 },
  calLabel: { fontSize: 16, color: colors.textMuted, marginBottom: spacing.lg },
  macroRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: spacing.md },
  macroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.full },
  macroEmoji: { marginRight: 4 },
  macroText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  water: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.md },
  weeks: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md, textAlign: 'center' },
  summaryCard: { width: '100%', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentMuted },
  summaryText: { fontSize: 14, color: colors.text, lineHeight: 22 },
});
