import { differenceInCalendarDays, parseISO } from 'date-fns';
import { getLocalDateString } from './dates';

export function todayKey() {
  return getLocalDateString();
}

export function computeStreakState(profile, foodEntries) {
  const streakCount = profile.streakCount || 0;
  const lastLogged = profile.lastLoggedDate || '';
  const streakBroken = profile.streakBroken || false;
  const today = todayKey();
  const hasLogToday = (foodEntries[today] || []).length > 0;

  if (!lastLogged && !hasLogToday) {
    return { streakCount: 0, streakBroken: false, stage: 0, message: null };
  }

  let count = streakCount;
  let broken = streakBroken;

  if (lastLogged) {
    const daysSince = differenceInCalendarDays(new Date(), parseISO(lastLogged));
    if (daysSince > 1 && !hasLogToday) {
      broken = true;
      count = streakCount;
    }
  }

  if (hasLogToday && broken) {
    broken = false;
    count = 1;
  }

  return {
    streakCount: broken && !hasLogToday ? count : (hasLogToday && count === 0 ? 1 : count),
    streakBroken: broken && !hasLogToday,
    stage: getTreeStage(broken && !hasLogToday ? 0 : count),
    message: getMilestoneMessage(count),
  };
}

export function getTreeStage(streakDays) {
  if (streakDays <= 0) return 0;
  if (streakDays <= 4) return 1;
  if (streakDays <= 9) return 2;
  if (streakDays <= 19) return 3;
  if (streakDays <= 29) return 4;
  if (streakDays <= 44) return 5;
  if (streakDays <= 59) return 6;
  if (streakDays <= 89) return 7;
  if (streakDays <= 179) return 8;
  if (streakDays <= 364) return 9;
  return 10;
}

export function getMilestoneMessage(days) {
  const milestones = [
    { days: 365, message: '365 days. You ARE the forest. 🌳✨' },
    { days: 100, message: "100 days! You're legendary 👑" },
    { days: 60, message: '60 days! Incredible consistency 🏆' },
    { days: 30, message: '30 days! Your tree is thriving 🌳' },
    { days: 14, message: 'Two weeks strong! 🌿' },
    { days: 7, message: "One week! You're building a habit 💪" },
    { days: 3, message: '3 days! Keep it up 🌱' },
  ];
  return milestones.find((m) => days >= m.days)?.message || null;
}

export function applyStreakOnFoodLog(profile, date) {
  const today = todayKey();
  if (date !== today) return profile;

  const last = profile.lastLoggedDate;
  let streakCount = profile.streakCount || 0;
  let streakBroken = false;
  let streakStartDate = profile.streakStartDate || today;

  if (profile.streakBroken) {
    streakCount = 1;
    streakBroken = false;
    streakStartDate = today;
  } else if (!last) {
    streakCount = 1;
    streakStartDate = today;
  } else {
    const diff = differenceInCalendarDays(parseISO(today), parseISO(last));
    if (diff === 0) {
      // same day, no change
    } else if (diff === 1) {
      streakCount += 1;
    } else {
      streakCount = 1;
      streakStartDate = today;
    }
  }

  return {
    ...profile,
    streakCount,
    streakBroken,
    streakStartDate,
    lastLoggedDate: today,
  };
}
