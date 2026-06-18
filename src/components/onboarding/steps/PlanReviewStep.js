import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GOAL_TYPES } from '../../../constants/theme';
import { formatSurveyDate } from '../../../utils/onboardingValidation';
import { radius } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { PrivacyPolicyModal, TermsModal } from '../../legal/LegalModal';

export default function PlanReviewStep({ survey, plan, loading, onGenerate }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [legal, setLegal] = useState(null);
  const goalLabel = GOAL_TYPES.find((g) => g.id === survey.goalType)?.label;

  if (!plan) {
    return (
      <View style={styles.center}>
        <Text style={styles.readyTitle}>Ready to build your plan</Text>
        <Text style={styles.readyDesc}>
          We will use your metrics, goal, and timeline to generate a personalized daily calorie and macro target.
        </Text>
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
          onPress={onGenerate}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Generate nutrition plan"
        >
          {loading ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.generateText}>Generate My Plan</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your targets</Text>
        <SummaryRow label="Goal" value={goalLabel} />
        <SummaryRow label="Current weight" value={`${survey.weight} lbs`} />
        <SummaryRow label="Target weight" value={`${survey.targetWeight} lbs`} />
        <SummaryRow label="Target date" value={formatSurveyDate(survey.targetDate)} />
      </View>

      <View style={styles.planCard}>
        <Text style={styles.calories}>{plan.calories}</Text>
        <Text style={styles.calLabel}>daily calories</Text>
        <View style={styles.macroRow}>
          <Macro label="Protein" value={`${plan.protein}g`} color={colors.protein} />
          <Macro label="Carbs" value={`${plan.carbs}g`} color={colors.carbs} />
          <Macro label="Fat" value={`${plan.fat}g`} color={colors.fat} />
        </View>
        {plan.explanation ? <Text style={styles.explanation}>{plan.explanation}</Text> : null}
      </View>

      <View style={styles.legalBox}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Privacy Policy" onPress={() => setLegal('privacy')}>
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.legalDot}>·</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Terms of Service" onPress={() => setLegal('terms')}>
          <Text style={styles.legalLink}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      <PrivacyPolicyModal visible={legal === 'privacy'} onClose={() => setLegal(null)} />
      <TermsModal visible={legal === 'terms'} onClose={() => setLegal(null)} />
    </View>
  );
}

function SummaryRow({ label, value }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Macro({ label, value, color }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroVal, { color }]}>{value}</Text>
      <Text style={styles.macroLbl}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  center: { alignItems: 'center', paddingVertical: 24 },
  readyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  readyDesc: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  generateBtn: {
    minHeight: 52,
    minWidth: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateText: { color: colors.onAccent, fontSize: 16, fontWeight: '700' },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  calories: { fontSize: 48, fontWeight: '700', color: colors.accent, letterSpacing: -1 },
  calLabel: { fontSize: 14, color: colors.textMuted, marginBottom: 16 },
  macroRow: { flexDirection: 'row', gap: 28 },
  macroItem: { alignItems: 'center' },
  macroVal: { fontSize: 18, fontWeight: '700' },
  macroLbl: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  explanation: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 19 },
  legalBox: { paddingVertical: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  legalLink: { color: colors.accent, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  legalDot: { color: colors.textMuted, fontSize: 14 },
});
