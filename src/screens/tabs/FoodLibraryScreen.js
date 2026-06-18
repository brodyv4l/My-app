import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { useFoodSearch } from '../../hooks/useFoodSearch';
import { useRecentFoods } from '../../hooks/useRecentFoods';
import FoodCard from '../../components/food/FoodCard';
import SkeletonFoodCard from '../../components/food/SkeletonFoodCard';
import MealSelectorModal from '../../components/food/MealSelectorModal';
import FoodDetailPanel from '../../components/food/FoodDetailPanel';
import { getRestaurantsWithCounts, searchRestaurantItems } from '../../data/restaurants';
import { FOOD_DATABASE } from '../../data/foods';
import { radius, defaultMealByTime } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const TABS = ['Search', 'Restaurants', 'Favorites', 'Recent', 'Custom'];
const FAV_SORTS = ['Recent', 'A-Z', 'Calories'];

import { getLocalDateString } from '../../utils/dates';

function todayKey() {
  return getLocalDateString();
}

function customStorageKey(uid) {
  return `foodprint-${uid}-customFoods`;
}

function restaurantToFood(item) {
  return {
    id: item.id,
    name: item.name,
    brand: item.restaurant,
    serving: item.serving,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fiber: item.fiber,
    sugar: item.sugar,
    sodium: item.sodium,
    source: 'restaurant',
  };
}

function buildEntry(food, meal) {
  const m = food.servingMultiplier || 1;
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    foodId: food.id,
    name: food.name,
    meal,
    servings: m,
    calories: Math.round(food.calories ?? 0),
    protein: Math.round((food.protein ?? 0) * 10) / 10,
    carbs: Math.round((food.carbs ?? 0) * 10) / 10,
    fat: Math.round((food.fat ?? 0) * 10) / 10,
    serving: food.serving || '1 serving',
  };
}

export default function FoodLibraryScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const uid = user?.uid;
  const {
    favorites,
    toggleFavorite,
    customFoods,
    addFoodEntry,
  } = useUser();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const contentMaxWidth = width >= 1024 ? 480 : width >= 768 ? 600 : null;
  const { getRecent, addRecent, clearRecent, key: recentKey } = useRecentFoods();

  const [activeTab, setActiveTab] = useState('Search');
  const [query, setQuery] = useState('');

  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [restaurantQuery, setRestaurantQuery] = useState('');

  const [favSort, setFavSort] = useState('Recent');
  const [recentFoods, setRecentFoods] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const [localCustom, setLocalCustom] = useState(null);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState(null);
  const [customForm, setCustomForm] = useState({
    name: '',
    calories: '',
    serving: '1 serving',
    protein: '',
    carbs: '',
    fat: '',
    brand: '',
    fiber: '',
    sugar: '',
    sodium: '',
  });

  const [detailFood, setDetailFood] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [pendingLogFood, setPendingLogFood] = useState(null);
  const [pendingBatch, setPendingBatch] = useState(null);

  const { results, loading, error, loadMore, hasMore } = useFoodSearch(query);

  const restaurants = useMemo(() => getRestaurantsWithCounts(), []);

  const customList = localCustom ?? customFoods;

  const restaurantItems = useMemo(() => {
    const q = restaurantQuery.trim();
    const raw = q
      ? searchRestaurantItems(q, selectedRestaurantId || undefined)
      : selectedRestaurantId
        ? searchRestaurantItems('', selectedRestaurantId)
        : [];
    return raw.map(restaurantToFood);
  }, [restaurantQuery, selectedRestaurantId]);

  const sortedFavorites = useMemo(() => {
    const list = [...favorites];
    if (favSort === 'A-Z') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (favSort === 'Calories') list.sort((a, b) => (b.calories || 0) - (a.calories || 0));
    return list;
  }, [favorites, favSort]);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const items = await getRecent();
      setRecentFoods(items);
    } finally {
      setRecentLoading(false);
    }
  }, [getRecent]);

  useEffect(() => {
    if (activeTab === 'Recent' || activeTab === 'Search') loadRecent();
  }, [activeTab, recentKey, loadRecent]);

  const commonFoods = useMemo(
    () => FOOD_DATABASE.map((f) => ({ ...f, source: f.source || 'local' })),
    [],
  );

  const persistCustomList = useCallback(async (next) => {
    setLocalCustom(next);
    if (uid) await AsyncStorage.setItem(customStorageKey(uid), JSON.stringify(next));
  }, [uid]);

  const isFavorite = useCallback((food) => favorites.some((f) => f.id === food?.id), [favorites]);

  const openMealPicker = (food, batch = null) => {
    setPendingLogFood(food);
    setPendingBatch(batch);
    setMealModalVisible(true);
  };

  const commitLog = async (meal, food, batch) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const date = todayKey();
    if (batch?.length) {
      batch.forEach((item) => {
        addFoodEntry(date, buildEntry(item, meal));
        addRecent(item);
      });
      showToast(`Added ${batch.length} items to ${meal}! ✓`, 'success');
    } else if (food) {
      addFoodEntry(date, buildEntry(food, meal));
      addRecent(food);
      showToast(`Added to ${meal}! ✓`, 'success');
    }
    setMealModalVisible(false);
    setPendingLogFood(null);
    setPendingBatch(null);
  };

  const handleMealSelect = (meal) => {
    if (pendingBatch?.length) commitLog(meal, null, pendingBatch);
    else if (pendingLogFood) commitLog(meal, pendingLogFood, null);
  };

  const handleLogPress = (food) => openMealPicker(food);

  const resetCustomForm = () => {
    setCustomForm({
      name: '',
      calories: '',
      serving: '1 serving',
      protein: '',
      carbs: '',
      fat: '',
      brand: '',
      fiber: '',
      sugar: '',
      sodium: '',
    });
    setEditingCustomId(null);
  };

  const openCustomModal = (food = null) => {
    if (food) {
      setEditingCustomId(food.id);
      setCustomForm({
        name: food.name || '',
        calories: String(food.calories ?? ''),
        serving: food.serving || '1 serving',
        protein: food.protein != null ? String(food.protein) : '',
        carbs: food.carbs != null ? String(food.carbs) : '',
        fat: food.fat != null ? String(food.fat) : '',
        brand: food.brand || '',
        fiber: food.fiber != null ? String(food.fiber) : '',
        sugar: food.sugar != null ? String(food.sugar) : '',
        sodium: food.sodium != null ? String(food.sodium) : '',
      });
    } else {
      resetCustomForm();
    }
    setCustomModalVisible(true);
  };

  const saveCustomFood = async () => {
    if (!customForm.name.trim()) {
      Alert.alert('Required field', 'Food name is required.');
      return;
    }
    if (!customForm.calories.trim()) {
      Alert.alert('Required field', 'Calories are required.');
      return;
    }
    if (!customForm.serving.trim()) {
      Alert.alert('Required field', 'Serving size is required.');
      return;
    }
    const payload = {
      name: customForm.name.trim(),
      calories: Number(customForm.calories) || 0,
      serving: customForm.serving.trim(),
      protein: customForm.protein ? Number(customForm.protein) : 0,
      carbs: customForm.carbs ? Number(customForm.carbs) : 0,
      fat: customForm.fat ? Number(customForm.fat) : 0,
      brand: customForm.brand.trim() || undefined,
      fiber: customForm.fiber ? Number(customForm.fiber) : undefined,
      sugar: customForm.sugar ? Number(customForm.sugar) : undefined,
      sodium: customForm.sodium ? Number(customForm.sodium) : undefined,
      source: 'custom',
    };
    let next;
    if (editingCustomId) {
      next = customList.map((f) => (f.id === editingCustomId ? { ...f, ...payload } : f));
    } else {
      next = [...customList, { ...payload, id: `custom-${Date.now()}` }];
    }
    await persistCustomList(next);
    setCustomModalVisible(false);
    resetCustomForm();
    showToast(editingCustomId ? 'Custom food updated ✓' : 'Custom food saved ✓', 'success');
  };

  const deleteCustomFood = (id) => {
    Alert.alert('Delete food', 'Remove this custom food?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => persistCustomList(customList.filter((f) => f.id !== id)),
      },
    ]);
  };

  const renderTabBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFoodCard = (item) => (
    <FoodCard
      key={String(item.id)}
      food={item}
      onPress={() => { setDetailFood(item); setDetailVisible(true); }}
      onLog={() => handleLogPress(item)}
      onFavorite={() => toggleFavorite(item)}
      isFavorite={isFavorite(item)}
    />
  );

  const renderSearchTab = () => {
    const hasQuery = query.trim().length > 0;

    return (
      <View style={styles.tabBody}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods, brands, restaurants..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {hasQuery ? (
          <>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {loading && results.length === 0 ? (
              <View>
                <SkeletonFoodCard />
                <SkeletonFoodCard />
                <SkeletonFoodCard />
              </View>
            ) : null}
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => renderFoodCard(item)}
              ListFooterComponent={
                hasMore ? (
                  <Button title={loading ? 'Loading...' : 'Load More'} onPress={loadMore} variant="outline" style={styles.loadMore} />
                ) : null
              }
              scrollEnabled={false}
            />
          </>
        ) : (
          <>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              {recentFoods.length > 0 ? (
                <TouchableOpacity
                  onPress={() => Alert.alert('Clear history', 'Remove all recent foods?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: async () => { await clearRecent(); setRecentFoods([]); } },
                  ])}
                >
                  <Text style={styles.clearLink}>Clear History</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {recentLoading ? (
              <View>
                <SkeletonFoodCard />
                <SkeletonFoodCard />
              </View>
            ) : recentFoods.length === 0 ? (
              <Text style={styles.emptyHint}>Foods you log will appear here for quick re-logging.</Text>
            ) : (
              recentFoods.map((item) => renderFoodCard(item))
            )}

            <Text style={[styles.sectionTitle, styles.allSectionTitle]}>All</Text>
            {commonFoods.map((item) => renderFoodCard(item))}
          </>
        )}
      </View>
    );
  };

  const renderRestaurantsTab = () => (
    <View style={styles.tabBody}>
      <FlatList
        data={restaurantItems}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.restGridRow}
        ListHeaderComponent={(
          <View>
            <Text style={styles.sectionTitle}>Restaurant menus</Text>
            <View style={styles.restGrid}>
              {restaurants.map((r) => {
                const selected = selectedRestaurantId === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.restCard, selected && styles.restCardOn, r.color ? { borderColor: r.color } : null]}
                    onPress={() => {
                      setSelectedRestaurantId(selected ? null : r.id);
                      setRestaurantQuery('');
                    }}
                  >
                    <Text style={styles.restName} numberOfLines={2}>{r.name}</Text>
                    <Text style={styles.restCount}>{r.itemCount} items</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={selectedRestaurantId ? 'Search this menu...' : 'Search all restaurants...'}
                placeholderTextColor={colors.textMuted}
                value={restaurantQuery}
                onChangeText={setRestaurantQuery}
              />
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.restFoodCol}>
            <FoodCard
              food={item}
              onPress={() => { setDetailFood(item); setDetailVisible(true); }}
              onLog={() => handleLogPress(item)}
              onFavorite={() => toggleFavorite(item)}
              isFavorite={isFavorite(item)}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Select a restaurant or search menu items.</Text>}
        scrollEnabled={false}
      />
    </View>
  );

  const renderFavoritesTab = () => (
    <View style={styles.tabBody}>
      <View style={styles.sortRow}>
        {FAV_SORTS.map((s) => (
          <TouchableOpacity key={s} style={[styles.sortChip, favSort === s && styles.sortChipOn]} onPress={() => setFavSort(s)}>
            <Text style={[styles.sortText, favSort === s && styles.sortTextOn]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {sortedFavorites.length === 0 ? (
        <Text style={styles.empty}>No favorites yet. Tap the heart on any food to save it here.</Text>
      ) : (
        <FlatList
          data={sortedFavorites}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.favRow}>
              <View style={styles.favCardWrap}>
                <FoodCard
                  food={item}
                  onPress={() => { setDetailFood(item); setDetailVisible(true); }}
                  onLog={() => handleLogPress(item)}
                  onFavorite={() => toggleFavorite(item)}
                  isFavorite
                />
              </View>
              <TouchableOpacity style={styles.removeFav} onPress={() => toggleFavorite(item)} accessibilityLabel="Remove favorite">
                <Feather name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderRecentTab = () => (
    <View style={styles.tabBody}>
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recently logged</Text>
        {recentFoods.length > 0 ? (
          <TouchableOpacity
            onPress={() => Alert.alert('Clear history', 'Remove all recent foods?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: async () => { await clearRecent(); setRecentFoods([]); } },
            ])}
          >
            <Text style={styles.clearLink}>Clear History</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {recentLoading ? (
        <View>
          <SkeletonFoodCard />
          <SkeletonFoodCard />
        </View>
      ) : recentFoods.length === 0 ? (
        <Text style={styles.empty}>Foods you log will appear here for quick re-logging.</Text>
      ) : (
        <FlatList
          data={recentFoods}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <FoodCard
              food={item}
              onPress={() => { setDetailFood(item); setDetailVisible(true); }}
              onLog={() => handleLogPress(item)}
              onFavorite={() => toggleFavorite(item)}
              isFavorite={isFavorite(item)}
            />
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderCustomTab = () => (
    <View style={styles.tabBody}>
      <Button title="Add Custom Food" onPress={() => openCustomModal()} style={styles.addCustomBtn} />
      {customList.length === 0 ? (
        <Text style={styles.empty}>Create your own foods with custom macros and servings.</Text>
      ) : (
        <FlatList
          data={customList}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.customRow}>
              <View style={styles.favCardWrap}>
                <FoodCard
                  food={item}
                  onPress={() => openCustomModal(item)}
                  onLog={() => handleLogPress(item)}
                  onFavorite={() => toggleFavorite(item)}
                  isFavorite={isFavorite(item)}
                />
              </View>
              <View style={styles.customActions}>
                <TouchableOpacity onPress={() => openCustomModal(item)} style={styles.iconBtn}>
                  <Feather name="edit-2" size={18} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteCustomFood(item.id)} style={styles.iconBtn}>
                  <Feather name="trash-2" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : null]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backRow} onPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate('Main', { screen: 'Log' });
        }}>
          <Feather name="arrow-left" size={18} color={colors.accent} />
          <Text style={styles.backText}>Back to Log</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Food Library</Text>
        {renderTabBar()}
        {activeTab === 'Search' && renderSearchTab()}
        {activeTab === 'Restaurants' && renderRestaurantsTab()}
        {activeTab === 'Favorites' && renderFavoritesTab()}
        {activeTab === 'Recent' && renderRecentTab()}
        {activeTab === 'Custom' && renderCustomTab()}
      </ScrollView>

      <FoodDetailPanel
        visible={detailVisible}
        food={detailFood}
        onClose={() => { setDetailVisible(false); setDetailFood(null); }}
        onLog={(scaled) => openMealPicker(scaled)}
        onFavorite={() => detailFood && toggleFavorite(detailFood)}
        isFavorite={detailFood ? isFavorite(detailFood) : false}
      />

      <MealSelectorModal
        visible={mealModalVisible}
        food={pendingLogFood}
        onSelect={handleMealSelect}
        onClose={() => { setMealModalVisible(false); setPendingLogFood(null); setPendingBatch(null); }}
      />

      <Modal visible={customModalVisible} transparent animationType="slide" onRequestClose={() => setCustomModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalSheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{editingCustomId ? 'Edit Custom Food' : 'New Custom Food'}</Text>
            <Input label="Name *" value={customForm.name} onChangeText={(v) => setCustomForm((f) => ({ ...f, name: v }))} />
            <Input label="Serving *" value={customForm.serving} onChangeText={(v) => setCustomForm((f) => ({ ...f, serving: v }))} />
            <Input label="Calories *" value={customForm.calories} onChangeText={(v) => setCustomForm((f) => ({ ...f, calories: v }))} keyboardType="numeric" />
            <Input label="Protein (g)" value={customForm.protein} onChangeText={(v) => setCustomForm((f) => ({ ...f, protein: v }))} keyboardType="numeric" />
            <Input label="Carbs (g)" value={customForm.carbs} onChangeText={(v) => setCustomForm((f) => ({ ...f, carbs: v }))} keyboardType="numeric" />
            <Input label="Fat (g)" value={customForm.fat} onChangeText={(v) => setCustomForm((f) => ({ ...f, fat: v }))} keyboardType="numeric" />
            <Input label="Brand (optional)" value={customForm.brand} onChangeText={(v) => setCustomForm((f) => ({ ...f, brand: v }))} />
            <Input label="Fiber (g, optional)" value={customForm.fiber} onChangeText={(v) => setCustomForm((f) => ({ ...f, fiber: v }))} keyboardType="numeric" />
            <Input label="Sugar (g, optional)" value={customForm.sugar} onChangeText={(v) => setCustomForm((f) => ({ ...f, sugar: v }))} keyboardType="numeric" />
            <Input label="Sodium (mg, optional)" value={customForm.sodium} onChangeText={(v) => setCustomForm((f) => ({ ...f, sodium: v }))} keyboardType="numeric" />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => { setCustomModalVisible(false); resetCustomForm(); }} style={styles.modalBtn} />
              <Button title="Save" onPress={saveCustomFood} style={styles.modalBtn} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  backText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginBottom: 12 },
  tabBar: { marginBottom: 16, maxHeight: 44 },
  tabBarContent: { gap: 8, paddingRight: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.surface2 },
  tabActive: { backgroundColor: colors.accentMuted },
  tabText: { color: colors.textMuted, fontWeight: '500', fontSize: 13 },
  tabTextActive: { color: colors.accent },
  tabBody: { minHeight: 200 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, padding: 0 },
  errorText: { color: colors.danger, marginBottom: 8, fontSize: 13 },
  loadMore: { marginTop: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  allSectionTitle: { marginTop: 20 },
  emptyHint: { color: colors.textMuted, fontSize: 13, marginBottom: 16, lineHeight: 18 },
  restGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  restGridRow: { gap: 8 },
  restFoodCol: { flex: 1 },
  restCard: {
    width: '48%',
    minWidth: '46%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restCardOn: { backgroundColor: colors.accentMuted },
  restName: { fontSize: 13, fontWeight: '600', color: colors.text },
  restCount: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  sortRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sortChipOn: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  sortText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  sortTextOn: { color: colors.accent },
  favRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  favCardWrap: { flex: 1 },
  removeFav: { padding: 8, marginTop: 8 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  clearLink: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  empty: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 28, lineHeight: 20 },
  addCustomBtn: { marginBottom: 16 },
  customRow: { flexDirection: 'row', alignItems: 'flex-start' },
  customActions: { paddingTop: 12, gap: 4 },
  iconBtn: { padding: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: { flex: 1 },
});
