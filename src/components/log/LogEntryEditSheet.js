import { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import PortionEditor from '../ui/PortionEditor';
import { calculateNutrition, portionFromEntry } from '../../utils/nutritionUnits';

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

export default function LogEntryEditSheet({ visible, entry, onUpdate, onDelete, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const servings = entry?.servings && entry.servings > 0 ? entry.servings : 1;
  const { amount: initAmount, unit: initUnit } = entry
    ? portionFromEntry(entry)
    : { amount: 1, unit: 'serving' };

  const base = useMemo(() => {
    if (!entry) return { calories: 0, protein: 0, carbs: 0, fat: 0, baseServingGrams: 100 };
    const factor = initUnit === 'serving' ? servings : (Number(entry.servingGrams) || 100) / 100;
    const div = factor > 0 ? factor : 1;
    return {
      calories: (entry.calories || 0) / div,
      protein: (entry.protein || 0) / div,
      carbs: (entry.carbs || 0) / div,
      fat: (entry.fat || 0) / div,
      baseServingGrams: entry.baseServingGrams || entry.servingGrams || 100,
      servingGrams: entry.baseServingGrams || entry.servingGrams || 100,
    };
  }, [entry, servings, initUnit]);

  const [portion, setPortion] = useState(null);
  useEffect(() => {
    if (!entry || !visible) return;
    const p = portionFromEntry(entry);
    const nutrition = calculateNutrition(base, p.amount, p.unit);
    setPortion({
      amount: p.amount,
      unit: p.unit,
      factor: nutrition.factor,
      servings: p.unit === 'serving' ? p.amount : nutrition.factor,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      servingGrams: entry.servingGrams || nutrition.servingGrams,
      label: entry.serving || `${p.amount} ${p.unit}`,
    });
  }, [entry?.id, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((p) => setPortion(p), []);

  if (!entry) return null;

  const handleUpdate = () => {
    const p = portion;
    if (!p) return;
    onUpdate?.({
      servings: round1(p.unit === 'serving' ? p.amount : p.factor || 1),
      servingAmount: p.amount,
      servingUnit: p.unit,
      servingGrams: p.servingGrams,
      calories: Math.round(p.calories),
      protein: round1(p.protein),
      carbs: round1(p.carbs),
      fat: round1(p.fat),
      serving: p.label || entry.serving,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{entry.name}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>{entry.meal} · {entry.serving || '1 serving'}</Text>

        <PortionEditor
          key={entry.id}
          base={base}
          baseGrams={base.baseServingGrams}
          initialAmount={initAmount}
          initialUnit={initUnit}
          onChange={handleChange}
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete?.()} activeOpacity={0.85}>
            <Feather name="trash-2" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} activeOpacity={0.85}>
            <Text style={styles.updateText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderLight, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  closeBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.danger, backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  deleteText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  updateBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 14 },
  updateText: { color: colors.onAccent, fontWeight: '700', fontSize: 14 },
});
