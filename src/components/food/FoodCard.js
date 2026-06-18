import { useMemo } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const SOURCE_STYLES = {
  usda: { label: 'USDA', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.18)' },
  brand: { label: 'Brand', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.18)' },
  nutritionix: { label: 'Brand', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.18)' },
  edamam: { label: 'Brand', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.18)' },
  local: { label: 'Brand', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.18)' },
  restaurant: { label: 'Restaurant', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.18)' },
  custom: { label: 'Custom', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.18)' },
  saved: { label: 'Saved', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.18)' },
  favorite: { label: 'Saved', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.18)' },
};

function sourceBadge(source) {
  const key = (source || 'brand').toLowerCase();
  return SOURCE_STYLES[key] || SOURCE_STYLES.brand;
}

function MacroPill({ label, value, color }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.macroPill, { borderColor: color }]}>
      <Text style={[styles.macroPillVal, { color }]}>{value}g</Text>
      <Text style={styles.macroPillLbl}>{label}</Text>
    </View>
  );
}

export default function FoodCard({ food, onPress, onLog, onFavorite, isFavorite }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (!food) return null;
  const badge = sourceBadge(food.source);
  const subtitle = food.brand?.trim() ? food.brand : 'Generic';

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(food)}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.name} numberOfLines={2}>{food.name}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          <Text style={styles.serving} numberOfLines={1}>{food.serving || '1 serving'}</Text>
        </View>
        <View style={[styles.sourceBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.sourceText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={styles.macroRow}>
        <Text style={styles.calories}>{Math.round(food.calories ?? 0)}</Text>
        <Text style={styles.calUnit}>cal</Text>
        <MacroPill label="P" value={Math.round(food.protein ?? 0)} color={colors.protein} />
        <MacroPill label="C" value={Math.round(food.carbs ?? 0)} color={colors.carbs} />
        <MacroPill label="F" value={Math.round(food.fat ?? 0)} color={colors.fat} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.logBtn} onPress={() => onLog?.(food)} activeOpacity={0.85}>
          <Feather name="plus" size={16} color={colors.onAccent} />
          <Text style={styles.logBtnText}>Log</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.heartBtn, isFavorite && styles.heartBtnOn]}
          onPress={() => onFavorite?.(food)}
          hitSlop={8}
          accessibilityLabel={isFavorite ? 'Remove favorite' : 'Add favorite'}
        >
          <Feather name="heart" size={18} color={isFavorite ? colors.danger : colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: { flexDirection: 'row', gap: 10 },
  titleCol: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  serving: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sourceBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  sourceText: { fontSize: 11, fontWeight: '700' },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  calories: { fontSize: 22, fontWeight: '700', color: colors.accent },
  calUnit: { fontSize: 12, color: colors.textMuted, marginRight: 4 },
  macroPill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 44,
  },
  macroPillVal: { fontSize: 12, fontWeight: '700' },
  macroPillLbl: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  logBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 10,
  },
  logBtnText: { fontSize: 14, fontWeight: '700', color: colors.onAccent },
  heartBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  heartBtnOn: { borderColor: colors.danger, backgroundColor: 'rgba(239, 68, 68, 0.12)' },
});
