import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { getLocalDateString } from '../../utils/dates';

function formatDuration(ms) {
  const safeMs = Math.max(0, ms);
  const totalMin = Math.floor(safeMs / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return `${hours}h ${minutes}m`;
}

function completionMessage(hours, minutes) {
  const label = `${hours}h ${minutes}m`;
  const totalHours = hours + minutes / 60;
  if (totalHours < 12) return `Fast complete: ${label} 🕐`;
  if (totalHours < 16) return `Solid fast: ${label} 💪`;
  return `Extended fast: ${label} 🔥`;
}

export default function FastingTracker({
  activeStartTime,
  lastCompletedFast,
  onStart,
  onEnd,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeStartTime) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [activeStartTime]);

  const elapsed = activeStartTime
    ? Math.max(0, now - new Date(activeStartTime).getTime())
    : 0;

  const lastLabel = useMemo(() => {
    if (!lastCompletedFast?.durationHours) return null;
    const h = Math.floor(lastCompletedFast.durationHours);
    const m = Math.round((lastCompletedFast.durationHours - h) * 60);
    const today = getLocalDateString();
    const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
    if (lastCompletedFast.date === today) return `Today's fast: ${h}h ${m}m`;
    if (lastCompletedFast.date === yesterday) return `Last night's fast: ${h}h ${m}m`;
    return `Last fast: ${h}h ${m}m`;
  }, [lastCompletedFast]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🕐 Fasting Window</Text>
      {activeStartTime ? (
        <>
          <Text style={styles.elapsed}>Fasting for: {formatDuration(elapsed)}</Text>
          <TouchableOpacity style={styles.endBtn} onPress={onEnd} activeOpacity={0.85}>
            <Text style={styles.endBtnText}>End Fast</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {lastLabel ? <Text style={styles.last}>{lastLabel}</Text> : null}
          <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>Start Fast</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

export { completionMessage, formatDuration };

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  elapsed: { fontSize: 22, fontWeight: '800', color: colors.accent, marginBottom: 12 },
  last: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startBtnText: { color: colors.onAccent, fontWeight: '800', fontSize: 15 },
  endBtn: {
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  endBtnText: { color: colors.text, fontWeight: '700', fontSize: 14 },
});
