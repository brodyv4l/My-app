import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

export default function WelcomeStep() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoEmoji}>🌱</Text>
      </View>
      <Text style={styles.brand}>Foodprint</Text>
      <Text style={styles.title}>Welcome to Foodprint 🌱</Text>
      <Text style={styles.subtitle}>Let's build your personalized nutrition plan in under 2 minutes.</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.accentMuted, borderWidth: 2, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  logoEmoji: { fontSize: 48 },
  brand: { fontSize: 14, fontWeight: '700', color: colors.accent, letterSpacing: 2, marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center', lineHeight: 24, paddingHorizontal: spacing.md },
});
