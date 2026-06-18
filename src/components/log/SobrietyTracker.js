import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function SobrietyTracker({ streakCount = 0 }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sobriety Streak</Text>
      <Text style={styles.count}>🚫🍷 {streakCount} day{streakCount === 1 ? '' : 's'} alcohol-free</Text>
      <Text style={styles.sub}>Check &quot;Sober today&quot; in Daily Habits to keep your streak.</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  count: { fontSize: 20, fontWeight: '800', color: colors.accent },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 8, lineHeight: 18 },
});
