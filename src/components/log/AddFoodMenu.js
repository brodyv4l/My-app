import { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../constants/theme';

const OPTIONS = [
  { id: 'database', label: 'Food Database', icon: 'database', desc: 'Search foods, restaurants & favorites' },
  { id: 'barcode', label: 'Scan Barcode', icon: 'maximize', desc: 'Scan a product UPC code' },
  { id: 'photo', label: 'Scan Food', icon: 'camera', desc: 'AI photo nutrition analysis', badge: 'BETA' },
];

export default function AddFoodMenu({ visible, onClose, onSelect }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Food</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={styles.option}
              onPress={() => onSelect(opt.id)}
              activeOpacity={0.85}
            >
              <View style={styles.iconWrap}>
                <Feather name={opt.icon} size={22} color={colors.accent} />
              </View>
              <View style={styles.optionText}>
                <View style={styles.labelRow}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  {opt.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{opt.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({ web: { maxHeight: '90vh' } }),
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  close: { fontSize: 18, color: colors.textMuted },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: { backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '800', color: colors.onAccent, letterSpacing: 0.5 },
  optionDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
