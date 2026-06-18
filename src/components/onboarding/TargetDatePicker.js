import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { differenceInCalendarWeeks, format, parseISO } from 'date-fns';
import AppCalendar from '../ui/AppCalendar';
import { radius, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { PACE_LBS_PER_WEEK } from '../../constants/onboarding';
import { getLocalDateString } from '../../utils/dates';

function weeksToGoal(targetDate) {
  const weeks = differenceInCalendarWeeks(parseISO(targetDate), new Date(), { roundingMethod: 'ceil' });
  return Math.max(1, weeks);
}

export default function TargetDatePicker({ survey, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const selected = survey.targetDate || '';
  const today = getLocalDateString();

  const paceLbs = PACE_LBS_PER_WEEK[survey.goalType]?.[survey.goalPace] || 1;
  const weeks = selected ? weeksToGoal(selected) : null;

  const marked = selected
    ? { [selected]: { selected: true, selectedColor: colors.accent, selectedTextColor: colors.onAccent } }
    : {};
  marked[today] = {
    ...(marked[today] || {}),
    customStyles: {
      container: { borderWidth: 2, borderColor: colors.accent, borderRadius: 16 },
      text: { color: colors.text, fontWeight: '700' },
    },
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>🎯 Target Date (optional)</Text>
      <TouchableOpacity style={styles.row} onPress={() => setOpen(true)}>
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected ? format(parseISO(selected), 'EEE, MMM d yyyy') : 'Tap to select a date'}
        </Text>
      </TouchableOpacity>
      {selected && weeks ? (
        <Text style={styles.estimate}>~{weeks} weeks from today based on your pace</Text>
      ) : null}
      {selected ? (
        <TouchableOpacity onPress={() => onChange({ targetDate: '' })}>
          <Text style={styles.clear}>Clear Date</Text>
        </TouchableOpacity>
      ) : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <AppCalendar
              minDate={today}
              onDayPress={(day) => {
                onChange({ targetDate: day.dateString });
                setOpen(false);
              }}
              markedDates={marked}
              markingType="custom"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  row: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14 },
  value: { fontSize: 15, color: colors.text, fontWeight: '600' },
  placeholder: { color: colors.textMuted, fontWeight: '400' },
  estimate: { fontSize: 13, color: colors.accent, marginTop: 8 },
  clear: { fontSize: 13, color: colors.textMuted, marginTop: 8, textDecorationLine: 'underline' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, paddingBottom: 32 },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
});
