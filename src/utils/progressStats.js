import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, format, parseISO, isWithinInterval,
} from 'date-fns';

export function getPeriodRange(period, anchor = new Date()) {
  if (period === 'month') {
    return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
  }
  return {
    start: startOfWeek(anchor, { weekStartsOn: 0 }),
    end: endOfWeek(anchor, { weekStartsOn: 0 }),
  };
}

export function aggregateNutrition(foodEntries, period, anchor = new Date()) {
  const { start, end } = getPeriodRange(period, anchor);
  const days = eachDayOfInterval({ start, end });
  let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  let daysWithData = 0;

  days.forEach((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const entries = foodEntries[key] || [];
    if (entries.length) {
      daysWithData += 1;
      entries.forEach((e) => {
        totals.calories += e.calories || 0;
        totals.protein += e.protein || 0;
        totals.carbs += e.carbs || 0;
        totals.fat += e.fat || 0;
      });
    }
  });

  const divisor = period === 'week' ? 7 : days.length;
  return {
    totals,
    averages: {
      calories: Math.round(totals.calories / divisor),
      protein: Math.round(totals.protein / divisor),
      carbs: Math.round(totals.carbs / divisor),
      fat: Math.round(totals.fat / divisor),
    },
    daysWithData,
    dayCount: divisor,
  };
}

export function getTodayTotals(foodEntries) {
  const key = format(new Date(), 'yyyy-MM-dd');
  const entries = foodEntries[key] || [];
  return entries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein: acc.protein + (e.protein || 0),
    carbs: acc.carbs + (e.carbs || 0),
    fat: acc.fat + (e.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

export function filterWeightLogsForPeriod(weightLogs, period, anchor = new Date()) {
  const { start, end } = getPeriodRange(period, anchor);
  return weightLogs.filter((log) => {
    const d = parseISO(log.date);
    return isWithinInterval(d, { start, end });
  });
}
