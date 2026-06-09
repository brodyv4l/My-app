import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, ActivityIndicator,
} from 'react-native';
import { colors } from '../constants/theme';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { enrichFood, getActiveProvider } from '../services/food/searchFoods';
import { isApiConfigured } from '../config/foodApi';

export default function FoodSearch({ onAdd, meal }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [servings, setServings] = useState('1');
  const [showResults, setShowResults] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { results, loading, error } = useFoodSearch(query);

  const handleSelect = async (food) => {
    setLoadingDetail(true);
    try {
      const detailed = food.needsDetail ? await enrichFood(food) : food;
      setSelected(detailed);
      setQuery(detailed.name);
      setShowResults(false);
      Keyboard.dismiss();
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAdd = () => {
    if (!selected) return;
    const qty = parseFloat(servings) || 1;
    onAdd({
      id: Date.now(),
      foodId: selected.id,
      name: selected.name,
      meal,
      servings: qty,
      calories: Math.round(selected.calories * qty),
      protein: Math.round(selected.protein * qty * 10) / 10,
      carbs: Math.round(selected.carbs * qty * 10) / 10,
      fat: Math.round(selected.fat * qty * 10) / 10,
      serving: selected.serving,
    });
    setQuery('');
    setSelected(null);
    setServings('1');
    setShowResults(false);
    Keyboard.dismiss();
  };

  const showDropdown = showResults && query.trim().length >= 2;
  const provider = getActiveProvider();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          style={styles.searchInput}
          placeholder={isApiConfigured() ? 'Search millions of foods...' : 'Search foods...'}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setSelected(null);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
        />
        <TextInput
          style={styles.servingsInput}
          keyboardType="decimal-pad"
          value={servings}
          onChangeText={setServings}
        />
        <TouchableOpacity
          style={[styles.addBtn, (!selected || loadingDetail) && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!selected || loadingDetail}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {showDropdown && (
        <View style={styles.results}>
          {(loading || loadingDetail) && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.statusText}>
                {loadingDetail ? 'Loading nutrition...' : 'Searching...'}
              </Text>
            </View>
          )}
          {error && !loading && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          {!loading && !error && results.length === 0 && (
            <Text style={styles.emptyText}>No foods found</Text>
          )}
          {results.map((item) => (
            <TouchableOpacity key={item.id} style={styles.resultItem} onPress={() => handleSelect(item)}>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                {item.brand ? <Text style={styles.resultBrand} numberOfLines={1}>{item.brand}</Text> : null}
              </View>
              <Text style={styles.resultCal}>
                {item.calories > 0 ? `${Math.round(item.calories)} cal` : 'Tap for info'}
              </Text>
            </TouchableOpacity>
          ))}
          {!loading && results.length > 0 && (
            <Text style={styles.providerTag}>via {provider}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  servingsInput: {
    width: 52,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: '#0a1a0f', fontWeight: '700', fontSize: 14 },
  results: {
    marginTop: 6,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    maxHeight: 280,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  statusText: { color: colors.textMuted, fontSize: 13 },
  errorText: { color: colors.danger, fontSize: 13, padding: 12 },
  emptyText: { color: colors.textMuted, fontSize: 13, padding: 12 },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, color: colors.text, fontWeight: '500' },
  resultBrand: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  resultCal: { fontSize: 12, color: colors.textMuted },
  providerTag: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
    opacity: 0.7,
  },
});
