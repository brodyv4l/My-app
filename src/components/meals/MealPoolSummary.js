import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const ROWS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

export default function MealPoolSummary({ pool }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (!pool) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Your 12 meals this week</Text>
      {ROWS.map((row) => {
        const options = pool[row.key] || [];
        if (!options.length) return null;
        return (
          <View key={row.key} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <View style={styles.pills}>
              {options.slice(0, 3).map((meal, i) => (
                <View key={meal?.id || i} style={styles.pill}>
                  <Text style={styles.pillText} numberOfLines={1}>{meal?.name || '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  row: { gap: 6 },
  rowLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.4, textTransform: 'uppercase' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  pillText: { color: colors.accent, fontSize: 11, fontWeight: '600' },
});
