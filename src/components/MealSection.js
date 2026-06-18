import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function MealSection({ meal, entries, onRemove, onAddFood, onEditEntry }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(true);
  const total = entries.reduce((s, e) => s + e.calories, 0);

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerLeft}>
          <Feather name={expanded ? 'chevron-down' : 'chevron-right'} size={16} color={colors.textMuted} />
          <Text style={styles.title}>{meal.toUpperCase()}</Text>
        </View>
        <Text style={styles.total}>{total} cal</Text>
      </TouchableOpacity>

      {expanded && (
        <>
          {entries.length === 0 ? (
            <Text style={styles.empty}>No items logged</Text>
          ) : (
            entries.map((entry) => (
              <TouchableOpacity key={entry.id} style={styles.item} onPress={() => onEditEntry?.(entry)}>
                {entry.imageUri ? (
                  <Image source={{ uri: entry.imageUri }} style={styles.thumb} resizeMode="cover" />
                ) : null}
                <View style={styles.info}>
                  <Text style={styles.name}>{entry.name}</Text>
                  <Text style={styles.meta}>
                    {entry.servings}x {entry.serving} · P {entry.protein}g C {entry.carbs}g F {entry.fat}g
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Text style={styles.cal}>{entry.calories} cal</Text>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(entry.id)}>
                    <Feather name="trash-2" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
          <TouchableOpacity style={styles.addRow} onPress={() => onAddFood?.(meal)}>
            <Feather name="plus" size={16} color={colors.accent} />
            <Text style={styles.addText}>Add Food</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.6 },
  total: { fontSize: 14, fontWeight: '700', color: colors.accent },
  empty: { fontSize: 13, color: colors.textMuted, paddingVertical: 8 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: colors.surface2 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cal: { fontSize: 14, fontWeight: '700', color: colors.accent },
  removeBtn: { padding: 8 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  addText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
});
