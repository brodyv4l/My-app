import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Input } from '../../ui/Input';
import { spacing, radius } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

const SEX_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Prefer not to say' },
];

const ACTIVITY_OPTIONS = [
  { id: 'sedentary', icon: '🛋️', label: 'Sedentary', desc: 'Desk job, little to no exercise' },
  { id: 'light', icon: '🚶', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
  { id: 'moderate', icon: '🏃', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
  { id: 'active', icon: '💪', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
  { id: 'extreme', icon: '🏋️', label: 'Athlete', desc: 'Twice daily training or physical job' },
];

function UnitToggle({ options, value, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.unitToggle}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.id}
          style={[styles.unitBtn, value === o.id && styles.unitBtnActive]}
          onPress={() => onChange(o.id)}
        >
          <Text style={[styles.unitText, value === o.id && styles.unitTextActive]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function BodyStatsStep({ survey, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.fieldLabel}>Height</Text>
      <UnitToggle
        options={[{ id: 'ft', label: 'ft/in' }, { id: 'cm', label: 'cm' }]}
        value={survey.heightUnit}
        onChange={(v) => onChange({ heightUnit: v })}
      />
      {survey.heightUnit === 'ft' ? (
        <View style={styles.row}>
          <View style={styles.half}><Input label="Feet" value={String(survey.heightFeet ?? '')} onChangeText={(v) => onChange({ heightFeet: v })} keyboardType="numeric" /></View>
          <View style={styles.half}><Input label="Inches" value={String(survey.heightInches ?? '')} onChangeText={(v) => onChange({ heightInches: v })} keyboardType="numeric" /></View>
        </View>
      ) : (
        <Input label="Centimeters" value={String(survey.heightCm ?? '')} onChangeText={(v) => onChange({ heightCm: v })} keyboardType="numeric" />
      )}

      <Text style={styles.fieldLabel}>Current Weight</Text>
      <UnitToggle
        options={[{ id: 'lbs', label: 'lbs' }, { id: 'kg', label: 'kg' }]}
        value={survey.weightUnit}
        onChange={(v) => onChange({ weightUnit: v })}
      />
      <Input value={String(survey.weight ?? '')} onChangeText={(v) => onChange({ weight: v })} keyboardType="decimal-pad" placeholder={survey.weightUnit === 'kg' ? 'Weight in kg' : 'Weight in lbs'} />

      <Input label="Age" value={String(survey.age ?? '')} onChangeText={(v) => onChange({ age: v })} keyboardType="numeric" placeholder="Years" />

      <Text style={styles.fieldLabel}>Biological Sex</Text>
      <View style={styles.sexRow}>
        {SEX_OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={[styles.sexCard, survey.gender === o.id && styles.sexCardActive]}
            onPress={() => onChange({ gender: o.id })}
          >
            <Text style={[styles.sexLabel, survey.gender === o.id && styles.sexLabelActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Activity Level</Text>
      {ACTIVITY_OPTIONS.map((o) => (
        <TouchableOpacity
          key={o.id}
          style={[styles.activityCard, survey.activityLevel === o.id && styles.activityCardActive]}
          onPress={() => onChange({ activityLevel: o.id })}
        >
          <Text style={styles.activityIcon}>{o.icon}</Text>
          <View style={styles.activityText}>
            <Text style={styles.activityLabel}>{o.label}</Text>
            <Text style={styles.activityDesc}>{o.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 8, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  unitToggle: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  unitBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  unitBtnActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  unitText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  unitTextActive: { color: colors.accent },
  sexRow: { flexDirection: 'row', gap: 8 },
  sexCard: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  sexCardActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  sexLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  sexLabelActive: { color: colors.accent },
  activityCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  activityCardActive: { borderLeftColor: colors.accent, backgroundColor: colors.accentMuted },
  activityIcon: { fontSize: 24, marginRight: 12 },
  activityText: { flex: 1 },
  activityLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  activityDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
