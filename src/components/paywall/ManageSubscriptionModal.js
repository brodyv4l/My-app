import { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

function prettyDate(dateStr) {
  if (!dateStr) return 'the end of your billing period';
  const d = new Date(dateStr.length <= 10 ? dateStr + 'T12:00:00' : dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * In-app subscription management — cancel without leaving the app.
 * Parent handles confirmation and Stripe cancellation via onCancel().
 */
export default function ManageSubscriptionModal({ visible, profile, onCancel, onClose, cancelBusy }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const planLabel = profile?.subscriptionPlan === 'annual' ? 'Pro Annual ($39.99/yr)' : 'Pro Monthly ($4.99/mo)';
  const endLabel = prettyDate(profile?.subscriptionEndDate);
  const cancelled = !!profile?.subscriptionCancelAtPeriodEnd;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Subscription</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current plan</Text>
            <Text style={styles.infoValue}>{planLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{cancelled ? 'Pro access until' : 'Next billing date'}</Text>
            <Text style={styles.infoValue}>{endLabel}</Text>
          </View>

          {cancelled ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                Your membership is cancelled. You keep Pro until {endLabel} — no further charges.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.easyCancelHint}>
                Cancel anytime from here. No phone calls, emails, or external portal required.
              </Text>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => onCancel?.()}
                disabled={cancelBusy}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelText}>{cancelBusy ? 'Cancelling…' : 'Cancel Membership'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', flex: 1 },
  close: { color: colors.textSecondary, fontSize: 18, paddingLeft: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { color: colors.textMuted, fontSize: 14 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  easyCancelHint: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 20 },
  cancelBtn: { marginTop: 16, borderWidth: 1, borderColor: colors.danger, borderRadius: 14, padding: 16, alignItems: 'center' },
  cancelText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  noticeBox: { marginTop: 20, backgroundColor: colors.surface2, borderRadius: 14, padding: 16 },
  noticeText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
