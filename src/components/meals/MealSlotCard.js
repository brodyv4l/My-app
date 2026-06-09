import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../../constants/theme';

const SLOT_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };

export default function MealSlotCard({ meal }) {
  if (!meal) return null;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.type}>{SLOT_LABELS[meal.type] || meal.type}</Text>
        <Text style={styles.cal}>{meal.calories} cal</Text>
      </View>
      <Text style={styles.name}>{meal.name}</Text>
      <Text style={styles.macros}>P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g</Text>
      {meal.serving ? <Text style={styles.serving}>{meal.serving}</Text> : null}
      {meal.ingredients?.length ? (
        <Text style={styles.ingredients}>{meal.ingredients.join(' · ')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  type: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  cal: { fontSize: 13, fontWeight: '700', color: colors.accent },
  name: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  macros: { fontSize: 12, color: colors.textMuted },
  serving: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  ingredients: { fontSize: 11, color: colors.textMuted, marginTop: 8, fontStyle: 'italic', lineHeight: 16 },
});
