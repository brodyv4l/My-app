import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GOAL_TYPES } from '../../../constants/theme';
import { formatSurveyDate } from '../../../utils/onboardingValidation';
import { colors, radius } from '../../../constants/theme';

// App Store: wire PRIVACY_POLICY_URL before release
export const PRIVACY_POLICY_URL = null;

export default function PlanReviewStep({ survey, plan, loading, onGenerate }) {
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
            <ActivityIndicator color="#09090b" />
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
        {PRIVACY_POLICY_URL ? (
          <TouchableOpacity accessibilityRole="link" accessibilityLabel="Privacy Policy">
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.legalPlaceholder}>
            Privacy Policy link will appear here before App Store submission.
          </Text>
        )}
      </View>
    </View>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Macro({ label, value, color }) {
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroVal, { color }]}>{value}</Text>
      <Text style={styles.macroLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  generateText: { color: '#09090b', fontSize: 16, fontWeight: '700' },
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
  legalBox: { paddingVertical: 8, alignItems: 'center' },
  legalLink: { color: colors.accent, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  legalPlaceholder: { color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
