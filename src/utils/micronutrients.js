export const NUTRIENT_SECTIONS = [
  { id: 'vitamins', title: 'Vitamins' },
  { id: 'minerals', title: 'Minerals' },
  { id: 'fats', title: 'Fats Detail' },
  { id: 'carbs', title: 'Carbs Detail' },
];

export const DAILY_GOALS = {
  vitaminA: { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg', goal: 900, section: 'vitamins', radar: false },
  vitaminC: { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', goal: 90, section: 'vitamins', radar: true },
  vitaminD: { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg', goal: 20, section: 'vitamins', radar: true },
  vitaminE: { key: 'vitaminE', label: 'Vitamin E', unit: 'mg', goal: 15, section: 'vitamins', radar: false },
  vitaminK: { key: 'vitaminK', label: 'Vitamin K', unit: 'mcg', goal: 120, section: 'vitamins', radar: false },
  vitaminB6: { key: 'vitaminB6', label: 'Vitamin B6', unit: 'mg', goal: 1.7, section: 'vitamins', radar: false },
  vitaminB12: { key: 'vitaminB12', label: 'Vitamin B12', unit: 'mcg', goal: 2.4, section: 'vitamins', radar: false },
  folate: { key: 'folate', label: 'Folate', unit: 'mcg', goal: 400, section: 'vitamins', radar: false },
  thiamin: { key: 'thiamin', label: 'Thiamin (B1)', unit: 'mg', goal: 1.2, section: 'vitamins', radar: false },
  riboflavin: { key: 'riboflavin', label: 'Riboflavin (B2)', unit: 'mg', goal: 1.3, section: 'vitamins', radar: false },
  niacin: { key: 'niacin', label: 'Niacin (B3)', unit: 'mg', goal: 16, section: 'vitamins', radar: false },
  calcium: { key: 'calcium', label: 'Calcium', unit: 'mg', goal: 1000, section: 'minerals', radar: true },
  iron: { key: 'iron', label: 'Iron', unit: 'mg', goal: 18, section: 'minerals', radar: true },
  magnesium: { key: 'magnesium', label: 'Magnesium', unit: 'mg', goal: 420, section: 'minerals', radar: true },
  zinc: { key: 'zinc', label: 'Zinc', unit: 'mg', goal: 11, section: 'minerals', radar: false },
  potassium: { key: 'potassium', label: 'Potassium', unit: 'mg', goal: 4700, section: 'minerals', radar: true },
  sodium: { key: 'sodium', label: 'Sodium', unit: 'mg', goal: 2300, section: 'minerals', radar: false, maxGoal: true },
  phosphorus: { key: 'phosphorus', label: 'Phosphorus', unit: 'mg', goal: 700, section: 'minerals', radar: false },
  selenium: { key: 'selenium', label: 'Selenium', unit: 'mcg', goal: 55, section: 'minerals', radar: false },
  saturatedFat: { key: 'saturatedFat', label: 'Saturated Fat', unit: 'g', goal: 20, section: 'fats', radar: false, maxGoal: true },
  transFat: { key: 'transFat', label: 'Trans Fat', unit: 'g', goal: 2, section: 'fats', radar: false, maxGoal: true },
  monounsaturatedFat: { key: 'monounsaturatedFat', label: 'Monounsaturated', unit: 'g', goal: 25, section: 'fats', radar: false },
  polyunsaturatedFat: { key: 'polyunsaturatedFat', label: 'Polyunsaturated', unit: 'g', goal: 17, section: 'fats', radar: false },
  omega3: { key: 'omega3', label: 'Omega-3', unit: 'g', goal: 1.6, section: 'fats', radar: true },
  omega6: { key: 'omega6', label: 'Omega-6', unit: 'g', goal: 17, section: 'fats', radar: false },
  cholesterol: { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', goal: 300, section: 'fats', radar: false, maxGoal: true },
  fiber: { key: 'fiber', label: 'Dietary Fiber', unit: 'g', goal: 28, section: 'carbs', radar: true },
  sugar: { key: 'sugar', label: 'Total Sugars', unit: 'g', goal: 50, section: 'carbs', radar: false, maxGoal: true },
  starch: { key: 'starch', label: 'Starch', unit: 'g', goal: 150, section: 'carbs', radar: false },
  netCarbs: { key: 'netCarbs', label: 'Net Carbs', unit: 'g', goal: 200, section: 'carbs', radar: false },
};

export const RADAR_NUTRIENT_KEYS = Object.values(DAILY_GOALS).filter((n) => n.radar).map((n) => n.key);

function emptyTotals() {
  return Object.fromEntries(Object.keys(DAILY_GOALS).map((k) => [k, 0]));
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function rowsToMap(rows) {
  const out = {};
  if (!rows) return out;
  if (Array.isArray(rows)) {
    rows.forEach((row) => {
      const label = String(row.label || row.name || '').toLowerCase();
      const val = num(row.amount ?? row.value);
      Object.values(DAILY_GOALS).forEach((def) => {
        if (label.includes(def.key.toLowerCase()) || label.includes(def.label.split(' ')[0].toLowerCase())) {
          out[def.key] = (out[def.key] || 0) + val;
        }
      });
    });
    return out;
  }
  Object.entries(rows).forEach(([k, v]) => {
    const key = k.replace(/[^a-zA-Z0-9]/g, '');
    const match = Object.keys(DAILY_GOALS).find((dk) => dk.toLowerCase() === key.toLowerCase());
    if (match) out[match] = num(typeof v === 'object' ? (v.amount ?? v.value) : v);
  });
  return out;
}

function estimateFromMacros(entry) {
  const cal = num(entry.calories);
  const protein = num(entry.protein);
  const carbs = num(entry.carbs);
  const fat = num(entry.fat);
  const name = (entry.name || '').toLowerCase();
  const est = {};
  est.fiber = num(entry.fiber) || Math.max(0, carbs * 0.08);
  est.sugar = num(entry.sugar) || Math.max(0, carbs * 0.35);
  est.sodium = num(entry.sodium) || Math.round(cal * 1.8);
  est.saturatedFat = Math.max(0, fat * 0.35);
  est.netCarbs = Math.max(0, carbs - est.fiber);
  est.starch = Math.max(0, carbs - est.fiber - est.sugar);
  est.calcium = name.includes('milk') || name.includes('yogurt') || name.includes('cheese') ? 120 : cal * 0.05;
  est.iron = name.includes('beef') || name.includes('spinach') ? 2 : cal * 0.008;
  est.vitaminC = name.includes('fruit') || name.includes('berry') || name.includes('orange') ? 15 : cal * 0.01;
  est.potassium = cal * 2.5;
  est.magnesium = cal * 0.12;
  est.omega3 = name.includes('salmon') || name.includes('fish') ? 1.2 : fat * 0.02;
  est.vitaminD = name.includes('salmon') || name.includes('egg') ? 2 : 0;
  est.vitaminA = cal * 0.2;
  est.zinc = protein * 0.05;
  est.phosphorus = protein * 2;
  return est;
}

export function nutrientsFromEntry(entry) {
  const base = estimateFromMacros(entry);
  const micros = entry.micros || entry.nutrients || {};
  Object.keys(DAILY_GOALS).forEach((k) => {
    if (micros[k] != null) base[k] = num(micros[k]);
    else if (entry[k] != null) base[k] = num(entry[k]);
  });
  const vit = rowsToMap(entry.vitamins);
  const min = rowsToMap(entry.minerals);
  const fatty = rowsToMap(entry.fattyAcids);
  return { ...base, ...vit, ...min, ...fatty };
}

export function aggregateMicronutrientsForDate(foodEntries, date) {
  const entries = foodEntries[date] || [];
  const totals = emptyTotals();
  entries.forEach((entry) => {
    const part = nutrientsFromEntry(entry);
    Object.keys(totals).forEach((k) => {
      totals[k] += num(part[k]);
    });
  });
  return totals;
}

export function nutrientProgress(value, def) {
  const goal = def.goal || 1;
  const raw = num(value);
  const pct = def.maxGoal
    ? Math.max(0, Math.min(100, 100 - (raw / goal) * 100))
    : Math.min(150, (raw / goal) * 100);
  return { pct, value: raw, goal };
}

export function progressBarColor(pct, def) {
  if (pct == null || Number.isNaN(pct)) return '#888888';
  if (def?.maxGoal) {
    if (pct >= 80) return '#22C55E';
    if (pct >= 50) return '#F59E0B';
    if (pct >= 25) return '#EF4444';
    return '#60A5FA';
  }
  if (rawZero(pct)) return '#888888';
  if (pct >= 100) return '#60A5FA';
  if (pct >= 80) return '#22C55E';
  if (pct >= 50) return '#F59E0B';
  return '#EF4444';
}

function rawZero(pct) {
  return pct === 0;
}

export function nutrientsBySection(totals) {
  return NUTRIENT_SECTIONS.map((section) => ({
    ...section,
    items: Object.values(DAILY_GOALS)
      .filter((d) => d.section === section.id)
      .map((def) => ({ def, ...nutrientProgress(totals[def.key], def) })),
  }));
}

export function overallNutrientScore(totals) {
  const scores = Object.values(DAILY_GOALS).map((def) => {
    const { pct } = nutrientProgress(totals[def.key], def);
    return Math.min(100, pct);
  });
  if (!scores.length) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function letterGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function strongestAndWeakest(totals) {
  const ranked = Object.values(DAILY_GOALS).map((def) => {
    const { pct, value } = nutrientProgress(totals[def.key], def);
    const score = Math.min(100, pct);
    return { def, score, value };
  }).sort((a, b) => b.score - a.score);
  const weak = ranked.filter((r) => r.score < 60);
  return {
    strongest: ranked.slice(0, 3),
    focus: weak.length ? weak.slice(0, 3) : ranked.slice(-3).reverse(),
  };
}

export function radarValues(totals) {
  return RADAR_NUTRIENT_KEYS.map((key) => {
    const def = DAILY_GOALS[key];
    const { pct } = nutrientProgress(totals[def.key], def);
    return { key, label: def.label, pct: Math.min(100, pct) };
  });
}
