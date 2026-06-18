import { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function AnalyzingSkeleton({ imageUri }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={styles.wrap}>
      {imageUri ? (
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          <Animated.View style={[styles.overlay, { opacity: pulse }]} />
        </View>
      ) : null}
      <View style={styles.card}>
        <View style={styles.lineLg} />
        <View style={styles.lineMd} />
        <View style={styles.row}>
          <View style={styles.chip} />
          <View style={styles.chip} />
          <View style={styles.chip} />
        </View>
      </View>
      <Text style={styles.label}>Analyzing your meal...</Text>
      <Text style={styles.sub}>Estimating portions, calories, and macros</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 16 },
  imageWrap: { width: '100%', height: 200, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 16 },
  image: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.accent },
  card: {
    width: '100%',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  lineLg: { height: 16, width: '70%', backgroundColor: colors.surface3, borderRadius: 6 },
  lineMd: { height: 12, width: '45%', backgroundColor: colors.surface3, borderRadius: 6 },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: { flex: 1, height: 28, backgroundColor: colors.surface3, borderRadius: 6 },
  label: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 16 },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
