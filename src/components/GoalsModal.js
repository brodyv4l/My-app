import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { DEFAULT_GOALS } from '../data/foods';
import { useTheme } from '../context/ThemeContext';

export default function GoalsModal({ visible, goals, onSave, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [form, setForm] = useState({ ...goals });

  useEffect(() => {
    if (visible) setForm({ ...goals });
  }, [visible, goals]);

  const handleSave = () => {
    onSave({
      calories: Number(form.calories) || DEFAULT_GOALS.calories,
      protein: Number(form.protein) || DEFAULT_GOALS.protein,
      carbs: Number(form.carbs) || DEFAULT_GOALS.carbs,
      fat: Number(form.fat) || DEFAULT_GOALS.fat,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modal}>
          <Text style={styles.title}>Daily Goals</Text>
          {[
            { key: 'calories', label: 'Calories' },
            { key: 'protein', label: 'Protein (g)' },
            { key: 'carbs', label: 'Carbs (g)' },
            { key: 'fat', label: 'Fat (g)' },
          ].map(({ key, label }) => (
            <View key={key} style={styles.field}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(form[key])}
                onChangeText={(v) => setForm({ ...form, [key]: v })}
              />
            </View>
          ))}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save Goals</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 20 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modal: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    zIndex: 1,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 16,
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { color: colors.text, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { color: '#0a1a0f', fontWeight: '700' },
});
