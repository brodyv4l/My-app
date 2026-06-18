import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO, isValid } from 'date-fns';
import { Input } from '../ui/Input';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { minTargetDate } from '../../utils/onboardingValidation';

export default function DatePickerField({ value, onChange, error, label = 'Target date' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [show, setShow] = useState(false);
  const minDate = minTargetDate();

  if (Platform.OS === 'web') {
    const webValue = value ? format(value, 'yyyy-MM-dd') : '';
    return (
      <Input
        label={label}
        placeholder="YYYY-MM-DD"
        value={webValue}
        onChangeText={(text) => {
          if (!text) return;
          const parsed = parseISO(text);
          if (isValid(parsed) && parsed >= minDate) onChange(parsed);
        }}
        error={error}
      />
    );
  }

  const display = value ? format(value, 'MMMM d, yyyy') : 'Select a date';

  const handleChange = (event, selected) => {
    if (Platform.OS === 'android') setShow(false);
    if (event?.type === 'dismissed') return;
    if (selected) onChange(selected);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.field, error && styles.fieldError]}
        onPress={() => setShow(true)}
        accessibilityRole="button"
        accessibilityLabel="Choose target date"
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{display}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {show && (
        <DateTimePicker
          value={value || minDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  field: {
    minHeight: 50,
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
  },
  fieldError: { borderColor: colors.danger },
  value: { fontSize: 15, color: colors.text },
  placeholder: { color: colors.textMuted },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
});
