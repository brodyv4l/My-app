import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { radius } from '../../constants/theme';

const BG = '#2A2A2A';
const SHIMMER = '#3A3A3A';

export default function SkeletonFoodCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Animated.View style={[styles.lineLg, { opacity }]} />
        <Animated.View style={[styles.badge, { opacity }]} />
      </View>
      <Animated.View style={[styles.lineSm, { opacity }]} />
      <View style={styles.calRow}>
        <Animated.View style={[styles.calBlock, { opacity }]} />
        <Animated.View style={[styles.pill, { opacity }]} />
        <Animated.View style={[styles.pill, { opacity }]} />
        <Animated.View style={[styles.pill, { opacity }]} />
      </View>
      <View style={styles.actions}>
        <Animated.View style={[styles.btn, { opacity }]} />
        <Animated.View style={[styles.heart, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BG,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BG,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  lineLg: { height: 14, width: '55%', backgroundColor: SHIMMER, borderRadius: 6 },
  badge: { height: 20, width: 52, backgroundColor: SHIMMER, borderRadius: radius.full },
  lineSm: { height: 11, width: '38%', backgroundColor: SHIMMER, borderRadius: 6, marginBottom: 12 },
  calRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  calBlock: { height: 28, width: 64, backgroundColor: SHIMMER, borderRadius: 6 },
  pill: { flex: 1, height: 24, backgroundColor: SHIMMER, borderRadius: radius.full },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: { flex: 1, height: 36, backgroundColor: SHIMMER, borderRadius: radius.sm },
  heart: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: SHIMMER },
});
