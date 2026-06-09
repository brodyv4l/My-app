import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius } from '../constants/theme';

export default function MealSection({ meal, entries, onRemove }) {
  const total = entries.reduce((s, e) => s + e.calories, 0);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{meal}</Text>
        <Text style={styles.total}>{total} cal</Text>
      </View>
      {entries.length === 0 ? (
        <Text style={styles.empty}>No items logged</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.item}>
            <View style={styles.info}>
              <Text style={styles.name}>{entry.name}</Text>
              <Text style={styles.meta}>
                {entry.servings}x {entry.serving} · P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g
              </Text>
            </View>
            <View style={styles.actions}>
              <Text style={styles.cal}>{entry.calories} cal</Text>
              <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(entry.id)}>
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  total: { fontSize: 13, fontWeight: '600', color: colors.accent },
  empty: { fontSize: 13, color: colors.textMuted, paddingVertical: 8 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cal: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  removeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontSize: 20, color: colors.textMuted },
});
