import { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../context/ThemeContext';

export default function WeightTrendChart({ weightData, targetData, subtitle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const width = Dimensions.get('window').width - 72;
  const allValues = [
    ...weightData.map((d) => d.value),
    ...targetData.map((d) => d.value),
  ].filter((v) => v != null);

  const minVal = allValues.length ? Math.min(...allValues) - 2 : 140;
  const maxVal = allValues.length ? Math.max(...allValues) + 2 : 200;

  if (weightData.length < 2) {
    return <Text style={styles.empty}>Log at least 2 weights to see your trend</Text>;
  }

  return (
    <View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <LineChart
        key={`${weightData.length}-${weightData[0]?.date || ''}-${weightData[weightData.length - 1]?.date || ''}`}
        data={weightData}
        data2={targetData.length >= 2 ? targetData : undefined}
        width={width}
        height={200}
        color={colors.accent}
        color2={colors.textMuted}
        thickness={3}
        thickness2={2}
        strokeDashArray2={[6, 6]}
        dataPointsColor={colors.accent}
        hideDataPoints2
        curved
        yAxisOffset={minVal > 0 ? minVal : 0}
        maxValue={maxVal - (minVal > 0 ? minVal : 0)}
        noOfSections={4}
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        rulesColor={colors.border}
        yAxisColor={colors.border}
        xAxisColor={colors.border}
      />
      <View style={styles.legend}>
        <LegendDot color={colors.accent} label="Your weight" />
        {targetData.length >= 2 ? <LegendDot color={colors.textMuted} dashed label="Target path" /> : null}
      </View>
    </View>
  );
}

function LegendDot({ color, label, dashed }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: dashed ? 'transparent' : color, borderColor: color, borderWidth: dashed ? 1 : 0, borderStyle: dashed ? 'dashed' : 'solid' }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  empty: { color: colors.textMuted, textAlign: 'center', padding: 24, fontSize: 14 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.textMuted },
});
