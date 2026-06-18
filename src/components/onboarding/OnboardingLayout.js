import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

function ProgressDots({ activeIndex, total = 5 }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
      ))}
    </View>
  );
}

export default function OnboardingLayout({
  stepIndex,
  totalSteps = 5,
  title,
  subtitle,
  children,
  onBack,
  footer,
  hideHeader = false,
  showDots = true,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {!hideHeader && (
          <View style={styles.header}>
            {stepIndex > 0 ? (
              <TouchableOpacity onPress={onBack} hitSlop={12} accessibilityRole="button">
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            ) : <View style={styles.backPlaceholder} />}
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {children}
        </ScrollView>

        <View style={styles.bottom}>
          {footer}
          {showDots ? <ProgressDots activeIndex={stepIndex} total={totalSteps} /> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.textMuted, fontSize: 16, fontWeight: '500' },
  backPlaceholder: { height: 44 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginBottom: spacing.sm },
  subtitle: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.lg },
  bottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface2 },
  dotActive: { backgroundColor: colors.accent, width: 24 },
});
