import { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import PortionEditor from '../ui/PortionEditor';
import MealSelectorModal from './MealSelectorModal';

import { getLocalDateString } from '../../utils/dates';

function todayKey() {
  return getLocalDateString();
}

export default function ChatFoodCard({ food }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { addFoodEntry } = useUser();
  const { showToast } = useToast();

  const base = useMemo(() => ({
    calories: food.calories || 0,
    protein: food.protein || 0,
    carbs: food.carbs || 0,
    fat: food.fat || 0,
  }), [food]);

  const [portion, setPortion] = useState({ ...base, factor: 1, servings: 1, label: food.serving });
  const [mealPickerVisible, setMealPickerVisible] = useState(false);

  const handlePortionChange = useCallback((p) => setPortion(p), []);

  const handleMealSelect = (meal) => {
    addFoodEntry(todayKey(), {
      id: `ai-chat-${Date.now()}`,
      foodId: food.id,
      name: food.name,
      meal,
      servings: portion.factor || 1,
      servingAmount: portion.amount ?? portion.factor ?? 1,
      servingUnit: portion.unit || 'serving',
      servingGrams: portion.servingGrams,
      calories: Math.round(portion.calories ?? base.calories),
      protein: Math.round((portion.protein ?? base.protein) * 10) / 10,
      carbs: Math.round((portion.carbs ?? base.carbs) * 10) / 10,
      fat: Math.round((portion.fat ?? base.fat) * 10) / 10,
      serving: portion.label || food.serving || '1 serving',
      source: 'ai-chat',
    });
    setMealPickerVisible(false);
    showToast(`Added ${food.name} to ${meal}! ✓`, 'success');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.name} numberOfLines={2}>{food.name}</Text>
      {food.serving ? <Text style={styles.serving}>{food.serving}</Text> : null}

      <View style={styles.macroRow}>
        <Text style={styles.calories}>{Math.round(portion.calories ?? base.calories)}</Text>
        <Text style={styles.calUnit}>cal</Text>
        <View style={[styles.pill, { borderColor: colors.protein }]}>
          <Text style={[styles.pillVal, { color: colors.protein }]}>P {Math.round(portion.protein ?? base.protein)}g</Text>
        </View>
        <View style={[styles.pill, { borderColor: colors.carbs }]}>
          <Text style={[styles.pillVal, { color: colors.carbs }]}>C {Math.round(portion.carbs ?? base.carbs)}g</Text>
        </View>
        <View style={[styles.pill, { borderColor: colors.fat }]}>
          <Text style={[styles.pillVal, { color: colors.fat }]}>F {Math.round(portion.fat ?? base.fat)}g</Text>
        </View>
      </View>

      <PortionEditor base={base} onChange={handlePortionChange} />

      <TouchableOpacity style={styles.logBtn} onPress={() => setMealPickerVisible(true)} activeOpacity={0.85}>
        <Feather name="plus" size={16} color={colors.onAccent} />
        <Text style={styles.logBtnText}>Log This</Text>
      </TouchableOpacity>

      <MealSelectorModal
        visible={mealPickerVisible}
        food={food}
        onSelect={handleMealSelect}
        onClose={() => setMealPickerVisible(false)}
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    width: '92%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  serving: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  calories: { fontSize: 22, fontWeight: '800', color: colors.accent },
  calUnit: { fontSize: 12, color: colors.textMuted, marginRight: 4 },
  pill: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  pillVal: { fontSize: 12, fontWeight: '700' },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    marginTop: 12,
  },
  logBtnText: { fontSize: 14, fontWeight: '700', color: colors.onAccent },
});
