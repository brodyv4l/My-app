import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
import { colors, GOAL_TYPES, ACTIVITY_LEVELS, DIETARY_OPTIONS } from '../../constants/theme';
import { generateCalorieTarget } from '../../services/openai';
import { formatHeight, formatWeight } from '../../utils/units';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, goals } = useUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...profile });
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    setForm({ ...profile });
  }, [profile]);

  const save = async () => {
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

  const recalculateGoals = async () => {
    setRecalculating(true);
    try {
      const result = await generateCalorieTarget(profile);
      await updateProfile({
        calorieGoal: result.calories,
        macroGoals: { protein: result.protein, carbs: result.carbs, fat: result.fat },
        aiExplanation: result.explanation,
      });
      Alert.alert('Goals Updated', result.explanation);
    } finally {
      setRecalculating(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const goalLabel = GOAL_TYPES.find((g) => g.id === profile.goalType)?.label || profile.goalType;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(profile.name || user?.email || '?')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{profile.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Card>
        <SectionTitle title="Daily Goals" />
        <View style={styles.goalGrid}>
          <View style={styles.goalItem}><Text style={styles.goalVal}>{goals.calories}</Text><Text style={styles.goalLbl}>Calories</Text></View>
          <View style={styles.goalItem}><Text style={[styles.goalVal, { color: colors.protein }]}>{goals.protein}g</Text><Text style={styles.goalLbl}>Protein</Text></View>
          <View style={styles.goalItem}><Text style={[styles.goalVal, { color: colors.carbs }]}>{goals.carbs}g</Text><Text style={styles.goalLbl}>Carbs</Text></View>
          <View style={styles.goalItem}><Text style={[styles.goalVal, { color: colors.fat }]}>{goals.fat}g</Text><Text style={styles.goalLbl}>Fat</Text></View>
        </View>
        <Text style={styles.goalType}>Goal: {goalLabel}</Text>
        <Button title="Recalculate with AI" onPress={recalculateGoals} loading={recalculating} variant="outline" style={{ marginTop: 12 }} />
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <SectionTitle title="Your Stats" />
          <TouchableOpacity onPress={() => editing ? save() : setEditing(true)}>
            <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
        {editing ? (
          <>
            <Input label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <Input label="Age" value={String(form.age ?? '')} onChangeText={(v) => setForm({ ...form, age: v })} keyboardType="numeric" />
            <View style={styles.heightRow}>
              <View style={styles.heightField}><Input label="Feet" value={String(form.heightFeet ?? '')} onChangeText={(v) => setForm({ ...form, heightFeet: v })} keyboardType="numeric" /></View>
              <View style={styles.heightField}><Input label="Inches" value={String(form.heightInches ?? '')} onChangeText={(v) => setForm({ ...form, heightInches: v })} keyboardType="numeric" /></View>
            </View>
            <Input label="Weight (lbs)" value={String(form.weight ?? '')} onChangeText={(v) => setForm({ ...form, weight: v })} keyboardType="numeric" />
            <Text style={styles.label}>Goal</Text>
            <View style={styles.chipRow}>
              {GOAL_TYPES.map((g) => (
                <TouchableOpacity key={g.id} style={[styles.chip, form.goalType === g.id && styles.chipActive]} onPress={() => setForm({ ...form, goalType: g.id })}>
                  <Text style={[styles.chipText, form.goalType === g.id && styles.chipTextActive]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.statsList}>
            <StatRow label="Age" value={`${profile.age || '—'} years`} />
            <StatRow label="Height" value={formatHeight(profile.heightFeet, profile.heightInches)} />
            <StatRow label="Weight" value={formatWeight(profile.weight)} />
            <StatRow label="Activity" value={ACTIVITY_LEVELS.find((a) => a.id === profile.activityLevel)?.label || '—'} />
          </View>
        )}
      </Card>

      <Card>
        <SectionTitle title="Dietary Preferences" />
        <View style={styles.chipRow}>
          {DIETARY_OPTIONS.map((d) => {
            const active = (editing ? form : profile).dietaryPreferences?.includes(d);
            return (
              <TouchableOpacity
                key={d}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => editing && setForm({ ...form, dietaryPreferences: active ? form.dietaryPreferences.filter((x) => x !== d) : [...(form.dietaryPreferences || []), d] })}
                disabled={!editing}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Button title="Sign Out" onPress={handleSignOut} variant="ghost" style={styles.signOut} />
    </ScrollView>
  );
}

function StatRow({ label, value }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#09090b' },
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
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  statLabel: { color: colors.textMuted, fontSize: 14 },
  statValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8 },
  heightRow: { flexDirection: 'row', gap: 10 },
  heightField: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: colors.accent },
  signOut: { marginTop: 8 },
});
