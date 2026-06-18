import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LOSE_PACE_OPTIONS, GAIN_PACE_OPTIONS } from '../../../constants/onboarding';
import { radius } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import TargetDatePicker from '../TargetDatePicker';

export default function PaceStep({ survey, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isLose = survey.goalType === 'lose';
  const options = isLose ? LOSE_PACE_OPTIONS : GAIN_PACE_OPTIONS;
  const title = isLose ? 'How fast do you want to lose?' : 'What type of bulk?';
  const subtitle = isLose
    ? 'Slower = more sustainable. Faster = more aggressive deficit.'
    : 'Choose how aggressively you want to gain mass.';

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {options.map((o) => (
        <TouchableOpacity
          key={o.id}
          style={[styles.card, survey.goalPace === o.id && styles.cardActive]}
          onPress={() => onChange({ goalPace: o.id })}
        >
          <View style={styles.cardTop}>
            <Text style={styles.icon}>{o.icon}</Text>
            <Text style={styles.label}>{o.label}</Text>
            {o.recommended ? <View style={styles.badge}><Text style={styles.badgeText}>Recommended</Text></View> : null}
          </View>
          <Text style={styles.rate}>{o.rate}</Text>
          <Text style={styles.desc}>{o.desc}</Text>
        </TouchableOpacity>
      ))}
      <TargetDatePicker survey={survey} onChange={onChange} />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 16, lineHeight: 20 },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  cardActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  icon: { fontSize: 22, marginRight: 8 },
  label: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  badge: { backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.onAccent },
  rate: { fontSize: 15, fontWeight: '600', color: colors.accent, marginBottom: 4 },
  desc: { fontSize: 13, color: colors.textMuted },
});
