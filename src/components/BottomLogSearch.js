import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard,
  ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MEAL_TYPES, defaultMealByTime, radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { enrichFood } from '../services/food/searchFoods';
import { isApiConfigured } from '../config/foodApi';

export default function BottomLogSearch({ onAdd }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [meal, setMeal] = useState(defaultMealByTime());
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { results, loading, error } = useFoodSearch(expanded ? query : '');

  const handleSelect = async (food) => {
    setLoadingDetail(true);
    try {
      const detailed = food.needsDetail ? await enrichFood(food) : food;
      setSelected(detailed);
      setQuery(detailed.name);
      Keyboard.dismiss();
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAdd = () => {
    if (!selected) return;
    onAdd({
      id: Date.now(),
      foodId: selected.id,
      name: selected.name,
      meal,
      servings: 1,
      calories: Math.round(selected.calories),
      protein: Math.round(selected.protein * 10) / 10,
      carbs: Math.round(selected.carbs * 10) / 10,
      fat: Math.round(selected.fat * 10) / 10,
      serving: selected.serving,
    });
    setQuery('');
    setSelected(null);
    setExpanded(false);
    Keyboard.dismiss();
  };

  const showResults = expanded && query.trim().length >= 2;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {showResults && (
        <View style={styles.results}>
          <View style={styles.mealRow}>
            {MEAL_TYPES.map((m) => (
              <TouchableOpacity key={m} style={[styles.mealChip, meal === m && styles.mealChipActive]} onPress={() => setMeal(m)}>
                <Text style={[styles.mealChipText, meal === m && styles.mealChipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {(loading || loadingDetail) && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.statusText}>{loadingDetail ? 'Loading...' : 'Searching...'}</Text>
            </View>
          )}
          {error && !loading && <Text style={styles.errorText}>{error}</Text>}
          {!loading && !error && results.length === 0 && <Text style={styles.emptyText}>No results</Text>}
          {results.slice(0, 5).map((item) => (
            <TouchableOpacity key={item.id} style={styles.resultItem} onPress={() => handleSelect(item)}>
              <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.resultCal}>{item.calories > 0 ? `${Math.round(item.calories)} cal` : '—'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.bar}>
        <TextInput
          style={styles.input}
          placeholder={isApiConfigured() ? 'Add food to log...' : 'Search foods...'}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={(text) => { setQuery(text); setSelected(null); setExpanded(true); }}
          onFocus={() => setExpanded(true)}
        />
        {selected ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        ) : expanded && query ? (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setExpanded(false); setQuery(''); Keyboard.dismiss(); }}>
            <Text style={styles.cancelText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: 10,
    paddingHorizontal: 16,
    ...Platform.select({ web: { position: 'sticky', bottom: 0, zIndex: 50 } }),
  },
  results: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    maxHeight: 260,
    overflow: 'hidden',
  },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  mealChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: colors.surface3 },
  mealChipActive: { backgroundColor: colors.accentMuted },
  mealChipText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  mealChipTextActive: { color: colors.accent },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  statusText: { color: colors.textMuted, fontSize: 13 },
  errorText: { color: colors.danger, fontSize: 13, padding: 12 },
  emptyText: { color: colors.textMuted, fontSize: 13, padding: 12 },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  resultName: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500', marginRight: 8 },
  resultCal: { fontSize: 12, color: colors.textMuted },
  bar: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  addBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  addBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 14 },
  cancelBtn: { padding: 12 },
  cancelText: { color: colors.textMuted, fontSize: 16 },
});



