import { View, StyleSheet } from 'react-native';
import { Input } from '../../ui/Input';

export default function MetricsStep({ survey, errors, onChange }) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.field}>
          <Input
            label="Feet"
            value={survey.heightFeet}
            onChangeText={(v) => onChange({ heightFeet: v })}
            keyboardType="number-pad"
            error={errors.heightFeet}
            accessibilityLabel="Height in feet"
          />
        </View>
        <View style={styles.field}>
          <Input
            label="Inches"
            value={survey.heightInches}
            onChangeText={(v) => onChange({ heightInches: v })}
            keyboardType="number-pad"
            error={errors.heightInches}
            accessibilityLabel="Height in inches"
          />
        </View>
      </View>
      <Input
        label="Current weight (lbs)"
        value={survey.weight}
        onChangeText={(v) => onChange({ weight: v })}
        keyboardType="decimal-pad"
        error={errors.weight}
        accessibilityLabel="Current weight in pounds"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
});

