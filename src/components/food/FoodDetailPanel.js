import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, Modal, Pressable, TouchableOpacity, ScrollView, StyleSheet, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import PortionEditor from '../ui/PortionEditor';

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

function scaleFood(food, multiplier) {
  const m = Number(multiplier) || 1;
  return {
    ...food,
    calories: round1((food.calories ?? 0) * m),
    protein: round1((food.protein ?? 0) * m),
    carbs: round1((food.carbs ?? 0) * m),
    fat: round1((food.fat ?? 0) * m),
    fiber: round1((food.fiber ?? 0) * m),
    sugar: round1((food.sugar ?? 0) * m),
    sodium: round1((food.sodium ?? 0) * m),
    servingMultiplier: m,
  };
}

function asRows(items) {
  if (!items) return [];
  if (Array.isArray(items)) {
    return items.map((row) => ({
      label: row.label || row.name || 'Nutrient',
      amount: row.amount ?? row.value ?? row,
      unit: row.unit || '',
    }));
  }
  return Object.entries(items).map(([label, value]) => ({
    label,
    amount: typeof value === 'object' ? (value.amount ?? value.value) : value,
    unit: typeof value === 'object' ? (value.unit || '') : '',
  }));
}

function buildScaledFood(food, base, portion) {
  const active = portion || {
    factor: 1,
    calories: base.calories,
    protein: base.protein,
    carbs: base.carbs,
    fat: base.fat,
    amount: 1,
    unit: 'serving',
    label: food?.serving || '1 serving',
    servingGrams: food?.servingGrams || 100,
    servings: 1,
  };

  return {
    ...food,
    calories: active.calories,
    protein: active.protein,
    carbs: active.carbs,
    fat: active.fat,
    servingMultiplier: active.factor,
    factor: active.factor,
    servings: active.servings || active.factor,
    servingAmount: active.amount,
    servingUnit: active.unit,
    servingGrams: active.servingGrams,
    baseServingGrams: base.baseServingGrams,
    serving: active.label || food.serving,
  };
}

function NutrientRow({ label, amount, unit, bold }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const display = amount == null || amount === '' ? '?' : `${amount}${unit ? ` ${unit}` : ''}`;
  return (
    <View style={styles.nutrientRow}>
      <Text style={[styles.nutrientLabel, bold && styles.nutrientBold]}>{label}</Text>
      <Text style={[styles.nutrientAmt, bold && styles.nutrientBold]}>{display}</Text>
    </View>
  );
}

function NutrientGrid({ title, rows }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (!rows.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row.label} style={styles.gridItem}>
            <Text style={styles.gridLabel} numberOfLines={2}>{row.label}</Text>
            <Text style={styles.gridValue}>
              {row.amount == null ? '?' : `${row.amount}${row.unit ? ` ${row.unit}` : ''}`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CollapsibleSection({ title, rows }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  if (!rows.length) return null;
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.collapseHeader} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.labelBox}>
          {rows.map((row) => (
            <NutrientRow key={row.label} label={row.label} amount={row.amount} unit={row.unit} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function FoodDetailPanel({
  visible, food, onClose, onLog, onFavorite, isFavorite,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [portion, setPortion] = useState(null);
  const portionRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    portionRef.current = null;
    setPortion(null);
  }, [food?.id, visible]);

  const handlePortionChange = useCallback((nextPortion) => {
    portionRef.current = nextPortion;
    setPortion(nextPortion);
  }, []);

  const base = useMemo(() => ({
    calories: food?.calories ?? 0,
    protein: food?.protein ?? 0,
    carbs: food?.carbs ?? 0,
    fat: food?.fat ?? 0,
    baseServingGrams: food?.servingGrams || 100,
    servingGrams: food?.servingGrams || 100,
  }), [food]);

  const activePortion = portion || {
    factor: 1,
    calories: base.calories,
    protein: base.protein,
    carbs: base.carbs,
    fat: base.fat,
    amount: 1,
    unit: 'serving',
    label: food?.serving || '1 serving',
    servingGrams: food?.servingGrams || 100,
  };

  const scaled = useMemo(() => {
    if (!food) return null;
    return {
      ...food,
      calories: activePortion.calories,
      protein: activePortion.protein,
      carbs: activePortion.carbs,
      fat: activePortion.fat,
      servingMultiplier: activePortion.factor,
      factor: activePortion.factor,
      servings: activePortion.servings || activePortion.factor,
      servingAmount: activePortion.amount,
      servingUnit: activePortion.unit,
      servingGrams: activePortion.servingGrams,
      baseServingGrams: base.baseServingGrams,
      serving: activePortion.label || food.serving,
    };
  }, [food, activePortion, base.baseServingGrams]);

  if (!food || !scaled) return null;

  const vitamins = asRows(food.vitamins);
  const minerals = asRows(food.minerals);
  const aminoAcids = asRows(food.aminoAcids);
  const fattyAcids = asRows(food.fattyAcids);

  const handleLog = () => {
    Keyboard.dismiss();
    const payload = buildScaledFood(food, base, portionRef.current || portion);
    onLog?.(payload);
    onClose?.();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingTop: Math.max(insets.top, 8), paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={12}>
            <Feather name="chevron-left" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={2}>{food.name}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>{food.brand?.trim() ? food.brand : 'Generic'}</Text>

          <PortionEditor
            key={food.id}
            base={base}
            baseGrams={base.baseServingGrams}
            onChange={handlePortionChange}
          />

          <View style={styles.labelBox}>
            <Text style={styles.labelHeading}>Nutrition Facts</Text>
            <Text style={styles.servingLine}>
              Serving: {activePortion.label || food.serving || '1 serving'}
            </Text>
            <View style={styles.thickRule} />
            <NutrientRow label="Calories" amount={scaled.calories} unit="" bold />
            <View style={styles.rule} />
            <NutrientRow label="Total Fat" amount={scaled.fat} unit="g" bold />
            <NutrientRow label="Total Carbohydrate" amount={scaled.carbs} unit="g" bold />
            <NutrientRow label="Protein" amount={scaled.protein} unit="g" bold />
            {scaled.fiber != null ? <NutrientRow label="Dietary Fiber" amount={scaled.fiber} unit="g" /> : null}
            {scaled.sugar != null ? <NutrientRow label="Total Sugars" amount={scaled.sugar} unit="g" /> : null}
            {scaled.sodium != null ? <NutrientRow label="Sodium" amount={scaled.sodium} unit="mg" /> : null}
          </View>

          <NutrientGrid title="Vitamins" rows={vitamins} />
          <NutrientGrid title="Minerals" rows={minerals} />
          <CollapsibleSection title="Amino Acids" rows={aminoAcids} />
          <CollapsibleSection title="Fatty Acids" rows={fattyAcids} />
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Button title="+ Log Food" onPress={handleLog} style={styles.footerBtn} />
          <TouchableOpacity
            style={[styles.saveBtn, isFavorite && styles.saveBtnOn]}
            onPress={() => onFavorite?.(food)}
          >
            <Feather name="heart" size={18} color={isFavorite ? colors.danger : colors.text} />
            <Text style={styles.saveBtnText}>Save</Text>
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
    maxHeight: '92%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    marginBottom: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'flex-start' },
  closeBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  brand: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 12 },
  scroll: { flexGrow: 0 },
  multRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  multChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  multChipOn: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  multChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  multChipTextOn: { color: colors.accent },
  customInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  labelBox: {
    borderWidth: 2,
    borderColor: colors.text,
    padding: 12,
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  labelHeading: { fontSize: 22, fontWeight: '800', color: colors.text },
  servingLine: { fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: 8 },
  thickRule: { height: 8, backgroundColor: colors.text, marginVertical: 6 },
  rule: { height: 1, backgroundColor: colors.borderLight, marginVertical: 4 },
  nutrientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  nutrientLabel: { fontSize: 14, color: colors.text, flex: 1 },
  nutrientAmt: { fontSize: 14, color: colors.text, fontWeight: '600' },
  nutrientBold: { fontWeight: '700' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridLabel: { fontSize: 12, color: colors.textMuted },
  gridValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 4 },
  collapseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtn: { flex: 1 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 50,
  },
  saveBtnOn: { borderColor: colors.danger, backgroundColor: 'rgba(239, 68, 68, 0.12)' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: colors.text },
});
