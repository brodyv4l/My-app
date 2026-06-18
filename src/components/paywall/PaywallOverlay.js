import { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { radius, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function PaywallOverlay({ visible, featureName, benefit, onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.8);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          <Text style={styles.lock}>🔒</Text>
          <Text style={styles.title}>{featureName} is a Pro Feature</Text>
          <Text style={styles.benefit}>{benefit}</Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => { onDismiss?.(); navigation.navigate('Upgrade'); }}
          >
            <Text style={styles.ctaText}>Start 14-Day Free Trial 🚀</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.later}>Maybe Later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, alignItems: 'center' },
  lock: { fontSize: 40, marginBottom: spacing.sm },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  benefit: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  cta: { width: '100%', backgroundColor: colors.accent, paddingVertical: 14, borderRadius: radius.sm, alignItems: 'center', marginBottom: spacing.md },
  ctaText: { fontWeight: '700', color: colors.onAccent, fontSize: 15 },
  later: { color: colors.textMuted, fontSize: 14 },
});
