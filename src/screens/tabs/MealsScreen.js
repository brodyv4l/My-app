import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Share,
  ActivityIndicator,
} from 'react-native';
import { getLocalDateString } from '../../utils/dates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import {
  generateMealPlan,
  swapSingleMeal,
  extractMealNames,
} from '../../services/mealPlanGenerator';
import {
  generateGroceryList,
  GROCERY_CATEGORIES,
} from '../../services/groceryGenerator';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
import DayMealPlanner from '../../components/meals/DayMealPlanner';
import MealPoolSummary from '../../components/meals/MealPoolSummary';
import { radius, MEAL_PLANNER_FILTERS } from '../../constants/theme';
import ScreenLayout from '../../components/layout/ScreenLayout';
import PaywallOverlay from '../../components/paywall/PaywallOverlay';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const FILTER_CHIPS = MEAL_PLANNER_FILTERS.map((f) => (f === 'No Preference' ? 'All' : f));

const LOADING_MESSAGES = [
  '🤖 Crafting Monday - Thursday meals...',
  '🥗 Calculating macro balance...',
  '🍳 Building Friday - Sunday meals...',
  '✅ Finalizing your plan...',
];

const MEAL_CAL_PCT = { breakfast: 0.25, lunch: 0.3, dinner: 0.35, snack: 0.1 };

function storageKey(uid, key) {
  return `foodprint-${uid}-${key}`;
}

function isAnthropicConfigured() {
  return !!(process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY);
}

function prefsFromChips(chips) {
  return chips.filter((c) => c !== 'All');
}

function dayCalories(day) {
  if (day?.totalCalories != null) return day.totalCalories;
  const meals = day?.meals;
  if (!meals) return 0;
  return Object.values(meals).reduce((sum, m) => sum + (m?.calories || 0), 0);
}

function mealLogLabel(type) {
  const map = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };
  return map[type] || 'Lunch';
}

function PlanSkeleton({ skeletonStyles }) {
  return (
    <View style={skeletonStyles.skeletonWrap}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={skeletonStyles.skeletonCard}>
          <View style={skeletonStyles.skeletonLineShort} />
          <View style={skeletonStyles.skeletonLine} />
          <View style={skeletonStyles.skeletonLineMed} />
        </View>
      ))}
    </View>
  );
}

export default function MealsScreen() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { showToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {
    profile,
    goals,
    mealPlan,
    saveMealPlan,
    groceryChecked,
    toggleGroceryItem,
    isPro,
    addFoodEntry,
  } = useUser();

  const dietaryFromProfile = profile?.dietaryPreferences || [];

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [genError, setGenError] = useState(false);
  const [view, setView] = useState('day');
  const [dayIndex, setDayIndex] = useState(0);
  const [paywall, setPaywall] = useState(null);
  const [selectedChips, setSelectedChips] = useState(() => {
    const fromProfile = dietaryFromProfile.filter((p) => FILTER_CHIPS.includes(p));
    return fromProfile.length ? fromProfile : ['All'];
  });
  const [groceryData, setGroceryData] = useState(mealPlan?.groceryData || null);
  const [groceryLoading, setGroceryLoading] = useState(false);
  const [extraGrocery, setExtraGrocery] = useState({});
  const [addItemCategory, setAddItemCategory] = useState('produce');
  const [addItemText, setAddItemText] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [gotItExpanded, setGotItExpanded] = useState(false);

  const selectedPrefs = useMemo(() => prefsFromChips(selectedChips), [selectedChips]);

  const planProfile = useMemo(
    () => ({
      ...profile,
      calorieGoal: goals.calories,
      macroGoals: {
        protein: goals.protein,
        carbs: goals.carbs,
        fat: goals.fat,
      },
    }),
    [profile, goals],
  );

  const days = mealPlan?.days?.length ? mealPlan.days : [];

  const dayPlan = useMemo(() => {
    if (!days.length) return null;
    return days[dayIndex] || days[0];
  }, [days, dayIndex]);

  useEffect(() => {
    if (mealPlan?.groceryData) setGroceryData(mealPlan.groceryData);
  }, [mealPlan?.groceryData]);

  useEffect(() => {
    if (!loading) return undefined;
    let idx = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);
    const timer = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[idx]);
    }, 1500);
    return () => clearInterval(timer);
  }, [loading]);

  const loadPreviousMeals = useCallback(async () => {
    if (!uid) return [];
    try {
      const raw = await AsyncStorage.getItem(storageKey(uid, 'mealPlanHistory'));
      const history = raw ? JSON.parse(raw) : [];
      const recent = history.slice(-2);
      const names = [];
      recent.forEach((plan) => {
        extractMealNames(plan).forEach((n) => names.push(n));
      });
      return names.slice(0, 56);
    } catch {
      return [];
    }
  }, [uid]);

  const pushMealPlanHistory = useCallback(
    async (plan) => {
      if (!uid) return;
      try {
        const raw = await AsyncStorage.getItem(storageKey(uid, 'mealPlanHistory'));
        const history = raw ? JSON.parse(raw) : [];
        history.push({ days: plan.days, weekOf: plan.weekOf, generatedAt: plan.generatedAt });
        await AsyncStorage.setItem(storageKey(uid, 'mealPlanHistory'), JSON.stringify(history.slice(-10)));
      } catch (e) {
        console.warn('mealPlanHistory', e);
      }
    },
    [uid],
  );

  const runGenerate = useCallback(async () => {
    setGenError(false);
    setLoading(true);
    try {
      const previousMeals = await loadPreviousMeals();
      const plan = await generateMealPlan(planProfile, selectedPrefs, previousMeals);
      const saved = saveMealPlan({ ...plan, groceryData: null });
      setGroceryData(null);
      await pushMealPlanHistory(saved);
      showToast('Your weekly meal plan is ready!', 'success');
    } catch (e) {
      console.error('generateMealPlan', e);
      setGenError(true);
      showToast('Could not generate meal plan. Tap Generate to try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [planProfile, selectedPrefs, loadPreviousMeals, saveMealPlan, pushMealPlanHistory, showToast]);

  const handleGeneratePress = () => {
    if (!isPro) {
      setPaywall({
        featureName: 'AI Meal Planner',
        benefit: 'Get a personalized 7-day plan built from a 12-meal pool',
      });
      return;
    }
    runGenerate();
  };

  const toggleFilterChip = (chip) => {
    if (chip === 'All') {
      setSelectedChips(['All']);
      return;
    }
    setSelectedChips((prev) => {
      const withoutAll = prev.filter((c) => c !== 'All');
      if (withoutAll.includes(chip)) {
        const next = withoutAll.filter((c) => c !== chip);
        return next.length ? next : ['All'];
      }
      return [...withoutAll, chip];
    });
  };

  const handleLogMeal = (meal) => {
    const today = getLocalDateString();
    const mealLabel = mealLogLabel(meal.type);
    const ingredients = meal.ingredients?.length ? meal.ingredients : [meal.name];
    const n = ingredients.length;
    ingredients.forEach((ing, idx) => {
      addFoodEntry(today, {
        id: `mealplan-${Date.now()}-${idx}`,
        name: typeof ing === 'string' ? ing : meal.name,
        meal: mealLabel,
        servings: 1,
        calories: Math.round((meal.calories || 0) / n),
        protein: Math.round(((meal.protein || 0) / n) * 10) / 10,
        carbs: Math.round(((meal.carbs || 0) / n) * 10) / 10,
        fat: Math.round(((meal.fat || 0) / n) * 10) / 10,
        serving: meal.servingSize || '1 serving',
        source: 'meal-plan',
      });
    });
    showToast(`Logged ${meal.name} to today`, 'success');
  };

  const handleSwapMeal = async (meal) => {
    if (!isPro) {
      setPaywall({
        featureName: 'Swap Meals',
        benefit: 'Replace any meal with a fresh AI alternative that hits your macros',
      });
      return;
    }
    if (!mealPlan?.days?.length || !isAnthropicConfigured()) {
      showToast('Add EXPO_PUBLIC_ANTHROPIC_API_KEY to swap meals', 'error');
      return;
    }
    const mealType = meal.type || 'lunch';
    const pct = MEAL_CAL_PCT[mealType] || 0.25;
    const restrictions =
      selectedPrefs.length > 0
        ? selectedPrefs.join(', ')
        : (profile.dietaryPreferences || []).join(', ');
    try {
      const swapped = await swapSingleMeal({
        mealType,
        goal: profile.goalType || 'maintain',
        targetCals: Math.round(goals.calories * pct),
        targetProtein: Math.round(goals.protein * pct),
        restrictions,
        currentMealName: meal.name,
      });
      const nextDays = mealPlan.days.map((d, i) => {
        if (i !== dayIndex) return d;
        const meals = { ...d.meals, [mealType]: { ...swapped } };
        const totals = Object.values(meals).reduce(
          (acc, m) => ({
            calories: acc.calories + (m?.calories || 0),
            protein: acc.protein + (m?.protein || 0),
            carbs: acc.carbs + (m?.carbs || 0),
            fat: acc.fat + (m?.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );
        return {
          ...d,
          meals,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFat: totals.fat,
        };
      });
      saveMealPlan({ ...mealPlan, days: nextDays });
      showToast('Meal swapped!', 'success');
    } catch (e) {
      console.error('swapSingleMeal', e);
      showToast('Could not swap meal', 'error');
    }
  };

  const handleSaveTemplate = async (meal) => {
    if (!isPro) {
      setPaywall({
        featureName: 'Meal Templates',
        benefit: 'Save your favorite AI meals and reuse them anytime',
      });
      return;
    }
    if (!uid) return;
    try {
      const raw = await AsyncStorage.getItem(storageKey(uid, 'mealTemplates'));
      const templates = raw ? JSON.parse(raw) : [];
      templates.push({ ...meal, savedAt: new Date().toISOString() });
      await AsyncStorage.setItem(storageKey(uid, 'mealTemplates'), JSON.stringify(templates.slice(-50)));
      showToast('Meal saved to templates', 'success');
    } catch {
      showToast('Could not save template', 'error');
    }
  };

  const rebuildGrocery = useCallback(async () => {
    if (!mealPlan?.days?.length) return;
    setGroceryLoading(true);
    try {
      const grouped = await generateGroceryList(null, mealPlan);
      setGroceryData(grouped);
      saveMealPlan({ ...mealPlan, groceryData: grouped });
      showToast('Grocery list updated', 'success');
    } catch (e) {
      console.error('grocery', e);
      showToast('Could not build grocery list', 'error');
    } finally {
      setGroceryLoading(false);
    }
  }, [mealPlan, saveMealPlan, showToast]);

  useEffect(() => {
    if (view === 'grocery' && isPro && mealPlan?.days?.length && !groceryData && !groceryLoading) {
      rebuildGrocery();
    }
  }, [view, isPro, mealPlan, groceryData, groceryLoading, rebuildGrocery]);

  const openGroceryTab = () => {
    if (!isPro) {
      setPaywall({
        featureName: 'Grocery List Generator',
        benefit: 'Auto-build your shopping list from meal plans',
      });
      return;
    }
    setView('grocery');
  };

  const groceryLinesForShare = useMemo(() => {
    const lines = [];
    GROCERY_CATEGORIES.forEach((cat) => {
      const items = [...(groceryData?.[cat.key] || []), ...(extraGrocery[cat.key] || [])];
      if (!items.length) return;
      lines.push(cat.label);
      items.forEach((row) => {
        const label = typeof row === 'string' ? row : row.item;
        const qty = typeof row === 'string' ? '' : row.quantity;
        lines.push(qty ? `- ${label} (${qty})` : `- ${label}`);
      });
      lines.push('');
    });
    return lines.join('\n').trim();
  }, [groceryData, extraGrocery]);

  const shareGroceryList = async () => {
    if (!groceryLinesForShare) {
      showToast('Nothing to share yet', 'warning');
      return;
    }
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(groceryLinesForShare);
        showToast('List copied to clipboard', 'success');
      } else {
        await Share.share({ message: groceryLinesForShare });
      }
    } catch {
      showToast('Could not share list', 'error');
    }
  };

  const handleAddGroceryItem = () => {
    const text = addItemText.trim();
    if (!text) return;
    setExtraGrocery((prev) => ({
      ...prev,
      [addItemCategory]: [...(prev[addItemCategory] || []), { item: text, quantity: '1' }],
    }));
    setAddItemText('');
    setShowAddItem(false);
    showToast('Item added', 'success');
  };

  const groceryItemKey = (catKey, item) => `${catKey}::${typeof item === 'string' ? item : item.item}`;

  return (
    <ScreenLayout>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Meal Planner</Text>
        <Text style={styles.subtitle}>
          AI-crafted meals tuned to your {goals.calories} cal/day target (±50 cal)
        </Text>

        {!isAnthropicConfigured() && (
          <View style={styles.apiBanner}>
            <Text style={styles.apiBannerText}>
              Using built-in meal templates. Add EXPO_PUBLIC_ANTHROPIC_API_KEY for AI-customized plans.
            </Text>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {FILTER_CHIPS.map((chip) => {
            const active =
              chip === 'All' ? selectedChips.includes('All') : selectedChips.includes(chip);
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.filterChip, active && styles.filterChipOn]}
                onPress={() => toggleFilterChip(chip)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextOn]}>{chip}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Button
          title={
            loading
              ? 'Generating...'
              : !isPro
                ? 'Generate Weekly Plan (Pro)'
                : mealPlan
                  ? 'Regenerate Meal Plans'
                  : 'Generate Weekly Plan'
          }
          onPress={handleGeneratePress}
          loading={loading}
          disabled={loading}
          style={styles.genBtn}
        />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            <PlanSkeleton skeletonStyles={styles} />
          </View>
        ) : null}

        {mealPlan?.pool ? <MealPoolSummary pool={mealPlan.pool} /> : null}

        <View style={styles.toggle}>
          {[
            { id: 'day', label: 'Day View', onPress: () => setView('day') },
            { id: 'grocery', label: 'Grocery List', onPress: openGroceryTab },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.toggleBtn, view === tab.id && styles.toggleActive]}
              onPress={tab.onPress}
            >
              <Text style={[styles.toggleText, view === tab.id && styles.toggleTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {view === 'day' && (
          <Card>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
              {(days.length ? days : DAY_ORDER.map((day) => ({ day }))).map((d, i) => {
                const cal = dayCalories(d);
                const onTarget = days.length && Math.abs(cal - goals.calories) <= 50;
                return (
                  <TouchableOpacity
                    key={d.day || DAY_ORDER[i]}
                    style={[styles.dayChip, dayIndex === i && styles.dayChipOn]}
                    onPress={() => setDayIndex(i)}
                  >
                    <View style={styles.dayChipRow}>
                      <Text style={[styles.dayChipText, dayIndex === i && styles.dayChipTextOn]}>
                        {(d.day || DAY_ORDER[i]).slice(0, 3)}
                      </Text>
                      {onTarget ? <View style={styles.targetDot} /> : null}
                    </View>
                    {days.length ? (
                      <Text style={[styles.dayChipCal, dayIndex === i && styles.dayChipCalOn]}>{cal} cal</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <DayMealPlanner
              dayPlan={dayPlan}
              goals={goals}
              isPro={isPro}
              onLogMeal={handleLogMeal}
              onSwapMeal={handleSwapMeal}
              onSaveTemplate={handleSaveTemplate}
            />
          </Card>
        )}

        {view === 'grocery' && isPro && (
          <Card>
            <SectionTitle title="Grocery List" />
            <View style={styles.groceryHeader}>
              <TouchableOpacity onPress={rebuildGrocery} disabled={groceryLoading} style={styles.groceryHeaderBtn}>
                <Feather name="refresh-cw" size={15} color={colors.accent} />
                <Text style={styles.groceryHeaderBtnText}>Rebuild</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={shareGroceryList} style={styles.groceryHeaderBtn}>
                <Feather name="share" size={15} color={colors.accent} />
                <Text style={styles.groceryHeaderBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
            {groceryLoading ? (
              <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
            ) : groceryData ? (
              <>
                {GROCERY_CATEGORIES.map((cat) => {
                  const items = [...(groceryData[cat.key] || []), ...(extraGrocery[cat.key] || [])];
                  const unchecked = items.filter((item) => !groceryChecked[groceryItemKey(cat.key, item)]);
                  if (!unchecked.length) return null;
                  return (
                    <View key={cat.key}>
                      <Text style={styles.groceryCat}>{cat.label}</Text>
                      {unchecked.map((item, idx) => {
                        const label = typeof item === 'string' ? item : item.item;
                        const qty = typeof item === 'string' ? '' : item.quantity;
                        const key = groceryItemKey(cat.key, item);
                        return (
                          <TouchableOpacity key={idx} style={styles.groceryRow} onPress={() => toggleGroceryItem(key)}>
                            <View style={styles.checkbox} />
                            <Text style={styles.groceryItem}>
                              {label}{qty ? ` — ${qty}` : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
                {(() => {
                  const gotItems = [];
                  GROCERY_CATEGORIES.forEach((cat) => {
                    const items = [...(groceryData[cat.key] || []), ...(extraGrocery[cat.key] || [])];
                    items.forEach((item) => {
                      const key = groceryItemKey(cat.key, item);
                      if (groceryChecked[key]) gotItems.push({ key, item });
                    });
                  });
                  if (!gotItems.length) return null;
                  return (
                    <View>
                      <TouchableOpacity style={styles.gotHeader} onPress={() => setGotItExpanded((v) => !v)}>
                        <Feather name={gotItExpanded ? 'chevron-down' : 'chevron-right'} size={15} color={colors.textMuted} />
                        <Text style={styles.gotHeaderText}>✓ Got It ({gotItems.length})</Text>
                      </TouchableOpacity>
                      {gotItExpanded
                        ? gotItems.map(({ key, item }) => {
                          const label = typeof item === 'string' ? item : item.item;
                          const qty = typeof item === 'string' ? '' : item.quantity;
                          return (
                            <TouchableOpacity key={key} style={styles.groceryRow} onPress={() => toggleGroceryItem(key)}>
                              <View style={[styles.checkbox, styles.checkboxOn]}>
                                <Feather name="check" size={11} color={colors.onAccent} />
                              </View>
                              <Text style={[styles.groceryItem, styles.groceryItemDone]}>
                                {label}{qty ? ` — ${qty}` : ''}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                        : null}
                    </View>
                  );
                })()}
              </>
            ) : (
              <Text style={styles.emptyText}>Tap Rebuild to generate a grocery list from your meal plan.</Text>
            )}
            {showAddItem ? (
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  value={addItemText}
                  onChangeText={setAddItemText}
                  placeholder="Item name..."
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
                <TouchableOpacity style={styles.addItemConfirm} onPress={handleAddGroceryItem}>
                  <Text style={styles.addItemConfirmText}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addItemBtn} onPress={() => setShowAddItem(true)}>
                <Feather name="plus" size={15} color={colors.accent} />
                <Text style={styles.addItemBtnText}>Add Item</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        <PaywallOverlay
          visible={!!paywall}
          featureName={paywall?.featureName}
          benefit={paywall?.benefit}
          onDismiss={() => setPaywall(null)}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.accent, letterSpacing: -0.5, marginBottom: 4 },
  gotHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, paddingVertical: 4 },
  gotHeaderText: { color: colors.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 18 },
  apiBanner: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  apiBannerText: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  filterScroll: { marginBottom: 12, maxHeight: 44 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  filterChipOn: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  filterChipText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  filterChipTextOn: { color: colors.accent, fontWeight: '700' },
  genBtn: { marginBottom: 8 },
  loadingBox: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  loadingText: { color: colors.accent, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  skeletonWrap: { width: '100%', gap: 10, marginTop: 12 },
  skeletonCard: { backgroundColor: colors.surface2, borderRadius: radius.md, padding: 16, gap: 8 },
  skeletonLine: { height: 12, backgroundColor: colors.border, borderRadius: 6, width: '90%' },
  skeletonLineShort: { height: 14, backgroundColor: colors.surface3, borderRadius: 6, width: '50%' },
  skeletonLineMed: { height: 10, backgroundColor: colors.border, borderRadius: 6, width: '70%' },
  toggle: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: colors.surface2, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  toggleActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  toggleText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  toggleTextActive: { color: colors.accent },
  dayPicker: { marginBottom: 14 },
  dayChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.surface2, marginRight: 8, minWidth: 56, alignItems: 'center' },
  dayChipOn: { backgroundColor: colors.accent },
  dayChipRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dayChipText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  dayChipTextOn: { color: colors.onAccent },
  dayChipCal: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  dayChipCalOn: { color: colors.onAccent },
  targetDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  groceryHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  groceryHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groceryHeaderBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  groceryCat: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 14, marginBottom: 6, letterSpacing: 0.3 },
  groceryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  groceryItem: { fontSize: 14, color: colors.text, flex: 1 },
  groceryItemDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  addItemRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  addItemInput: { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.sm, padding: 10, color: colors.text, borderWidth: 1, borderColor: colors.border },
  addItemConfirm: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  addItemConfirmText: { color: colors.onAccent, fontWeight: '700' },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingVertical: 4 },
  addItemBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
});
