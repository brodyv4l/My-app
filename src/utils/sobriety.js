import { getLocalDateString, shiftLocalDateKey } from './dates';

/** Update sobriety streak when "no alcohol" habit is toggled. */
export function applySobrietyToggle(profile, date, checked) {
  const today = getLocalDateString();
  const next = { ...profile };

  if (!checked) {
    next.sobrietyStreakCount = 0;
    next.sobrietyLastCleanDate = '';
    return next;
  }

  const last = profile.sobrietyLastCleanDate || '';
  if (last === date) return next;

  const yesterday = shiftLocalDateKey(today, -1);
  if (last === yesterday || last === shiftLocalDateKey(date, -1)) {
    next.sobrietyStreakCount = (profile.sobrietyStreakCount || 0) + 1;
  } else {
    next.sobrietyStreakCount = 1;
  }
  next.sobrietyLastCleanDate = date;
  return next;
}
