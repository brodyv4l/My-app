import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import {
  ALL_UNITS,
  calculateNutrition,
  formatPortionLabel,
  inferDefaultUnit,
  isCountUnit,
} from '../../utils/nutritionUnits';

/**
 * Portion editor with amount + unit dropdown.
 * onChange(portion): { amount, unit, servings, factor, calories, protein, carbs, fat, label, servingGrams }
 */
export default function PortionEditor({
  base = {},
  baseGrams,
  initialAmount = 1,
  initialUnit,
  onChange,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const resolvedBaseGrams = baseGrams ?? base.baseServingGrams ?? base.servingGrams ?? 100;
  const defaultUnit = initialUnit || inferDefaultUnit(base);
  const [amount, setAmount] = useState(String(initialAmount));
  const [unit, setUnit] = useState(defaultUnit);
  const [unitOpen, setUnitOpen] = useState(false);

  useEffect(() => {
    setAmount(String(initialAmount));
    setUnit(initialUnit || inferDefaultUnit(base));
  }, [base?.id, initialAmount, initialUnit]); // eslint-disable-line react-hooks/exhaustive-deps

  const baseFood = useMemo(() => ({
    ...base,
    baseServingGrams: resolvedBaseGrams,
    servingGrams: resolvedBaseGrams,
  }), [base, resolvedBaseGrams]);

  const computed = useMemo(() => {
    const amt = Number(amount) || 0;
    const nutrition = calculateNutrition(baseFood, amt, unit);
    const label = formatPortionLabel(amt, unit);
    return {
      amount: amt,
      unit,
      servings: isCountUnit(unit) ? amt : nutrition.factor,
      factor: nutrition.factor,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      servingGrams: nutrition.servingGrams,
      label,
    };
  }, [amount, unit, baseFood]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const sig = `${computed.amount}|${computed.unit}|${computed.calories}|${computed.protein}`;
  useLayoutEffect(() => { onChangeRef.current?.(computed); }, [sig, computed]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="1"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity style={styles.unitBtn} onPress={() => setUnitOpen(true)} activeOpacity={0.85}>
          <Text style={styles.unitText}>{unit}</Text>
          <Feather name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {unitOpen ? (
        <View style={styles.unitDropdown}>
          <ScrollView style={styles.unitDropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {ALL_UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitOption, unit === u && styles.unitOptionOn]}
                onPress={() => { setUnit(u); setUnitOpen(false); }}
              >
                <Text style={[styles.unitOptionText, unit === u && styles.unitOptionTextOn]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Text style={styles.preview}>
        {computed.calories} cal {String.fromCharCode(183)} P {computed.protein}g {String.fromCharCode(183)} C {computed.carbs}g {String.fromCharCode(183)} F {computed.fat}g
      </Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { gap: 10, marginTop: 8, position: 'relative' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountInput: {
    flex: 1,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  unitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    minWidth: 100,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  unitDropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    zIndex: 30,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  unitDropdownScroll: { maxHeight: 220 },
  unitOption: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.sm },
  unitOptionOn: { backgroundColor: colors.accentMuted },
  unitOptionText: { color: colors.text, fontSize: 15 },
  unitOptionTextOn: { color: colors.accent, fontWeight: '700' },
  preview: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
