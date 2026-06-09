import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useUser } from '../../context/UserContext';
import { generateMealPlan, isOpenAIConfigured } from '../../services/openai';
import { buildSyncedWeekPlan, getDayPlanFromWeek } from '../../services/mealPlanner';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
import DayMealPlanner from '../../components/meals/DayMealPlanner';
import GroceryListView from '../../components/meals/GroceryListView';
import { colors, radius } from '../../constants/theme';
import { DAY_NAMES } from '../../data/mealTemplates';
import { groupByAisle } from '../../data/groceryAisles';

export default function MealsScreen() {
  const { profile, goals, mealPlan, saveMealPlan, groceryChecked, toggleGroceryItem } = useUser();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('day');
  const [dayIndex, setDayIndex] = useState(0);

  const syncedPlan = useMemo(() => {
    if (mealPlan?.days?.length) return mealPlan;
    return null;
  }, [mealPlan]);

  const dayPlan = useMemo(() => getDayPlanFromWeek(syncedPlan, dayIndex), [syncedPlan, dayIndex]);
  const groceryGroups = syncedPlan?.groceryGroups || groupByAisle(syncedPlan?.groceryList || []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let plan;
      if (isOpenAIConfigured()) {
        const aiPlan = await generateMealPlan(profile, goals);
        const synced = buildSyncedWeekPlan(goals);
        plan = {
          ...aiPlan,
          days: synced.days.map((d, i) => ({
            day: aiPlan.days?.[i]?.day || d.day,
            meals: synced.days[i].meals,
            totals: synced.days[i].totals,
          })),
          groceryList: synced.groceryList,
          groceryGroups: synced.groceryGroups,
        };
      } else {
        plan = buildSyncedWeekPlan(goals);
      }
      saveMealPlan(plan);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Meal Planner</Text>
      <Text style={styles.subtitle}>
        Meals auto-synced to your {goals.calories} cal/day target (Â±50 cal)
      </Text>

      <Button
        title={loading ? 'Generating...' : 'Generate Weekly Plan'}
        onPress={handleGenerate}
        loading={loading}
        style={styles.genBtn}
      />

      <View style={styles.toggle}>
        {[{ id: 'day', label: 'Day View' }, { id: 'grocery', label: 'Grocery List' }].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.toggleBtn, view === tab.id && styles.toggleActive]}
            onPress={() => setView(tab.id)}
          >
            <Text style={[styles.toggleText, view === tab.id && styles.toggleTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {view === 'day' && (
        <Card>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
            {(syncedPlan?.days || DAY_NAMES.map((d) => ({ day: d }))).map((d, i) => (
              <TouchableOpacity
                key={d.day}
                style={[styles.dayChip, dayIndex === i && styles.dayChipOn]}
                onPress={() => setDayIndex(i)}
              >
                <Text style={[styles.dayChipText, dayIndex === i && styles.dayChipTextOn]}>{d.day.slice(0, 3)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <DayMealPlanner dayPlan={dayPlan} goals={goals} />
        </Card>
      )}

      {view === 'grocery' && (
        <Card>
          <SectionTitle title="Grocery List" subtitle="Grouped by aisle for your active week" />
          <GroceryListView
            groups={groceryGroups}
            checked={groceryChecked}
            onToggle={toggleGroceryItem}
          />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 6, marginBottom: 20, lineHeight: 20 },
  genBtn: { marginBottom: 16 },
  toggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  toggleTextActive: { color: colors.accent },
  dayPicker: { marginBottom: 16 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface2,
  },
  dayChipOn: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  dayChipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  dayChipTextOn: { color: colors.accent },
});

