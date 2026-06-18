import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

function gradeForScore(score, colors) {
  if (score >= 90) return { grade: 'A', color: colors.success };
  if (score >= 75) return { grade: 'B', color: colors.accent };
  if (score >= 60) return { grade: 'C', color: colors.warning };
  return { grade: 'D', color: colors.danger };
}

export default function ConsistencyScore({ foodEntries, goals, days = 7 }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const dates = Object.keys(foodEntries).sort().slice(-days);
  if (!dates.length) {
    return <Text style={styles.empty}>Log food to see your consistency score.</Text>;
  }

  let calHits = 0, proteinHits = 0, mealHits = 0;
  dates.forEach((d) => {
    const entries = foodEntries[d] || [];
    const t = entries.reduce((a, e) => ({ calories: a.calories + e.calories, protein: a.protein + e.protein }), { calories: 0, protein: 0 });
    if (Math.abs(t.calories - goals.calories) <= goals.calories * 0.1) calHits++;
    if (t.protein >= goals.protein * 0.85) proteinHits++;
    const meals = new Set(entries.map((e) => e.meal));
    if (meals.size >= 3) mealHits++;
  });

  const score = Math.round((calHits / dates.length) * 40 + (proteinHits / dates.length) * 30 + (mealHits / dates.length) * 30);
  const { grade, color } = gradeForScore(score, colors);

  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={[styles.score, { color }]}>{score}%</Text>
        <Text style={[styles.grade, { color }]}>{grade}</Text>
      </View>
      <Text style={styles.caption}>Your consistency this {days === 7 ? 'week' : 'period'}: {score}% — {grade}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 12 },
  circle: { width: 120, height: 120, borderRadius: 60, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 28, fontWeight: '800' },
  grade: { fontSize: 18, fontWeight: '700' },
  caption: { marginTop: 12, color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  empty: { color: colors.textMuted, textAlign: 'center', padding: 16 },
});
