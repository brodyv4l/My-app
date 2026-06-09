import { View, Text, StyleSheet } from 'react-native';
import { Input } from '../../ui/Input';
import DatePickerField from '../DatePickerField';
import { colors } from '../../../constants/theme';

export default function TargetTimelineStep({ survey, errors, onChange }) {
  return (
    <View>
      <Input
        label="Target weight (lbs)"
        value={survey.targetWeight}
        onChangeText={(v) => onChange({ targetWeight: v })}
        keyboardType="decimal-pad"
        error={errors.targetWeight}
        accessibilityLabel="Target weight in pounds"
      />
      <DatePickerField
        label="Target achievement date"
        value={survey.targetDate}
        onChange={(date) => onChange({ targetDate: date })}
        error={errors.targetDate}
      />
      <Text style={styles.note}>We will use this timeline to personalize your nutrition plan.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
});
