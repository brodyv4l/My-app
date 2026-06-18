import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GOAL_TYPES } from '../../../constants/theme';
import { radius } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

export default function CoreGoalStep({ survey, errors, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View>
      {errors.goalType ? <Text style={styles.error}>{errors.goalType}</Text> : null}
      {GOAL_TYPES.map((goal) => (
        <TouchableOpacity
          key={goal.id}
          style={[styles.option, survey.goalType === goal.id && styles.optionActive]}
          onPress={() => onChange({ goalType: goal.id, goalStrategy: '' })}
          accessibilityRole="radio"
          accessibilityState={{ selected: survey.goalType === goal.id }}
        >
          <Text style={[styles.title, survey.goalType === goal.id && styles.titleActive]}>{goal.label}</Text>
          <Text style={styles.desc}>{goal.desc}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
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
