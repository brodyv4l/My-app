import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, waterGoalOz } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const OZ_PER_DROP = 8;
const ADD_AMOUNTS = [4, 8, 12, 16];

export default function WaterTracker({ weightLbs, loggedOz, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const goalOz = waterGoalOz(weightLbs);
  const dropCount = Math.min(12, Math.ceil(goalOz / OZ_PER_DROP));
  const filledDrops = Math.min(dropCount, Math.floor(loggedOz / OZ_PER_DROP));
  const progress = goalOz > 0 ? Math.min(1, loggedOz / goalOz) : 0;

  const adjust = (delta) => {
    onChange(Math.max(0, Math.round((loggedOz + delta) * 10) / 10));
  };

  const toggleDrop = (index) => {
    const targetOz = (index + 1) * OZ_PER_DROP;
    if (loggedOz >= targetOz) {
      onChange(Math.max(0, targetOz - OZ_PER_DROP));
    } else {
      onChange(targetOz);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Water</Text>
        <Text style={styles.goal}>{loggedOz} oz / {goalOz} oz</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <View style={styles.drops}>
        {Array.from({ length: dropCount }).map((_, i) => (
          <TouchableOpacity key={i} onPress={() => toggleDrop(i)} style={styles.dropBtn}>
            <Feather
              name="droplet"
              size={22}
              color={i < filledDrops ? colors.info : colors.border}
              style={{ opacity: i < filledDrops ? 1 : 0.35 }}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.adjustLabel}>Add or remove</Text>
      <View style={styles.adjustRow}>
        {ADD_AMOUNTS.map((oz) => (
          <View key={oz} style={styles.adjustPair}>
            <TouchableOpacity
              style={[styles.adjustBtn, loggedOz < oz && styles.adjustBtnDisabled]}
              onPress={() => adjust(-oz)}
              disabled={loggedOz < oz}
              activeOpacity={0.8}
            >
              <Text style={[styles.adjustBtnText, loggedOz < oz && styles.adjustBtnTextDisabled]}>−{oz}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjust(oz)} activeOpacity={0.8}>
              <Text style={styles.adjustBtnText}>+{oz}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  goal: { fontSize: 14, color: colors.textMuted },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.info,
    borderRadius: 3,
  },
  drops: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  dropBtn: { padding: 6, minWidth: 36, alignItems: 'center' },
  adjustLabel: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  adjustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  adjustPair: {
    flexDirection: 'row',
    gap: 4,
  },
  adjustBtn: {
    minWidth: 44,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  adjustBtnDisabled: { opacity: 0.35 },
  adjustBtnText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  adjustBtnTextDisabled: { color: colors.textMuted },
});
