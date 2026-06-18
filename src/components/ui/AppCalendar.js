import { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const ACCENT = '#AAFF00';

export default function AppCalendar({ theme: themeOverrides = {}, style, ...calendarProps }) {
  const { colors } = useTheme();
  const theme = useMemo(() => ({
    backgroundColor: colors.surface,
    calendarBackground: colors.surface,
    textSectionTitleColor: colors.textMuted,
    selectedDayBackgroundColor: colors.accent,
    selectedDayTextColor: colors.onAccent,
    todayTextColor: colors.accent,
    dayTextColor: colors.text,
    textDisabledColor: colors.borderLight,
    monthTextColor: colors.text,
    arrowColor: ACCENT,
    ...themeOverrides,
  }), [colors, themeOverrides]);

  const renderArrow = (direction) => (
    <View style={styles.arrowHit}>
      <Ionicons
        name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
        size={22}
        color={ACCENT}
      />
    </View>
  );

  return (
    <Calendar
      {...calendarProps}
      style={[styles.calendar, style]}
      renderArrow={renderArrow}
      enableSwipeMonths
      theme={theme}
    />
  );
}

const styles = StyleSheet.create({
  calendar: { borderRadius: 12 },
  arrowHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
