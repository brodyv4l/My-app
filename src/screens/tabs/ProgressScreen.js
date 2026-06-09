import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { useUser } from '../../context/UserContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
import CalorieRing from '../../components/CalorieRing';
import MacroBar from '../../components/MacroBar';
import PeriodToggle from '../../components/progress/PeriodToggle';
import WeightTrendChart from '../../components/progress/WeightTrendChart';
import { colors, spacing } from '../../constants/theme';
import { aggregateNutrition, getTodayTotals, filterWeightLogsForPeriod } from '../../utils/progressStats';
import { buildWeightChartData, buildTargetTrajectory, alignTrajectoryToWeight } from '../../utils/weightTrajectory';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function ProgressScreen() {
  const { weightLogs, addWeightLog, profile, foodEntries, goals } = useUser();
  const [weight, setWeight] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [period, setPeriod] = useState('week');

  const todayTotals = useMemo(() => getTodayTotals(foodEntries), [foodEntries]);
  const nutrition = useMemo(() => aggregateNutrition(foodEntries, period), [foodEntries, period]);

  const periodWeightLogs = useMemo(
    () => (period === 'week' ? weightLogs.slice(-14) : filterWeightLogsForPeriod(weightLogs, period)),
    [weightLogs, period],
  );

  const weightData = useMemo(() => buildWeightChartData(periodWeightLogs, period === 'week' ? 7 : 30), [periodWeightLogs, period]);
  const targetData = useMemo(() => {
    const traj = buildTargetTrajectory(profile, weightLogs, weightData.length || 7);
    return alignTrajectoryToWeight(weightData, traj);
  }, [profile, weightLogs, weightData]);

  const latestWeight = weightLogs.length ? weightLogs[weightLogs.length - 1].weight : profile.weight;
  const firstWeight = weightLogs.length ? weightLogs[0].weight : profile.weight;
  const change = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : '0';

  const macroSource = period === 'week' ? nutrition.averages : nutrition.averages;

  const handleLogWeight = async () => {
    if (!weight) return;
    const log = weightLogs.find((l) => l.date === selectedDate);
    await addWeightLog({ date: selectedDate, weight: parseFloat(weight), photoUri: log?.photoUri || null });
    setWeight('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Progress</Text>
      <PeriodToggle value={period} onChange={setPeriod} />

      <Card style={styles.ringCard}>
        <SectionTitle title="Calories" subtitle={period === 'week' ? 'Today' : 'Daily average this month'} />
        <CalorieRing
          consumed={period === 'week' ? todayTotals.calories : macroSource.calories}
          goal={goals.calories}
        />
        <Text style={styles.ringHint}>
          {period === 'week'
            ? `${todayTotals.calories} consumed · ${Math.max(goals.calories - todayTotals.calories, 0)} remaining today`
            : `~${macroSource.calories} avg/day · target ${goals.calories}`}
        </Text>
      </Card>

      <Card>
        <SectionTitle title="Macro Breakdown" subtitle={`${period === 'week' ? 'Weekly' : 'Monthly'} daily average`} />
        <View style={styles.macros}>
          <MacroBar label="Protein" value={macroSource.protein} goal={goals.protein} color={colors.protein} />
          <MacroBar label="Carbs" value={macroSource.carbs} goal={goals.carbs} color={colors.carbs} />
          <MacroBar label="Fat" value={macroSource.fat} goal={goals.fat} color={colors.fat} />
        </View>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statVal}>{latestWeight || '—'}</Text>
          <Text style={styles.statLbl}>Current (lbs)</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statVal, { color: Number(change) <= 0 ? colors.accent : colors.warning }]}>{Number(change) > 0 ? '+' : ''}{change}</Text>
          <Text style={styles.statLbl}>Change (lbs)</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statVal}>{profile.targetWeight || '—'}</Text>
          <Text style={styles.statLbl}>Target (lbs)</Text>
        </Card>
      </View>

      <Card>
        <SectionTitle title="Weight Trend" subtitle={period === 'week' ? 'Last 7 entries' : 'This month'} />
        <WeightTrendChart
          weightData={weightData}
          targetData={targetData}
          subtitle={profile.targetDate ? `Goal: ${profile.targetWeight} lbs by ${profile.targetDate}` : undefined}
        />
      </Card>

      <Card>
        <SectionTitle title="Log Weight" subtitle={selectedDate} />
        <Input label="Weight (lbs)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        <Button title="Save Weight" onPress={handleLogWeight} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.sm, letterSpacing: -0.5 },
  ringCard: { alignItems: 'center' },
  ringHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  macros: { gap: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 0 },
  statCard: { flex: 1, marginBottom: 0, alignItems: 'center', padding: 12 },
  statVal: { fontSize: 20, fontWeight: '800', color: colors.accent },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
