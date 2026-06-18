import { useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, Pressable, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function MealSelectorModal({ visible, food, onSelect, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Log to meal</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        {food ? (
          <Text style={styles.foodName} numberOfLines={2}>{food.name}</Text>
        ) : null}
        <View style={styles.mealGrid}>
          {MEALS.map((meal) => (
            <TouchableOpacity
              key={meal}
              style={styles.mealBtn}
              onPress={() => {
                const mapped = meal === 'Snack' ? 'Snacks' : meal;
                onSelect?.(mapped);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.mealBtnText}>{meal}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  foodName: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  mealGrid: { gap: 10 },
  mealBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
});
