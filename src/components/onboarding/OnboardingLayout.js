import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../constants/theme';

export default function OnboardingLayout({
  stepIndex,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  footer,
}) {
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          {stepIndex > 0 ? (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ) : <View style={styles.backBtn} />}
          <Text style={styles.stepLabel}>Step {stepIndex + 1} of {totalSteps}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {children}
        </ScrollView>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    minHeight: 44,
  },
  backBtn: { minWidth: 64, minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  stepLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  progressTrack: {
    height: 3,
    backgroundColor: colors.surface2,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: colors.accent },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginBottom: spacing.sm },
  subtitle: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.lg },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
