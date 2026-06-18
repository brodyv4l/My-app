import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function DailyHabits({ habits, completed, onToggle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const done = habits.filter((h) => completed[h.id]).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Habits</Text>
        <Text style={styles.score}>Today: {done}/{habits.length}</Text>
      </View>
      {habits.map((h) => {
        const checked = !!completed[h.id];
        return (
          <TouchableOpacity key={h.id} style={styles.row} onPress={() => !h.auto && onToggle(h.id)}>
            <View style={[styles.box, checked && styles.boxOn]}>
              {checked ? <Feather name="check" size={14} color={colors.onAccent} /> : null}
            </View>
            <Text style={[styles.label, checked && styles.labelDone]}>{h.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  score: { fontSize: 13, color: colors.accent, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: { fontSize: 15, color: colors.text },
  labelDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
});
