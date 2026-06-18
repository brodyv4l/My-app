import { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useUser } from '../../context/UserContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
import PeriodToggle from '../../components/progress/PeriodToggle';
import WeightTrendChart from '../../components/progress/WeightTrendChart';
import ProgressPhotosSection from '../../components/progress/ProgressPhotosSection';
import ConsistencyScore from '../../components/progress/ConsistencyScore';
import HabitHeatmap from '../../components/progress/HabitHeatmap';
import MacroBar from '../../components/MacroBar';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import ScreenLayout from '../../components/layout/ScreenLayout';
import PaywallOverlay from '../../components/paywall/PaywallOverlay';
import { aggregateNutrition } from '../../utils/progressStats';
import { buildWeightChartData, buildTargetTrajectory, alignTrajectoryToWeight } from '../../utils/weightTrajectory';

import { getLocalDateString } from '../../utils/dates';

function todayKey() {
  return getLocalDateString();
}

function sortWeightLogs(logs) {
  return [...logs].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });
}

const RANGE_OPTIONS = [
  { id: 7, label: '7D' },
  { id: 30, label: '30D' },
  { id: 90, label: '90D' },
  { id: 9999, label: 'All' },
];

export default function ProgressScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scrollRef = useRef(null);
  const logSectionY = useRef(0);
  const photosSectionY = useRef(0);
  const { weightLogs, addWeightLog, profile, foodEntries, goals, habitLogs, habits, progressPhotos, isPro } = useUser();
  const [heatmapPaywall, setHeatmapPaywall] = useState(false);
  const [weight, setWeight] = useState('');
  const [period, setPeriod] = useState('week');
  const [weightRange, setWeightRange] = useState(30);

  const nutrition = useMemo(() => aggregateNutrition(foodEntries, period), [foodEntries, period]);
  const sortedLogs = useMemo(() => sortWeightLogs(weightLogs), [weightLogs]);

  const sliceLogs = useMemo(() => {
    if (weightRange >= 9999) return sortedLogs;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weightRange);
    const cutoffKey = getLocalDateString(cutoff);
    return sortedLogs.filter((log) => log.date >= cutoffKey);
  }, [sortedLogs, weightRange]);

  const weightData = useMemo(() => buildWeightChartData(sliceLogs), [sliceLogs]);
  const targetData = useMemo(() => {
    const traj = buildTargetTrajectory(profile, sliceLogs, weightData.length || 7);
    return alignTrajectoryToWeight(weightData, traj);
  }, [profile, sliceLogs, weightData]);

  const latestWeight = sliceLogs.length ? sliceLogs[sliceLogs.length - 1].weight : null;
  const firstWeight = sliceLogs.length ? sliceLogs[0].weight : null;
  const changeValue = sliceLogs.length > 1 && latestWeight != null && firstWeight != null
    ? latestWeight - firstWeight
    : null;
  const changeDisplay = changeValue == null
    ? '—'
    : `${changeValue > 0 ? '+' : ''}${changeValue.toFixed(1)}`;

  const weeklyAverage = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffKey = getLocalDateString(cutoff);
    const weekLogs = sortedLogs.filter((log) => log.date >= cutoffKey);
    if (!weekLogs.length) return '—';
    const avg = weekLogs.reduce((sum, log) => sum + log.weight, 0) / weekLogs.length;
    return avg.toFixed(1);
  }, [sortedLogs]);

  const scrollToLogWeight = () => {
    scrollRef.current?.scrollTo({ y: Math.max(logSectionY.current - 16, 0), animated: true });
  };

  const handleLogWeight = async () => {
    if (!weight) return;
    await addWeightLog({
      date: todayKey(),
      weight: parseFloat(weight),
      photoUri: progressPhotos[todayKey()]?.uri || null,
    });
    setWeight('');
  };

  return (
    <ScreenLayout>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Progress</Text>
        <PeriodToggle value={period} onChange={setPeriod} />

        <Card>
          <SectionTitle title="Weight" subtitle="Track your trend toward your goal" />
          {sortedLogs.length === 0 ? (
            <View style={styles.weightEmpty}>
              <Text style={styles.empty}>Log your first weight to start tracking</Text>
              <Button title="+ Log Weight" onPress={scrollToLogWeight} />
            </View>
          ) : (
            <>
              <View style={styles.rangeRow}>
                {RANGE_OPTIONS.map((r) => (
                  <TouchableOpacity key={r.id} style={[styles.rangeChip, weightRange === r.id && styles.rangeOn]} onPress={() => setWeightRange(r.id)}>
                    <Text style={[styles.rangeText, weightRange === r.id && styles.rangeTextOn]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.statsRow}>
                <Stat label="Current" value={latestWeight ?? '—'} />
                <Stat label="Start" value={firstWeight ?? '—'} />
                <Stat label="Change" value={changeDisplay} />
                <Stat label="Weekly Avg" value={weeklyAverage} />
              </View>
              <WeightTrendChart
                key={`weight-chart-${weightRange}-${weightData.length}-${weightData[0]?.date || ''}-${weightData[weightData.length - 1]?.date || ''}`}
                weightData={weightData}
                targetData={targetData}
              />
            </>
          )}
        </Card>

        <View onLayout={(e) => { photosSectionY.current = e.nativeEvent.layout.y; }}>
          <ProgressPhotosSection
            weightLogs={sortedLogs}
            scrollRef={scrollRef}
            sectionYRef={photosSectionY}
          />
        </View>

        <Card>
          <SectionTitle title="Macro Averages" subtitle={`Daily avg · ${period === 'week' ? 'weekly' : 'monthly'}`} />
          <View style={styles.macros}>
            <MacroBar label="Protein" value={nutrition.averages.protein} goal={goals.protein} color={colors.protein} />
            <MacroBar label="Carbs" value={nutrition.averages.carbs} goal={goals.carbs} color={colors.carbs} />
            <MacroBar label="Fat" value={nutrition.averages.fat} goal={goals.fat} color={colors.fat} />
          </View>
        </Card>

        <Card>
          <SectionTitle title="Nutrition Consistency" />
          <ConsistencyScore foodEntries={foodEntries} goals={goals} days={period === 'week' ? 7 : 30} />
        </Card>

        <Card>
          <SectionTitle title="Habit Heatmap" subtitle="Last 30 days" />
          <TouchableOpacity activeOpacity={isPro ? 1 : 0.9} onPress={() => !isPro && setHeatmapPaywall(true)}><HabitHeatmap habitLogs={habitLogs} habits={habits} /></TouchableOpacity>
        </Card>

        <View onLayout={(e) => { logSectionY.current = e.nativeEvent.layout.y; }}>
          <Card>
            <SectionTitle title="Log Weight" subtitle={todayKey()} />
            <Input label="Weight (lbs)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
            <Button title="Save Weight" onPress={handleLogWeight} />
          </Card>
        </View>
              <PaywallOverlay visible={heatmapPaywall} featureName="Habit Heatmap" benefit="See your 30-day consistency at a glance" onDismiss={() => setHeatmapPaywall(false)} />
      </ScrollView>
    </ScreenLayout>
  );
}

function Stat({ label, value }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  weightEmpty: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rangeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: colors.border },
  rangeOn: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  rangeText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  rangeTextOn: { color: colors.accent },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  stat: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 16, fontWeight: '800', color: colors.accent },
  statLbl: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  macros: { gap: 12 },
  empty: { color: colors.textMuted, textAlign: 'center', padding: 16 },
});
