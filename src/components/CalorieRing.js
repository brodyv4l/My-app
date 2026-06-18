import { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

function ringColor(colors, consumed, goal) {
  const remaining = goal - consumed;
  if (consumed > goal) return colors.danger;
  if (remaining <= 100) return colors.warning;
  return colors.accent;
}

export default function CalorieRing({ consumed, goal }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const remaining = Math.max(goal - consumed, 0);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const stroke = ringColor(colors, consumed, goal);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: false }).start();
  }, [consumed, goal, anim]);

  const animatedOffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circ, offset],
  });

  return (
    <View style={styles.container}>
      <Svg width={160} height={160} viewBox="0 0 120 120" style={styles.svg}>
        <Circle cx="60" cy="60" r={r} stroke={colors.surface2} strokeWidth={10} fill="none" />
        <Circle
          cx="60" cy="60" r={r}
          stroke={stroke}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          rotation={-90}
          origin="60, 60"
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.value}>{remaining}</Text>
        <Text style={styles.label}>cal remaining</Text>
        <Text style={styles.sub}>{consumed} / {goal} eaten</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { width: 160, height: 160, alignSelf: 'center' },
  svg: { position: 'absolute', top: 0, left: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  value: { fontSize: 32, fontWeight: '700', color: colors.text },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
