import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GOAL_STRATEGIES } from '../../../constants/onboarding';
import { colors, radius } from '../../../constants/theme';

export default function GoalDetailsStep({ survey, errors, onChange }) {
  const isGain = survey.goalType === 'gain';

  return (
    <View>
      <Text style={styles.helper}>
        {isGain ? 'How aggressively do you want to build muscle?' : 'How aggressively do you want to lose weight?'}
      </Text>
      {errors.goalStrategy ? <Text style={styles.error}>{errors.goalStrategy}</Text> : null}
      {GOAL_STRATEGIES.map((strategy) => (
        <TouchableOpacity
          key={strategy.id}
          style={[styles.option, survey.goalStrategy === strategy.id && styles.optionActive]}
          onPress={() => onChange({ goalStrategy: strategy.id })}
          accessibilityRole="radio"
          accessibilityState={{ selected: survey.goalStrategy === strategy.id }}
        >
          <Text style={[styles.title, survey.goalStrategy === strategy.id && styles.titleActive]}>{strategy.label}</Text>
          <Text style={styles.desc}>{isGain ? strategy.descGain : strategy.descLose}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  helper: { fontSize: 15, color: colors.textMuted, marginBottom: 16, lineHeight: 22 },
  option: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 12,
    minHeight: 72,
    justifyContent: 'center',
  },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  title: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 4 },
  titleActive: { color: colors.accent },
  desc: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
});
