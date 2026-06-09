import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useUser } from '../../context/UserContext';
import { MEALS } from '../../data/foods';
import { colors, radius } from '../../constants/theme';
import CalorieRing from '../../components/CalorieRing';
import MacroBar from '../../components/MacroBar';
import MealSection from '../../components/MealSection';
import BottomLogSearch from '../../components/BottomLogSearch';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function LogScreen() {
  const { foodEntries, addFoodEntry, removeFoodEntry, getDayTotals, goals } = useUser();
  const [date, setDate] = useState(todayKey());

  const entries = foodEntries[date] || [];
  const totals = useMemo(() => getDayTotals(date), [getDayTotals, date, foodEntries]);

  const shiftDate = (days) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  const mealEntries = (meal) => entries.filter((e) => e.meal === meal);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.screenTitle}>Diary</Text>
        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => shiftDate(-1)}>
            <Text style={styles.dateBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.dateLabel}>{formatDate(date)}</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => shiftDate(1)}>
            <Text style={styles.dateBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summary}>
          <CalorieRing consumed={totals.calories} goal={goals.calories} />
          <View style={styles.macros}>
            <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color={colors.protein} />
            <MacroBar label="Carbs" value={totals.carbs} goal={goals.carbs} color={colors.carbs} />
            <MacroBar label="Fat" value={totals.fat} goal={goals.fat} color={colors.fat} />
          </View>
        </View>

        {MEALS.map((meal) => (
          <MealSection key={meal} meal={meal} entries={mealEntries(meal)} onRemove={(id) => removeFoodEntry(date, id)} />
        ))}
      </ScrollView>
      <BottomLogSearch onAdd={(entry) => addFoodEntry(date, entry)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 8 },
  screenTitle: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginBottom: 16 },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 },
  dateBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  dateBtnText: { fontSize: 18, color: colors.textSecondary },
  dateLabel: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, minWidth: 160, textAlign: 'center' },
  summary: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 20, marginBottom: 20 },
  macros: { width: '100%', gap: 12 },
});

