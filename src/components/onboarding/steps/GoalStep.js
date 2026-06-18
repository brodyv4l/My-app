import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ONBOARDING_GOALS } from '../../../constants/onboarding';
import { spacing, radius } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

export default function GoalStep({ survey, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      {ONBOARDING_GOALS.map((g) => (
        <TouchableOpacity
          key={g.id}
          style={[styles.card, survey.goalType === g.id && styles.cardActive]}
          onPress={() => onChange({ goalType: g.id, goalPace: g.id === 'gain' ? 'standard' : 'moderate' })}
        >
          <Text style={styles.icon}>{g.icon}</Text>
          <View style={styles.text}>
            <Text style={styles.label}>{g.label}</Text>
            <Text style={styles.desc}>{g.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cardActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  icon: { fontSize: 28, marginRight: 14 },
  text: { flex: 1 },
  label: { fontSize: 17, fontWeight: '700', color: colors.text },
  desc: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
