import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function GroceryListView({ groups, checked, onToggle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (!groups?.length) {
    return <Text style={styles.empty}>Generate a meal plan to build your grocery list.</Text>;
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <View>
      <Text style={styles.progress}>{done} of {total} items checked</Text>
      {groups.map((group) => (
        <View key={group.aisle} style={styles.section}>
          <Text style={styles.aisle}>{group.aisle}</Text>
          {group.items.map((item) => {
            const key = `${group.aisle}::${item}`;
            const isChecked = !!checked[key];
            return (
              <TouchableOpacity
                key={key}
                style={styles.row}
                onPress={() => onToggle(key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isChecked }}
              >
                <View style={[styles.checkbox, isChecked && styles.checkboxOn]}>
                  {isChecked ? <Feather name="check" size={14} color={colors.onAccent} /> : null}
                </View>
                <Text style={[styles.item, isChecked && styles.itemChecked]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  empty: { color: colors.textMuted, textAlign: 'center', padding: 24 },
  progress: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  section: { marginBottom: 20 },
  aisle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderLight,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  item: { fontSize: 15, color: colors.text, flex: 1 },
  itemChecked: { color: colors.textMuted, textDecorationLine: 'line-through' },
});
