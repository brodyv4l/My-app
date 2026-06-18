import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function PeriodToggle({ value, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      {[{ id: 'week', label: 'Weekly' }, { id: 'month', label: 'Monthly' }].map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.btn, value === opt.id && styles.btnActive]}
          onPress={() => onChange(opt.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === opt.id }}
        >
          <Text style={[styles.text, value === opt.id && styles.textActive]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  text: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  textActive: { color: colors.accent },
});
