import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function MacroBar({ label, value, goal, color }) {
  const pct = Math.min((value / goal) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color }]}>{label}</Text>
        <Text style={styles.nums}>{Math.round(value)}g / {goal}g</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, fontWeight: '600' },
  nums: { fontSize: 13, color: colors.textMuted },
  track: {
    height: 6,
    backgroundColor: colors.surface2,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 99 },
});
