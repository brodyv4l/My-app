import { useMemo } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export const PRIVACY_TEXT = 'NutriTrack collects only the data necessary to provide nutrition tracking services. Your data is stored securely and never sold to third parties. Contact support@nutritrack.app for data requests.';

export const TERMS_TEXT = 'By using NutriTrack you agree to use the app for personal nutrition tracking purposes only. NutriTrack Pro subscriptions auto-renew monthly or annually. Cancel anytime from your profile.';

export default function LegalModal({ visible, title, body, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.body}>{body}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.btnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function PrivacyPolicyModal({ visible, onClose }) {
  return <LegalModal visible={visible} title="Privacy Policy" body={PRIVACY_TEXT} onClose={onClose} />;
}

export function TermsModal({ visible, onClose }) {
  return <LegalModal visible={visible} title="Terms of Service" body={TERMS_TEXT} onClose={onClose} />;
}

const makeStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', flex: 1 },
  close: { color: colors.textSecondary, fontSize: 18, paddingLeft: 12 },
  scroll: { flexGrow: 0 },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 23 },
  btn: { backgroundColor: colors.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  btnText: { color: colors.onAccent, fontSize: 16, fontWeight: '800' },
});
