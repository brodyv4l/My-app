import { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { MEALS } from '../../data/foods';
import { radius } from '../../constants/theme';
import ScreenLayout from '../../components/layout/ScreenLayout';
import CalorieRing from '../../components/CalorieRing';
import MacroBar from '../../components/MacroBar';
import MealSection from '../../components/MealSection';
import AddFoodMenu from '../../components/log/AddFoodMenu';
import WaterTracker from '../../components/log/WaterTracker';
import StreakTree from '../../components/log/StreakTree';
import DailyHabits from '../../components/log/DailyHabits';
import ProgressPhotoCard from '../../components/log/ProgressPhotoCard';
import MicronutrientPanel from '../../components/log/MicronutrientPanel';
import LogEntryEditSheet from '../../components/log/LogEntryEditSheet';
import BarcodeScanner from '../../components/scan/BarcodeScanner';
import AIPhotoScanner from '../../components/scan/AIPhotoScanner';
import FoodDetailPanel from '../../components/food/FoodDetailPanel';
import MealSelectorModal from '../../components/food/MealSelectorModal';
import { computeStreakState } from '../../utils/streak';
import PaywallOverlay from '../../components/paywall/PaywallOverlay';
import { effectiveSubscriptionStatus, shouldShowTrialExpired } from '../../utils/subscription';
import { getLocalDateString, parseLocalDateKey, shiftLocalDateKey } from '../../utils/dates';
import SobrietyTracker from '../../components/log/SobrietyTracker';
import FastingTracker, { completionMessage } from '../../components/log/FastingTracker';
import { useRecentFoods } from '../../hooks/useRecentFoods';

function buildEntry(food, meal) {
  const m = food.servingMultiplier || food.factor || food.servings || 1;
  const entry = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    foodId: food.id,
    name: food.name,
    meal,
    servings: m,
    servingAmount: food.servingAmount ?? m,
    servingUnit: food.servingUnit || 'serving',
    servingGrams: food.servingGrams,
    baseServingGrams: food.baseServingGrams || food.servingGrams || 100,
    calories: Math.round(food.calories ?? 0),
    protein: Math.round((food.protein ?? 0) * 10) / 10,
    carbs: Math.round((food.carbs ?? 0) * 10) / 10,
    fat: Math.round((food.fat ?? 0) * 10) / 10,
    serving: food.serving || food.label || '1 serving',
  };
  if (food.scanImageUri) entry.imageUri = food.scanImageUri;
  return entry;
}

function todayKey() {
  return getLocalDateString();
}

function mapAiFoods(foods) {
  return foods.map((f, i) => ({
    ...f,
    id: f.id || `ai-scan-${Date.now()}-${i}`,
    source: 'ai-scan',
  }));
}

function formatHeaderDate(dateStr) {
  const d = parseLocalDateKey(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function LogScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { showToast } = useToast();
  const {
    foodEntries, addFoodEntry, removeFoodEntry, updateFoodEntry, getDayTotals, goals, profile,
    waterLogs, setWaterForDate, habitLogs, toggleHabitForDate, habits,
    progressPhotos, saveProgressPhoto, isPro, trialDaysRemaining,
    activeFastStart, fastingLogs, startFast, endFast,
  } = useUser();
  const [date, setDate] = useState(todayKey());
  const [paywall, setPaywall] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const [pendingMeal, setPendingMeal] = useState(null);
  const [barcodeVisible, setBarcodeVisible] = useState(false);
  const [photoScanVisible, setPhotoScanVisible] = useState(false);
  const [detailFood, setDetailFood] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [pendingLogFood, setPendingLogFood] = useState(null);
  const [pendingBatch, setPendingBatch] = useState(null);
  const { addRecent } = useRecentFoods();

  const entries = foodEntries[date] || [];
  const totals = useMemo(() => getDayTotals(date), [getDayTotals, date, foodEntries]);
  const streak = useMemo(() => computeStreakState(profile, foodEntries), [profile, foodEntries]);

  const subStatus = useMemo(() => effectiveSubscriptionStatus(profile), [profile]);

  const habitCompleted = useMemo(() => {
    const manual = habitLogs[date] || {};
    const waterOz = waterLogs[date] || 0;
    const waterGoal = Math.round((Number(profile.weight) || 154) / 2);
    return {
      ...manual,
      log_meals: entries.length > 0,
      protein: totals.protein >= goals.protein * 0.9,
      water: waterOz >= waterGoal,
    };
  }, [habitLogs, date, entries, totals, goals, waterLogs, profile.weight]);

  const shiftDate = (days) => {
    setDate((d) => shiftLocalDateKey(d, days));
  };

  const lastCompletedFast = useMemo(
    () => (fastingLogs || []).find((f) => f.endTime) || null,
    [fastingLogs],
  );

  const handleEndFast = async () => {
    const result = await endFast();
    if (result) showToast(completionMessage(result.hours, result.minutes), 'success');
  };

  const goToSearch = (meal) => {
    navigation.navigate('Search', { preselectMeal: meal });
  };

  const openAddMenu = (meal = null) => {
    setPendingMeal(meal);
    setAddMenuVisible(true);
  };

  const tryAddEntry = (entry) => {
    if (!isPro) {
      const mealCount = entries.filter((e) => e.meal === entry.meal).length;
      if (mealCount >= 3) {
        setPaywall({ featureName: 'Unlimited Food Logging', benefit: 'Log as many foods as you want, every meal' });
        return false;
      }
    }
    addFoodEntry(date, entry);
    return true;
  };

  const openMealPicker = (food, batch = null) => {
    setPendingLogFood(food);
    setPendingBatch(batch);
    setMealModalVisible(true);
  };

  const commitLog = async (meal, food, batch) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (batch?.length) {
      let added = 0;
      batch.forEach((item) => {
        if (tryAddEntry(buildEntry(item, meal))) {
          addRecent(item);
          added += 1;
        }
      });
      if (added) showToast(`Added ${added} items to ${meal}! ✓`, 'success');
    } else if (food) {
      if (tryAddEntry(buildEntry(food, meal))) {
        addRecent(food);
        showToast(`Added to ${meal}! ✓`, 'success');
      }
    }
    setMealModalVisible(false);
    setPendingLogFood(null);
    setPendingBatch(null);
    setPhotoScanVisible(false);
  };

  const handleMealSelect = (meal) => {
    if (pendingBatch?.length) commitLog(meal, null, pendingBatch);
    else if (pendingLogFood) commitLog(meal, pendingLogFood, null);
  };

  const handleAddMenuSelect = (optionId) => {
    setAddMenuVisible(false);
    if (optionId === 'database') {
      goToSearch(pendingMeal);
      return;
    }
    if (optionId === 'barcode') {
      setBarcodeVisible(true);
      return;
    }
    if (optionId === 'photo') {
      if (!isPro) {
        setPaywall({ featureName: 'AI Photo Scanner', benefit: 'Snap any meal for instant AI nutrition analysis' });
        return;
      }
      setPhotoScanVisible(true);
    }
  };

  const handleAiResults = (foods) => {
    const mapped = mapAiFoods(foods);
    if (mapped.length === 1) openMealPicker(mapped[0]);
    else if (mapped.length) openMealPicker(mapped[0], mapped);
  };

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {subStatus === 'trial' && (
            <TouchableOpacity style={styles.trialBanner} onPress={() => navigation.navigate('Upgrade')}>
              <Text style={styles.trialText}>🎉 Pro Trial: {trialDaysRemaining} days remaining</Text>
              <Text style={styles.trialCta}>
                {profile.stripeSubscriptionId ? 'Auto-renews after trial · Manage →' : 'Upgrade to Keep Pro →'}
              </Text>
            </TouchableOpacity>
          )}
          {shouldShowTrialExpired(profile) && (
            <TouchableOpacity style={styles.expiredBanner} onPress={() => navigation.navigate('Upgrade')}>
              <Text style={styles.expiredText}>Your trial ended — upgrade to unlock Pro features</Text>
              <Text style={styles.trialCta}>Upgrade →</Text>
            </TouchableOpacity>
          )}

          <View style={styles.topRow}>
            <Text style={styles.screenTitle}>Log</Text>
            <TouchableOpacity style={styles.streakBtn}>
              <Text style={styles.streakEmoji}>🔥 {profile.streakCount || 0}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateNav}>
            <TouchableOpacity style={styles.dateBtn} onPress={() => shiftDate(-1)}>
              <Text style={styles.dateBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.dateLabel}>{formatHeaderDate(date)}</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => shiftDate(1)}>
              <Text style={styles.dateBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summary}>
            <CalorieRing consumed={totals.calories} goal={goals.calories} />
            <View style={styles.macros}>
              <MacroBar label="🟡 Protein" value={totals.protein} goal={goals.protein} color={colors.protein} />
              <MacroBar label="🔵 Carbs" value={totals.carbs} goal={goals.carbs} color={colors.carbs} />
              <MacroBar label="🔴 Fat" value={totals.fat} goal={goals.fat} color={colors.fat} />
            </View>
          </View>

          <TouchableOpacity style={styles.addMealBtn} onPress={() => openAddMenu()} activeOpacity={0.85}>
            <Text style={styles.addMealText}>+ Add Meal</Text>
          </TouchableOpacity>

          <MicronutrientPanel foodEntries={foodEntries} date={date} isPro={isPro} />

          {MEALS.map((meal) => (
            <MealSection
              key={meal}
              meal={meal}
              entries={entries.filter((e) => e.meal === meal)}
              onRemove={(id) => removeFoodEntry(date, id)}
              onAddFood={openAddMenu}
              onEditEntry={(entry) => setEditingEntry(entry)}
            />
          ))}

          <WaterTracker
            weightLbs={profile.weight}
            loggedOz={waterLogs[date] || 0}
            onChange={(oz) => setWaterForDate(date, oz)}
          />

          <FastingTracker
            activeStartTime={activeFastStart}
            lastCompletedFast={lastCompletedFast}
            onStart={startFast}
            onEnd={handleEndFast}
          />

          <StreakTree
            streakCount={streak.streakCount}
            streakBroken={streak.streakBroken}
            milestoneMessage={streak.message}
          />

          <View style={styles.habitGate}>
            <View style={!isPro ? styles.blurred : null}>
              <DailyHabits habits={habits} completed={habitCompleted} onToggle={(id) => isPro && toggleHabitForDate(date, id)} />
            </View>
            {!isPro && (
              <TouchableOpacity style={styles.gateOverlay} onPress={() => setPaywall({ featureName: 'Daily Habit Tracker', benefit: 'Build healthy habits with daily check-ins' })}>
                <Text style={styles.gateLock}>🔒</Text>
                <Text style={styles.gateText}>Daily Habit Tracker is Pro</Text>
                <Text style={styles.gateCta}>Tap to unlock →</Text>
              </TouchableOpacity>
            )}
          </View>

          {profile.showSobrietyTracker ? (
            <SobrietyTracker streakCount={profile.sobrietyStreakCount || 0} />
          ) : null}

          <ProgressPhotoCard
            photo={progressPhotos[date]}
            onSave={(photo) => saveProgressPhoto(date, photo)}
            onViewAll={() => navigation.navigate('Progress')}
          />
        </ScrollView>

        <AddFoodMenu
          visible={addMenuVisible}
          onClose={() => setAddMenuVisible(false)}
          onSelect={handleAddMenuSelect}
        />

        <Modal visible={barcodeVisible} animationType="slide" onRequestClose={() => setBarcodeVisible(false)}>
          <View style={styles.scannerModal}>
            <BarcodeScanner
              onProductFound={(product) => {
                setBarcodeVisible(false);
                const food = { ...product, source: product.source || 'brand' };
                setDetailFood(food);
                setDetailVisible(true);
              }}
              onNotFound={() => Alert.alert('Not found', 'No product match for this barcode. Try the food database.')}
              onClose={() => setBarcodeVisible(false)}
              onSearchManual={() => {
                setBarcodeVisible(false);
                goToSearch(pendingMeal);
              }}
              onAddCustom={() => {
                setBarcodeVisible(false);
                goToSearch(pendingMeal);
              }}
            />
          </View>
        </Modal>

        <Modal visible={photoScanVisible} animationType="slide" onRequestClose={() => setPhotoScanVisible(false)}>
          <View style={styles.scannerModal}>
            <AIPhotoScanner
              onResults={handleAiResults}
              onManualSearch={() => {
                setPhotoScanVisible(false);
                goToSearch(pendingMeal);
              }}
            />
          </View>
        </Modal>

        <FoodDetailPanel
          visible={detailVisible}
          food={detailFood}
          onClose={() => { setDetailVisible(false); setDetailFood(null); }}
          onLog={(scaled) => openMealPicker(scaled)}
          onFavorite={() => {}}
          isFavorite={false}
        />

        <MealSelectorModal
          visible={mealModalVisible}
          food={pendingLogFood}
          onSelect={handleMealSelect}
          onClose={() => {
            setMealModalVisible(false);
            setPendingLogFood(null);
            setPendingBatch(null);
          }}
        />

        <PaywallOverlay visible={!!paywall} featureName={paywall?.featureName} benefit={paywall?.benefit} onDismiss={() => setPaywall(null)} />
        <LogEntryEditSheet
          visible={!!editingEntry}
          entry={editingEntry}
          onUpdate={(updates) => {
            updateFoodEntry(date, editingEntry.id, updates);
            setEditingEntry(null);
            showToast('Entry updated', 'success');
          }}
          onDelete={() => {
            removeFoodEntry(date, editingEntry.id);
            setEditingEntry(null);
            showToast('Entry removed', 'success');
          }}
          onClose={() => setEditingEntry(null)}
        />
      </View>
    </ScreenLayout>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  addMealBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  addMealText: { color: colors.onAccent, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  scannerModal: { flex: 1, backgroundColor: colors.bg },
  trialBanner: { backgroundColor: colors.accent, borderRadius: radius.sm, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trialText: { color: colors.onAccent, fontWeight: '700', fontSize: 13, flex: 1 },
  trialCta: { color: colors.onAccent, fontWeight: '800', fontSize: 12 },
  expiredBanner: { backgroundColor: '#7F1D1D', borderRadius: radius.sm, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  habitGate: { position: 'relative', marginBottom: 12 },
  blurred: { opacity: 0.35 },
  gateOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', padding: 16 },
  gateLock: { fontSize: 28, marginBottom: 6 },
  gateText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  gateCta: { color: colors.accent, fontSize: 12, marginTop: 4 },
  expiredText: { color: '#FECACA', fontWeight: '600', fontSize: 13, flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  streakBtn: { padding: 8 },
  streakEmoji: { fontSize: 16, fontWeight: '700', color: colors.accent },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 },
  dateBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  dateBtnText: { fontSize: 18, color: colors.textSecondary },
  dateLabel: { fontSize: 15, fontWeight: '600', color: colors.text, minWidth: 180, textAlign: 'center' },
  summary: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 16, marginBottom: 16 },
  macros: { width: '100%', gap: 10 },
});
