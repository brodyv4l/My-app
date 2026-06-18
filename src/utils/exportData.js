function escCsv(val) {
  const s = val == null ? '' : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildFoodEntriesCsv(foodEntries) {
  const headers = [
    'date', 'meal', 'name', 'servings', 'serving', 'calories', 'protein', 'carbs', 'fat',
    'fiber', 'sugar', 'sodium', 'foodId',
  ];
  const rows = [headers.join(',')];
  Object.keys(foodEntries).sort().forEach((date) => {
    (foodEntries[date] || []).forEach((e) => {
      rows.push([
        date,
        e.meal,
        e.name,
        e.servings,
        e.serving,
        e.calories,
        e.protein,
        e.carbs,
        e.fat,
        e.fiber ?? '',
        e.sugar ?? '',
        e.sodium ?? '',
        e.foodId ?? '',
      ].map(escCsv).join(','));
    });
  });
  return rows.join('\n');
}

export function foodEntryCount(foodEntries) {
  return Object.values(foodEntries).reduce((n, day) => n + (day?.length || 0), 0);
}
