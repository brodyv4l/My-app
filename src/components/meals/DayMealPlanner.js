import { View, Text, StyleSheet } from 'react-native';
import MealSlotCard from './MealSlotCard';
import MacroBar from '../MacroBar';
import { colors } from '../../constants/theme';
import { CALORIE_TOLERANCE } from '../../services/mealPlanner';

export default function DayMealPlanner({ dayPlan, goals }) {
  if (!dayPlan?.meals?.length) {
    return <Text style={styles.empty}>Generate a plan to see your synced meals.</Text>;
  }

  const totals = dayPlan.totals || dayPlan.meals.reduce((acc, m) => ({
    calories: acc.calories + m.calories,
    protein: acc.protein + m.protein,
    carbs: acc.carbs + m.carbs,
    fat: acc.fat + m.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const calDiff = Math.abs(totals.calories - goals.calories);
  const synced = calDiff <= CALORIE_TOLERANCE;

  return (
    <View>
      <View style={styles.summary}>
        <Text style={styles.dayTitle}>{dayPlan.day || 'Today'}</Text>
        <View style={[styles.badge, synced ? styles.badgeOk : styles.badgeWarn]}>
          <Text style={styles.badgeText}>{synced ? 'Calorie-synced' : `Within ${calDiff} cal`}</Text>
        </View>
      </View>

      <View style={styles.totalsRow}>
        <Text style={styles.totalCal}>{totals.calories}</Text>
        <Text style={styles.totalLbl}> / {goals.calories} daily calories</Text>
      </View>

      <View style={styles.macroBox}>
        <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color={colors.protein} />
        <MacroBar label="Carbs" value={totals.carbs} goal={goals.carbs} color={colors.carbs} />
        <MacroBar label="Fat" value={totals.fat} goal={goals.fat} color={colors.fat} />
      </View>

      {dayPlan.meals.map((meal, i) => (
        <MealSlotCard key={`${meal.type}-${i}`} meal={meal} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, textAlign: 'center', padding: 24 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeOk: { backgroundColor: colors.accentMuted },
  badgeWarn: { backgroundColor: 'rgba(251, 191, 36, 0.15)' },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.accent },
  totalsRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  totalCal: { fontSize: 32, fontWeight: '800', color: colors.accent },
  totalLbl: { fontSize: 14, color: colors.textMuted },
  macroBox: { gap: 10, marginBottom: 20 },
});
