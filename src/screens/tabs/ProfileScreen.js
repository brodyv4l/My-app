import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Switch, Image, Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
import { GOAL_TYPES, ACTIVITY_LEVELS, DIETARY_OPTIONS } from '../../constants/theme';
import ScreenLayout from '../../components/layout/ScreenLayout';
import GoalsModal from '../../components/GoalsModal';
import { recalculateGoalsWithClaude } from '../../services/claudeGoals';
import { formatHeight, formatWeight } from '../../utils/units';
import { useNavigation } from '@react-navigation/native';
import { effectiveSubscriptionStatus, redeemAccessCode, shouldShowTrialExpired } from '../../utils/subscription';
import PaywallOverlay from '../../components/paywall/PaywallOverlay';
import ManageSubscriptionModal from '../../components/paywall/ManageSubscriptionModal';
import { PrivacyPolicyModal, TermsModal } from '../../components/legal/LegalModal';
import { buildFoodEntriesCsv } from '../../utils/exportData';
import { cancelStripeSubscription } from '../../services/stripeCheckout';

function ToggleRow({ label, value, onValueChange }) {
  const { colors } = useTheme();
  return (
    <View style={[toggleStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[toggleStyles.label, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surface2, true: colors.accentMuted }}
        thumbColor={value ? colors.accent : colors.textMuted}
      />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  label: { fontSize: 14, fontWeight: '500' },
});

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut, deleteAccount } = useAuth();
  const { profile, updateProfile, goals, isPro, trialDaysRemaining, foodEntries } = useUser();
  const { colors, themeMode } = useTheme();
  const { showToast } = useToast();

  const [editing, setEditing] = useState(false);
  const [accountEditing, setAccountEditing] = useState(false);
  const [form, setForm] = useState({ ...profile });
  const [accountForm, setAccountForm] = useState({ name: profile.name || '', email: user?.email || '' });
  const [goalsModal, setGoalsModal] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [logoTaps, setLogoTaps] = useState(0);
  const [exportPaywall, setExportPaywall] = useState(false);
  const [manageModal, setManageModal] = useState(false);
  const [legalModal, setLegalModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const subStatus = effectiveSubscriptionStatus(profile);
  const canCancelMembership = !profile.isFounder
    && !profile.subscriptionCancelAtPeriodEnd
    && !!(profile.stripeSubscriptionId || subStatus === 'pro' || subStatus === 'trial');

  const handleCancelSubscription = async () => {
    const endLabel = profile.subscriptionEndDate || 'the end of your billing period';
    const confirmMessage = `Cancel your membership? You'll keep Pro until ${endLabel} and won't be charged again.`;

    const confirmed = Platform.OS === 'web'
      ? window.confirm(confirmMessage)
      : await new Promise((resolve) => {
          Alert.alert(
            'Cancel membership?',
            `You'll keep Pro until ${endLabel}. No further charges after that.`,
            [
              { text: 'Keep Pro', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Cancel Membership', style: 'destructive', onPress: () => resolve(true) },
            ],
          );
        });

    if (!confirmed) return;

    setCancelBusy(true);
    try {
      let subscriptionEndDate = profile.subscriptionEndDate;
      if (profile.stripeSubscriptionId) {
        const result = await cancelStripeSubscription(profile.stripeSubscriptionId, user?.id);
        subscriptionEndDate = result.currentPeriodEnd || subscriptionEndDate;
      }
      await updateProfile({
        subscriptionCancelAtPeriodEnd: true,
        subscriptionEndDate,
      });
      setManageModal(false);
      showToast(`Membership cancelled. Pro access until ${subscriptionEndDate || endLabel}.`, 'success');
    } catch (err) {
      showToast(err.message || 'Could not cancel membership. Try again.', 'error');
    } finally {
      setCancelBusy(false);
    }
  };

  useEffect(() => { setForm({ ...profile }); }, [profile]);
  useEffect(() => { setAccountForm({ name: profile.name || '', email: user?.email || '' }); }, [profile.name, user?.email]);

  const notif = profile.notificationPrefs || { mealReminders: true, waterReminders: true, weeklyReport: false, streakAlerts: true };
  const units = profile.unitPrefs || { weight: 'lbs', height: 'ft', measurements: 'in', water: 'oz' };

  const saveStats = async () => {
    await updateProfile({
      ...form,
      age: Number(form.age),
      heightFeet: Number(form.heightFeet),
      heightInches: Number(form.heightInches),
      weight: Number(form.weight),
    });
    setEditing(false);
    Alert.alert('Saved', 'Profile updated');
  };

  const saveAccount = async () => {
    await updateProfile({ name: accountForm.name });
    setAccountEditing(false);
    Alert.alert('Saved', 'Account info updated');
  };

  const saveGoals = async (nextGoals) => {
    await updateProfile({
      calorieGoal: nextGoals.calories,
      macroGoals: { protein: nextGoals.protein, carbs: nextGoals.carbs, fat: nextGoals.fat },
    });
  };

  const runAiRecalculate = async () => {
    setAiLoading(true);
    try {
      const result = await recalculateGoalsWithClaude(profile);
      setAiResult(result);
      await updateProfile({
        calorieGoal: result.calories,
        macroGoals: { protein: result.protein, carbs: result.carbs, fat: result.fat },
        aiExplanation: result.explanation,
      });
      showToast('Daily goals updated', 'success');
    } catch (e) {
      showToast(e.message || 'Could not recalculate', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const openAiRecalculate = () => {
    setAiResult(null);
    setAiModal(true);
    runAiRecalculate();
  };

  const toggleDiet = (d) => {
    const prefs = profile.dietaryPreferences || [];
    const next = prefs.includes(d) ? prefs.filter((x) => x !== d) : [...prefs, d];
    updateProfile({ dietaryPreferences: next });
  };

  const setUnit = (key, value) => updateProfile({ unitPrefs: { ...units, [key]: value } });
  const setNotif = (key, value) => updateProfile({ notificationPrefs: { ...notif, [key]: value } });

  const handleExport = async () => {
    if (!isPro) { setExportPaywall(true); return; }
    const csv = buildFoodEntriesCsv(foodEntries);
    const fileName = `foodprint-export-${Date.now()}.csv`;

    if (Platform.OS === 'web') {
      // Trigger a real browser download.
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Alert.alert('Export ready', 'Your CSV download has started.');
      return;
    }

    const path = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
    Alert.alert('Export ready', `Saved to ${path}`);
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      setDeleteConfirmText('');
      setDeleteModal(true);
      return;
    }
    Alert.alert('Delete Account', 'Type DELETE in the next step to confirm. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: () => {
          Alert.prompt?.(
            'Confirm DELETE',
            'Enter DELETE to permanently remove your account',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async (text) => {
                  if (text !== 'DELETE') {
                    Alert.alert('Cancelled', 'Confirmation text did not match.');
                    return;
                  }
                  try {
                    await deleteAccount(user?.email);
                    Alert.alert('Deleted', 'Your account was removed.');
                  } catch (e) {
                    Alert.alert('Error', e.message || 'Could not delete account');
                  }
                },
              },
            ],
            'plain-text',
          ) || Alert.alert('Delete', 'On this platform, contact support to delete your account.');
        },
      },
    ]);
  };

  const handleResetGoal = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Restart onboarding to recalculate your plan?')
      : await new Promise((resolve) => {
          Alert.alert('Reset Goal', 'Restart onboarding to recalculate your plan?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Reset', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    if (!confirmed) return;
    await updateProfile({ onboardingComplete: false });
  };

  const handleSignOut = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Sign out of Foodprint?')
      : await new Promise((resolve) => {
          Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Sign Out', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    if (!confirmed) return;
    setAccountBusy(true);
    try {
      await signOut();
    } catch (e) {
      showToast(e.message || 'Could not sign out', 'error');
    } finally {
      setAccountBusy(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('Type DELETE to confirm', 'error');
      return;
    }
    setAccountBusy(true);
    try {
      await deleteAccount(user?.email);
      setDeleteModal(false);
      showToast('Your account was removed.', 'success');
    } catch (e) {
      showToast(e.message || 'Could not delete account', 'error');
    } finally {
      setAccountBusy(false);
    }
  };

  const applyAccessCode = async () => {
    setCodeBusy(true);
    try {
      const result = await redeemAccessCode(accessCode, user?.email);
      if (!result.ok) {
        Alert.alert('Invalid Code', result.error);
        return;
      }
      await updateProfile(result.profileUpdates);
      setAccessCode('');
      showToast(result.type === 'founder' ? 'Founder access activated!' : 'Pro access unlocked!', 'success');
    } finally {
      setCodeBusy(false);
    }
  };

  const goalLabel = GOAL_TYPES.find((g) => g.id === profile.goalType)?.label || profile.goalType;
  const styles = makeStyles(colors);

  return (
    <ScreenLayout>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.header} activeOpacity={1} onPress={() => {
          const n = logoTaps + 1;
          setLogoTaps(n);
          if (n >= 7) { setLogoTaps(0); navigation.navigate('Admin'); }
        }}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(profile.name || user?.email || '?')[0].toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </TouchableOpacity>

        <Card style={subStatus === 'trial' ? styles.trialCard : subStatus === 'free' ? styles.freeCard : profile.isFounder ? styles.founderCard : styles.proCard}>
          <SectionTitle title="Subscription" />
          {profile.isFounder ? (
            <>
              <Text style={styles.badgeGold}>Founder</Text>
              <Text style={styles.subLine}>Lifetime Pro Access</Text>
              <Text style={styles.subMuted}>Granted via code: {profile.accessCodeUsed}</Text>
            </>
          ) : subStatus === 'trial' ? (
            <>
              <Text style={styles.badgePro}>Pro Trial</Text>
              <Text style={styles.subLine}>{trialDaysRemaining} days remaining</Text>
              <Text style={styles.subMuted}>
                {profile.stripeSubscriptionId
                  ? 'Renews at $4.99/mo after trial unless you cancel'
                  : 'Full Pro access during your trial'}
              </Text>
              {profile.stripeSubscriptionId ? (
                <>
                  <Text style={styles.subMuted}>Cancel anytime — no calls or emails needed.</Text>
                  <Button
                    title="Cancel Membership"
                    variant="outline"
                    onPress={handleCancelSubscription}
                    disabled={cancelBusy}
                    loading={cancelBusy}
                    style={{ marginTop: 12, borderColor: colors.danger }}
                  />
                  <Button title="Manage Subscription" variant="ghost" onPress={() => setManageModal(true)} style={{ marginTop: 8 }} />
                </>
              ) : (
                <Button title="Upgrade Before Trial Ends" onPress={() => navigation.navigate('Upgrade')} style={{ marginTop: 12 }} />
              )}
            </>
          ) : shouldShowTrialExpired(profile) ? (
            <>
              <Text style={styles.badgeFree}>Free Plan</Text>
              <Text style={styles.subMuted}>Your trial has ended</Text>
              <Button title="Upgrade to Pro" onPress={() => navigation.navigate('Upgrade')} style={{ marginTop: 12 }} />
            </>
          ) : subStatus === 'free' ? (
            <>
              <Text style={styles.badgeFree}>Free Plan</Text>
              <Text style={styles.subMuted}>Upgrade to unlock Pro features</Text>
              <Button title="Upgrade to Pro" onPress={() => navigation.navigate('Upgrade')} style={{ marginTop: 12 }} />
            </>
          ) : (
            <>
              <Text style={styles.badgePro}>Pro</Text>
              <Text style={styles.subLine}>Foodprint {profile.subscriptionPlan === 'annual' ? 'Annual' : 'Monthly'}</Text>
              {profile.subscriptionCancelAtPeriodEnd ? (
                <Text style={styles.subMuted}>Cancels {profile.subscriptionEndDate || 'at period end'} — no further charges</Text>
              ) : canCancelMembership ? (
                <Text style={styles.subMuted}>Cancel anytime — no calls or emails needed.</Text>
              ) : null}
              {canCancelMembership ? (
                <>
                  <Button
                    title="Cancel Membership"
                    variant="outline"
                    onPress={handleCancelSubscription}
                    disabled={cancelBusy}
                    loading={cancelBusy}
                    style={{ marginTop: 12, borderColor: colors.danger }}
                  />
                  <Button title="Manage Subscription" variant="ghost" onPress={() => setManageModal(true)} style={{ marginTop: 8 }} />
                </>
              ) : profile.subscriptionPlan ? (
                <Button title="Manage Subscription" variant="outline" onPress={() => setManageModal(true)} style={{ marginTop: 12 }} />
              ) : null}
            </>
          )}
        </Card>

        {!profile.isFounder && subStatus !== 'pro' ? (
          <Card>
            <Text style={styles.codeLabel}>Have an access code?</Text>
            <Input
              value={accessCode}
              onChangeText={setAccessCode}
              placeholder="Enter code"
              autoCapitalize="characters"
              style={{ marginTop: 10 }}
            />
            <Text style={styles.codeHelper}>Enter a code to unlock Pro access for free.</Text>
            <Button title={codeBusy ? 'Redeeming...' : 'Redeem'} onPress={applyAccessCode} disabled={codeBusy || !accessCode.trim()} style={{ marginTop: 10 }} />
          </Card>
        ) : null}

        <Card>
          <View style={styles.cardHeader}>
            <SectionTitle title="Daily Goals" />
            <TouchableOpacity onPress={() => setGoalsModal(true)} hitSlop={8}>
              <Feather name="edit-2" size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
          <View style={styles.goalGrid}>
            <View style={styles.goalItem}><Text style={styles.goalVal}>{goals.calories}</Text><Text style={styles.goalLbl}>Calories</Text></View>
            <View style={styles.goalItem}><Text style={[styles.goalVal, { color: colors.protein }]}>{goals.protein}g</Text><Text style={styles.goalLbl}>Protein</Text></View>
            <View style={styles.goalItem}><Text style={[styles.goalVal, { color: colors.carbs }]}>{goals.carbs}g</Text><Text style={styles.goalLbl}>Carbs</Text></View>
            <View style={styles.goalItem}><Text style={[styles.goalVal, { color: colors.fat }]}>{goals.fat}g</Text><Text style={styles.goalLbl}>Fat</Text></View>
          </View>
          <Text style={styles.goalType}>Goal: {goalLabel}</Text>
          <Button title="AI Recalculate" onPress={openAiRecalculate} variant="outline" style={{ marginTop: 12 }} />
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <SectionTitle title="Your Stats" />
            <TouchableOpacity onPress={() => editing ? saveStats() : setEditing(true)}>
              <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          {editing ? (
            <>
              <Input label="Age" value={String(form.age ?? '')} onChangeText={(v) => setForm({ ...form, age: v })} keyboardType="numeric" />
              <View style={styles.heightRow}>
                <View style={styles.heightField}><Input label="Feet" value={String(form.heightFeet ?? '')} onChangeText={(v) => setForm({ ...form, heightFeet: v })} keyboardType="numeric" /></View>
                <View style={styles.heightField}><Input label="Inches" value={String(form.heightInches ?? '')} onChangeText={(v) => setForm({ ...form, heightInches: v })} keyboardType="numeric" /></View>
              </View>
              <Input label="Weight (lbs)" value={String(form.weight ?? '')} onChangeText={(v) => setForm({ ...form, weight: v })} keyboardType="numeric" />
            </>
          ) : (
            <View style={styles.statsList}>
              <StatRow label="Age" value={`${profile.age || '-'} years`} colors={colors} />
              <StatRow label="Height" value={formatHeight(profile.heightFeet, profile.heightInches)} colors={colors} />
              <StatRow label="Weight" value={formatWeight(profile.weight)} colors={colors} />
              <StatRow label="Activity" value={ACTIVITY_LEVELS.find((a) => a.id === profile.activityLevel)?.label || '-'} colors={colors} />
            </View>
          )}
        </Card>

        <Card>
          <SectionTitle title="Dietary Preferences" />
          <View style={styles.chipRow}>
            {DIETARY_OPTIONS.map((d) => {
              const active = (profile.dietaryPreferences || []).includes(d);
              return (
                <TouchableOpacity key={d} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleDiet(d)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card>
          <SectionTitle title="Units" />
          <UnitPicker label="Weight" value={units.weight} options={['lbs', 'kg']} onChange={(v) => setUnit('weight', v)} colors={colors} />
          <UnitPicker label="Height" value={units.height} options={['ft', 'cm']} onChange={(v) => setUnit('height', v)} colors={colors} />
          <UnitPicker label="Water" value={units.water} options={['oz', 'ml']} onChange={(v) => setUnit('water', v)} colors={colors} />
          <UnitPicker label="Measurements" value={units.measurements} options={['in', 'cm']} onChange={(v) => setUnit('measurements', v)} colors={colors} />
        </Card>

        <Card>
          <SectionTitle title="Trackers" />
          <ToggleRow
            label="Show Sobriety Tracker"
            value={!!profile.showSobrietyTracker}
            onValueChange={(v) => updateProfile({ showSobrietyTracker: v })}
          />
        </Card>

        <Card>
          <SectionTitle title="Notifications" />
          <ToggleRow label="Meal reminders" value={!!notif.mealReminders} onValueChange={(v) => setNotif('mealReminders', v)} />
          <ToggleRow label="Water reminders" value={!!notif.waterReminders} onValueChange={(v) => setNotif('waterReminders', v)} />
          <ToggleRow label="Weekly report" value={!!notif.weeklyReport} onValueChange={(v) => setNotif('weeklyReport', v)} />
          <ToggleRow label="Streak alerts" value={!!notif.streakAlerts} onValueChange={(v) => setNotif('streakAlerts', v)} />
        </Card>

        <Card>
          <SectionTitle title="Appearance" />
          <ToggleRow
            label={themeMode === 'light' ? 'Light mode' : 'Dark mode'}
            value={themeMode === 'light'}
            onValueChange={(v) => updateProfile({ themeMode: v ? 'light' : 'dark' })}
          />
        </Card>

        <Card>
          <SectionTitle title="Data" />
          <Button title="Export My Data" variant="outline" onPress={handleExport} />
        </Card>

        <Card>
          <SectionTitle title="Legal" />
          <Button title="Privacy Policy" variant="ghost" onPress={() => setLegalModal('privacy')} />
          <Button title="Terms of Service" variant="ghost" onPress={() => setLegalModal('terms')} style={{ marginTop: 4 }} />
        </Card>

        <Card>
          <SectionTitle title="Goals" />
          <Button title="Reset Goal" variant="outline" onPress={handleResetGoal} />
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <SectionTitle title="Account" />
            <TouchableOpacity onPress={() => accountEditing ? saveAccount() : setAccountEditing(true)}>
              <Text style={styles.editBtn}>{accountEditing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          {accountEditing ? (
            <>
              <Input label="Name" value={accountForm.name} onChangeText={(v) => setAccountForm({ ...accountForm, name: v })} />
              <Input label="Email" value={accountForm.email} editable={false} />
            </>
          ) : (
            <>
              <StatRow label="Name" value={profile.name || '-'} colors={colors} />
              <StatRow label="Email" value={user?.email || '-'} colors={colors} />
            </>
          )}
          <Button title="Sign Out" onPress={handleSignOut} loading={accountBusy} variant="ghost" style={{ marginTop: 8 }} />
          <Button title="Delete Account" onPress={handleDeleteAccount} disabled={accountBusy} variant="outline" style={{ marginTop: 8, borderColor: colors.danger }} />
        </Card>

        <Text style={styles.version}>Foodprint v1.0.0</Text>

        <GoalsModal visible={goalsModal} goals={goals} onSave={saveGoals} onClose={() => setGoalsModal(false)} />
        <PaywallOverlay visible={exportPaywall} featureName="Data Export" benefit="Download all your nutrition data as CSV" onDismiss={() => setExportPaywall(false)} />
        <ManageSubscriptionModal
          visible={manageModal}
          profile={profile}
          onCancel={handleCancelSubscription}
          onClose={() => setManageModal(false)}
          cancelBusy={cancelBusy}
        />
        <PrivacyPolicyModal visible={legalModal === 'privacy'} onClose={() => setLegalModal(null)} />
        <TermsModal visible={legalModal === 'terms'} onClose={() => setLegalModal(null)} />

        <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={() => setDeleteModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.modalSub}>This cannot be undone. Type DELETE to confirm.</Text>
              <Input
                label="Confirmation"
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                autoCapitalize="characters"
                placeholder="DELETE"
              />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="ghost" onPress={() => setDeleteModal(false)} style={{ flex: 1 }} />
                <Button title="Delete" onPress={confirmDeleteAccount} loading={accountBusy} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={aiModal} transparent animationType="fade" onRequestClose={() => setAiModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>AI Goal Recalculation</Text>
              <Text style={styles.modalSub}>Recalculates calories and macros from your profile stats.</Text>
              {aiResult ? (
                <View style={styles.jsonBox}>
                  <Text style={styles.jsonText}>{JSON.stringify({
                    method: aiResult.method,
                    bmr: aiResult.bmr,
                    tdee: aiResult.tdee,
                    calories: aiResult.calories,
                    protein: aiResult.protein,
                    carbs: aiResult.carbs,
                    fat: aiResult.fat,
                  }, null, 2)}</Text>
                  <Text style={styles.modalSub}>{aiResult.explanation}</Text>
                </View>
              ) : null}
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="ghost" onPress={() => setAiModal(false)} style={{ flex: 1 }} />
                <Button title={aiLoading ? 'Calculating...' : 'Recalculate'} onPress={runAiRecalculate} loading={aiLoading} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ScreenLayout>
  );
}

function StatRow({ label, value, colors }) {
  return (
    <View style={[statStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[statStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[statStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function UnitPicker({ label, value, options, onChange, colors }) {
  return (
    <View style={unitStyles.row}>
      <Text style={[unitStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <View style={unitStyles.opts}>
        {options.map((opt) => (
          <TouchableOpacity key={opt} style={[unitStyles.chip, value === opt && { borderColor: colors.accent, backgroundColor: colors.accentMuted }]} onPress={() => onChange(opt)}>
            <Text style={{ color: value === opt ? colors.accent : colors.textMuted, fontWeight: '600', fontSize: 12 }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600' },
});

const unitStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 14 },
  opts: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#2A2A2A' },
});

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 32 },
    header: { alignItems: 'center', marginBottom: 24 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    avatarImg: { width: 60, height: 60, borderRadius: 30, marginBottom: 12 },
    avatarText: { fontSize: 24, fontWeight: '800', color: colors.onAccent },
    name: { fontSize: 22, fontWeight: '800', color: colors.text },
    email: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    editBtn: { color: colors.accent, fontWeight: '700', fontSize: 14 },
    goalGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    goalItem: { alignItems: 'center' },
    goalVal: { fontSize: 20, fontWeight: '800', color: colors.accent },
    goalLbl: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    goalType: { fontSize: 13, color: colors.textMuted, marginTop: 12, textAlign: 'center' },
    statsList: { gap: 4 },
    heightRow: { flexDirection: 'row', gap: 10 },
    heightField: { flex: 1 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
    chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
    chipTextActive: { color: colors.accent },
    trialCard: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
    freeCard: { borderColor: colors.border },
    proCard: { borderColor: colors.accent },
    founderCard: { borderColor: colors.proGold },
    badgePro: { color: colors.accent, fontWeight: '800', fontSize: 14, marginBottom: 6 },
    badgeGold: { color: colors.proGold, fontWeight: '800', fontSize: 14, marginBottom: 6 },
    badgeFree: { color: colors.textMuted, fontWeight: '700', fontSize: 14, marginBottom: 6 },
    subLine: { color: colors.text, fontSize: 14, marginBottom: 4 },
    subMuted: { color: colors.textMuted, fontSize: 13, marginBottom: 4 },
    codeLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    codeHelper: { color: colors.textMuted, fontSize: 13, marginTop: 8 },
    version: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 16, marginBottom: 8 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
    modalSub: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
    jsonBox: { backgroundColor: colors.surface2, borderRadius: 8, padding: 12, marginBottom: 12 },
    jsonText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11, color: colors.text },
    modalActions: { flexDirection: 'row', gap: 8 },
  });
}
