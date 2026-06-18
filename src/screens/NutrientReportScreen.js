import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../constants/theme';
import ScreenLayout from '../components/layout/ScreenLayout';
import BackHeader from '../components/layout/BackHeader';
import {
  aggregateMicronutrientsForDate,
  overallNutrientScore,
  letterGrade,
  strongestAndWeakest,
  radarValues,
} from '../utils/micronutrients';

import { getLocalDateString } from '../utils/dates';

function todayKey() {
  return getLocalDateString();
}

function NutrientRadar({ points, size = 260 }) {
  const { colors } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = points.length;
  const angleStep = (Math.PI * 2) / n;

  const polar = (i, r) => {
    const a = -Math.PI / 2 + i * angleStep;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoly = points.map((p, i) => {
    const r = (Math.min(100, p.pct) / 100) * maxR;
    return polar(i, r);
  });

  return (
    <Svg width={size} height={size}>
      {gridLevels.map((lvl) => {
        const ring = points.map((_, i) => polar(i, maxR * lvl));
        const pts = ring.map((pt) => `${pt.x},${pt.y}`).join(' ');
        return <Polygon key={lvl} points={pts} fill="none" stroke={colors.border} strokeWidth={1} />;
      })}
      {points.map((_, i) => {
        const end = polar(i, maxR);
        return <Line key={`axis-${i}`} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={colors.borderLight} strokeWidth={1} />;
      })}
      <Polygon
        points={dataPoly.map((pt) => `${pt.x},${pt.y}`).join(' ')}
        fill="rgba(170, 255, 0, 0.25)"
        stroke={colors.accent}
        strokeWidth={2}
      />
      {dataPoly.map((pt, i) => (
        <Circle key={points[i].key} cx={pt.x} cy={pt.y} r={4} fill={colors.accent} />
      ))}
      {points.map((p, i) => {
        const labelPt = polar(i, maxR + 18);
        return (
          <SvgText
            key={`lbl-${p.key}`}
            x={labelPt.x}
            y={labelPt.y}
            fill={colors.textMuted}
            fontSize="9"
            textAnchor="middle"
          >
            {p.label.split(' ')[0]}
          </SvgText>
        );
      })}
    </Svg>
  );
}

export default function NutrientReportScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const route = useRoute();
  const { foodEntries } = useUser();
  const date = route.params?.date || todayKey();

  const totals = useMemo(() => aggregateMicronutrientsForDate(foodEntries, date), [foodEntries, date]);
  const score = useMemo(() => overallNutrientScore(totals), [totals]);
  const grade = letterGrade(score);
  const { strongest, focus } = useMemo(() => strongestAndWeakest(totals), [totals]);
  const radar = useMemo(() => radarValues(totals), [totals]);

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={styles.content}>
        <BackHeader onBack={() => navigation.goBack()} title="Nutrient Report" />
        <Text style={styles.date}>{date}</Text>

        <View style={styles.gradeCard}>
          <Text style={styles.grade}>{grade}</Text>
          <View>
            <Text style={styles.gradeLbl}>Overall Score</Text>
            <Text style={styles.gradeSub}>{Math.round(score)}% of daily targets</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>8-Axis Balance</Text>
          <View style={styles.chartWrap}>
            <NutrientRadar points={radar} />
          </View>
        </View>

        <View style={styles.split}>
          <View style={[styles.listCard, styles.listGood]}>
            <Text style={styles.listTitle}>Strongest Today</Text>
            {strongest.map((item) => (
              <Text key={item.def.key} style={styles.listItem}>
                {item.def.label} · {Math.round(item.score)}%
              </Text>
            ))}
          </View>
          <View style={[styles.listCard, styles.listFocus]}>
            <Text style={styles.listTitle}>Focus On</Text>
            {focus.map((item) => (
              <Text key={item.def.key} style={styles.listItem}>
                {item.def.label} · {Math.round(item.score)}%
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  back: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  date: { color: colors.textMuted, textAlign: 'center', marginBottom: 16 },
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  grade: { fontSize: 56, fontWeight: '900', color: colors.accent, width: 72, textAlign: 'center' },
  gradeLbl: { fontSize: 16, fontWeight: '700', color: colors.text },
  gradeSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: { alignSelf: 'flex-start', fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  chartWrap: { alignItems: 'center' },
  split: { flexDirection: 'row', gap: 12 },
  listCard: { flex: 1, borderRadius: radius.md, padding: 14, borderWidth: 1 },
  listGood: { backgroundColor: 'rgba(34, 197, 94, 0.08)', borderColor: colors.border },
  listFocus: { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: colors.border },
  listTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 8 },
  listItem: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
});
