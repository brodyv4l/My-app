import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { useFoodSearch } from '../../hooks/useFoodSearch';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
import ScanPanel from '../../components/ScanPanel';
import FoodScanResultSheet from '../../components/scan/FoodScanResultSheet';
import { colors, radius, RESTAURANTS } from '../../constants/theme';

const TABS = ['Search', 'Scan', 'Restaurants', 'Favorites', 'Custom'];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function FoodLibraryScreen() {
  const { favorites, toggleFavorite, customFoods, addCustomFood, addFoodEntry } = useUser();
  const [activeTab, setActiveTab] = useState('Search');
  const [query, setQuery] = useState('');
  const [restaurantQuery, setRestaurantQuery] = useState('');
  const [scanResults, setScanResults] = useState([]);
  const [sheetFood, setSheetFood] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const { results, loading } = useFoodSearch(query);
  const { results: restaurantResults, loading: restaurantLoading } = useFoodSearch(restaurantQuery);
  const [customForm, setCustomForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '1 serving' });

  const saveCustom = () => {
    if (!customForm.name || !customForm.calories) {
      Alert.alert('Missing info', 'Name and calories are required');
      return;
    }
    addCustomFood({
      name: customForm.name,
      calories: Number(customForm.calories),
      protein: Number(customForm.protein) || 0,
      carbs: Number(customForm.carbs) || 0,
      fat: Number(customForm.fat) || 0,
      serving: customForm.serving,
    });
    setCustomForm({ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '1 serving' });
    Alert.alert('Saved', 'Custom food added');
  };

  const handleAiFoods = (foods) => {
    const mapped = foods.map((f, i) => ({
      id: `ai-scan-${Date.now()}-${i}`,
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      serving: f.serving || '1 serving',
      confidence: f.confidence,
      source: 'ai-scan',
    }));
    setScanResults(mapped);
  };

  const handleAiFoodReady = (food) => {
    setSheetFood(food);
    setSheetVisible(true);
  };

  const handleLogMeal = (entry) => {
    addFoodEntry(todayKey(), {
      id: Date.now(),
      foodId: sheetFood?.id || `ai-${Date.now()}`,
      name: entry.name,
      meal: entry.meal,
      servings: 1,
      calories: Math.round(entry.calories),
      protein: Math.round(entry.protein * 10) / 10,
      carbs: Math.round(entry.carbs * 10) / 10,
      fat: Math.round(entry.fat * 10) / 10,
      serving: entry.serving,
    });
    setSheetVisible(false);
    setSheetFood(null);
    Alert.alert('Logged', `${entry.name} added to ${entry.meal}`);
  };

  const renderFoodItem = (item, showFav = true) => (
    <View key={item.id} style={styles.foodItem}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.foodMeta}>{item.calories ? `${Math.round(item.calories)} cal · ${item.serving}` : item.serving}</Text>
      </View>
      {showFav && (
        <TouchableOpacity onPress={() => toggleFavorite(item)} hitSlop={8}>
          <Feather
            name="star"
            size={18}
            color={favorites.find((f) => f.id === item.id) ? colors.accent : colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Food Library</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTab === 'Search' && (
          <Card>
            <Input placeholder="Search foods..." value={query} onChangeText={setQuery} />
            {loading && <Text style={styles.status}>Searching...</Text>}
            {results.map((item) => renderFoodItem(item))}
          </Card>
        )}

        {activeTab === 'Scan' && (
          <Card>
            <ScanPanel
              onFoodDetected={handleAiFoods}
              onBarcodeFound={(foods) => setScanResults(foods)}
              onAiFoodReady={handleAiFoodReady}
            />
            {scanResults.length > 1 && (
              <View style={styles.scanResults}>
                <Text style={styles.scanResultsTitle}>All detected items</Text>
                {scanResults.map((item) => (
                  <TouchableOpacity key={item.id} onPress={() => { setSheetFood(item); setSheetVisible(true); }}>
                    {renderFoodItem(item)}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>
        )}

        {activeTab === 'Restaurants' && (
          <Card>
            <SectionTitle title="Restaurants" subtitle="Browse chain menu items" />
            <View style={styles.restGrid}>
              {RESTAURANTS.map((r) => (
                <TouchableOpacity key={r.id} style={styles.restCard} onPress={() => setRestaurantQuery(r.name)}>
                  <Text style={styles.restName}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {restaurantQuery ? (
              <>
                <Text style={styles.restSearchLabel}>{restaurantQuery}</Text>
                {restaurantLoading && <Text style={styles.status}>Searching...</Text>}
                {restaurantResults.map((item) => renderFoodItem(item))}
              </>
            ) : null}
          </Card>
        )}

        {activeTab === 'Favorites' && (
          <Card>
            <SectionTitle title="Favorites" subtitle={`${favorites.length} saved`} />
            {favorites.length === 0 ? <Text style={styles.empty}>Save foods from search using the star icon</Text> : favorites.map((item) => renderFoodItem(item, false))}
          </Card>
        )}

        {activeTab === 'Custom' && (
          <Card>
            <SectionTitle title="Custom Food" subtitle="Add your own items" />
            <Input label="Name" value={customForm.name} onChangeText={(v) => setCustomForm({ ...customForm, name: v })} />
            <Input label="Serving" value={customForm.serving} onChangeText={(v) => setCustomForm({ ...customForm, serving: v })} />
            <Input label="Calories" value={customForm.calories} onChangeText={(v) => setCustomForm({ ...customForm, calories: v })} keyboardType="numeric" />
            <Input label="Protein (g)" value={customForm.protein} onChangeText={(v) => setCustomForm({ ...customForm, protein: v })} keyboardType="numeric" />
            <Input label="Carbs (g)" value={customForm.carbs} onChangeText={(v) => setCustomForm({ ...customForm, carbs: v })} keyboardType="numeric" />
            <Input label="Fat (g)" value={customForm.fat} onChangeText={(v) => setCustomForm({ ...customForm, fat: v })} keyboardType="numeric" />
            <Button title="Save Food" onPress={saveCustom} />
            {customFoods.length > 0 && (
              <>
                <Text style={styles.savedTitle}>Your Foods</Text>
                {customFoods.map((item) => renderFoodItem(item, false))}
              </>
            )}
          </Card>
        )}
      </ScrollView>

      <FoodScanResultSheet
        visible={sheetVisible}
        food={sheetFood}
        onClose={() => { setSheetVisible(false); setSheetFood(null); }}
        onLog={handleLogMeal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginBottom: 16 },
  tabBar: { marginBottom: 16, maxHeight: 40 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface2, marginRight: 8 },
  tabActive: { backgroundColor: colors.accentMuted },
  tabText: { color: colors.textMuted, fontWeight: '500', fontSize: 13 },
  tabTextActive: { color: colors.accent },
  foodItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 15, fontWeight: '500', color: colors.text },
  foodMeta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  status: { color: colors.textMuted, fontSize: 13, paddingVertical: 8 },
  empty: { color: colors.textMuted, fontSize: 14, textAlign: 'center', padding: 24 },
  restGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  restCard: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.surface2, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  restName: { fontSize: 13, color: colors.text, fontWeight: '500' },
  restSearchLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 8 },
  savedTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 20, marginBottom: 8 },
  scanResults: { marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  scanResultsTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
});
