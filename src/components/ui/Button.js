import { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onAccent : colors.accent} />
      ) : (
        <Text style={[styles.text, isPrimary && styles.textPrimary, isOutline && styles.textOutline, isGhost && styles.textGhost]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primary: { backgroundColor: colors.accent },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: colors.surface2 },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '700' },
  textPrimary: { color: colors.onAccent },
  textOutline: { color: colors.text },
  textGhost: { color: colors.textMuted },
});
