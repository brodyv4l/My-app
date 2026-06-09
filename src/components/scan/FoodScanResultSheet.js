import { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { colors, radius, MEAL_TYPES, defaultMealByTime } from '../../constants/theme';

export default function FoodScanResultSheet({ visible, food, onClose, onLog }) {
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [meal, setMeal] = useState(defaultMealByTime());
  const [form, setForm] = useState({ name: '', serving: '', calories: '', protein: '', carbs: '', fat: '' });

  useEffect(() => {
    if (!food) return;
    setForm({
      name: food.name || '',
      serving: food.serving || '1 serving',
      calories: String(food.calories ?? ''),
      protein: String(food.protein ?? ''),
      carbs: String(food.carbs ?? ''),
      fat: String(food.fat ?? ''),
    });
    setEditing(false);
    setMeal(defaultMealByTime());
  }, [food]);

  if (!food) return null;

  const handleLog = () => {
    onLog?.({
      name: form.name,
      serving: form.serving,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      meal,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{editing ? 'Edit Details' : 'AI Food Analysis'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <Feather name="x" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {!editing ? (
              <View>
                <Text style={styles.foodName}>{form.name}</Text>
                <Text style={styles.portion}>{form.serving}</Text>
                <View style={styles.calBox}>
                  <Text style={styles.calValue}>{form.calories}</Text>
                  <Text style={styles.calLbl}>estimated calories</Text>
                </View>
                <View style={styles.macroRow}>
                  <MacroChip label="Protein" value={`${form.protein}g`} color={colors.protein} />
                  <MacroChip label="Carbs" value={`${form.carbs}g`} color={colors.carbs} />
                  <MacroChip label="Fat" value={`${form.fat}g`} color={colors.fat} />
                </View>
                {food.confidence ? (
                  <Text style={styles.confidence}>Confidence: {food.confidence}</Text>
                ) : null}
              </View>
            ) : (
              <View>
                <Input label="Food name" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
                <Input label="Portion / serving" value={form.serving} onChangeText={(v) => setForm((f) => ({ ...f, serving: v }))} />
                <Input label="Calories" value={form.calories} onChangeText={(v) => setForm((f) => ({ ...f, calories: v }))} keyboardType="decimal-pad" />
                <Input label="Protein (g)" value={form.protein} onChangeText={(v) => setForm((f) => ({ ...f, protein: v }))} keyboardType="decimal-pad" />
                <Input label="Carbs (g)" value={form.carbs} onChangeText={(v) => setForm((f) => ({ ...f, carbs: v }))} keyboardType="decimal-pad" />
                <Input label="Fat (g)" value={form.fat} onChangeText={(v) => setForm((f) => ({ ...f, fat: v }))} keyboardType="decimal-pad" />
              </View>
            )}

            <Text style={styles.mealLbl}>Log to meal</Text>
            <View style={styles.mealRow}>
              {MEAL_TYPES.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.mealChip, meal === m && styles.mealChipOn]}
                  onPress={() => setMeal(m)}
                >
                  <Text style={[styles.mealChipText, meal === m && styles.mealChipTextOn]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Button
              title={editing ? 'Done Editing' : 'Edit Details'}
              variant="outline"
              onPress={() => setEditing((e) => !e)}
              style={styles.actionBtn}
            />
            <Button title="Log Meal" onPress={handleLog} style={styles.actionBtn} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MacroChip({ label, value, color }) {
  return (
    <View style={styles.macroChip}>
      <Text style={[styles.macroVal, { color }]}>{value}</Text>
      <Text style={styles.macroLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetWrap: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderLight, alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  foodName: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  portion: { fontSize: 14, color: colors.textMuted, marginBottom: 16 },
  calBox: { alignItems: 'center', paddingVertical: 16, marginBottom: 16, backgroundColor: colors.surface2, borderRadius: radius.md },
  calValue: { fontSize: 40, fontWeight: '800', color: colors.accent },
  calLbl: { fontSize: 13, color: colors.textMuted },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  macroChip: { alignItems: 'center' },
  macroVal: { fontSize: 18, fontWeight: '700' },
  macroLbl: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  confidence: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  mealLbl: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  mealChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
  mealChipOn: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  mealChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  mealChipTextOn: { color: colors.accent },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1 },
});
