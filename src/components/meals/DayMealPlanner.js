import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MealSlotCard from './MealSlotCard';
import MacroBar from '../MacroBar';
import { useTheme } from '../../context/ThemeContext';

function mealsToArray(day) {
  if (Array.isArray(day?.meals)) return day.meals;
  if (!day?.meals) return [];
  return ['breakfast','lunch','dinner','snack'].map((type) => ({ type, ...day.meals[type] })).filter((m) => m.name);
}

function calcTotals(day) {
  if (day.totalCalories) return { calories: day.totalCalories, protein: day.totalProtein, carbs: day.totalCarbs, fat: day.totalFat };
  const meals = mealsToArray(day);
  return meals.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

export default function DayMealPlanner({ dayPlan, goals, onLogMeal, onSwapMeal, onSaveTemplate, isPro }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const meals = mealsToArray(dayPlan);
  if (!meals.length) return <Text style={styles.empty}>Generate a plan to see your AI-crafted meals.</Text>;

  const totals = calcTotals(dayPlan);
  const calDiff = Math.abs(totals.calories - goals.calories);
  const color = calDiff <= 50 ? colors.success : calDiff <= 150 ? colors.warning : colors.danger;

  return (
    <View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Daily Total: <Text style={{ color }}>{totals.calories}</Text> / {goals.calories} cal</Text>
        <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color={colors.protein} />
        <MacroBar label="Carbs" value={totals.carbs} goal={goals.carbs} color={colors.carbs} />
        <MacroBar label="Fat" value={totals.fat} goal={goals.fat} color={colors.fat} />
      </View>
      {meals.map((meal, i) => (
        <MealSlotCard key={`${meal.type}-${i}`} meal={meal} onLog={onLogMeal} onSwap={onSwapMeal} onSaveTemplate={onSaveTemplate} isPro={isPro} />
      ))}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  empty: { color: colors.textMuted, textAlign: 'center', padding: 24 },
  summaryCard: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, marginBottom: 16, gap: 8 },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
});
