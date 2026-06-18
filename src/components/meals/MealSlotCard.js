import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { formatIngredient } from '../../utils/mealIngredients';

const SLOT_EMOJI = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎', snacks: '🍎' };
const SLOT_LABELS = { breakfast: 'BREAKFAST', lunch: 'LUNCH', dinner: 'DINNER', snack: 'SNACK', snacks: 'SNACK' };

export default function MealSlotCard({ meal, onLog, onSwap, onSaveTemplate, isPro }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);
  if (!meal) return null;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.type}>{SLOT_EMOJI[meal.type] || ''} {SLOT_LABELS[meal.type] || meal.type}</Text>
        <Text style={styles.cal}>{meal.calories} cal</Text>
      </View>
      <Text style={styles.name}>{meal.name}</Text>
      <View style={styles.pills}>
        <Text style={[styles.pill, { color: colors.protein }]}>P:{meal.protein}g</Text>
        <Text style={[styles.pill, { color: colors.carbs }]}>C:{meal.carbs}g</Text>
        <Text style={[styles.pill, { color: colors.fat }]}>F:{meal.fat}g</Text>
      </View>
      {meal.prepTime ? <Text style={styles.meta}>⏱ {meal.prepTime}</Text> : null}
      {meal.servingSize || meal.serving ? <Text style={styles.meta}>{meal.servingSize || meal.serving}</Text> : null}
      {meal.ingredients?.length ? (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.ingToggle}>{expanded ? '▾' : '▸'} Ingredients ({meal.ingredients.length})</Text>
          {expanded && meal.ingredients.map((ing, i) => {
            const line = formatIngredient(ing);
            if (!line) return null;
            return <Text key={i} style={styles.ing}>• {line}</Text>;
          })}
        </TouchableOpacity>
      ) : null}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLog?.(meal)}><Text style={styles.actionText}>📋 Log</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onSwap?.(meal)}><Text style={styles.actionText}>{isPro ? '🔄 Swap' : '🔒 Swap'}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onSaveTemplate?.(meal)}><Text style={styles.actionText}>{isPro ? '⭐ Save' : '🔒 Save'}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: { backgroundColor: colors.surface2, borderRadius: radius.md, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  type: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  cal: { fontSize: 15, fontWeight: '800', color: colors.accent },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  pills: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  pill: { fontSize: 12, fontWeight: '600', backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  meta: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  ingToggle: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  ing: { fontSize: 11, color: colors.textMuted, marginLeft: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actionText: { fontSize: 12, fontWeight: '600', color: colors.text },
});
