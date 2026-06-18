import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { subDays, format } from 'date-fns';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function HabitHeatmap({ habitLogs, habits }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const days = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(new Date(), 29 - i);
    return format(d, 'yyyy-MM-dd');
  });

  const colorFor = (date) => {
    const log = habitLogs[date];
    if (!log) return colors.surface2;
    const done = habits.filter((h) => log[h.id]).length;
    if (done === habits.length) return colors.success;
    if (done > 0) return colors.warning;
    return colors.surface2;
  };

  return (
    <View>
      <View style={styles.grid}>
        {days.map((d) => (
          <View key={d} style={[styles.cell, { backgroundColor: colorFor(d) }]} />
        ))}
      </View>
      <View style={styles.legend}>
        <Legend color={colors.success} label="All done" />
        <Legend color={colors.warning} label="Partial" />
        <Legend color={colors.surface2} label="None" />
      </View>
    </View>
  );
}

function Legend({ color, label }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 18, height: 18, borderRadius: 4 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11, color: colors.textMuted },
});
