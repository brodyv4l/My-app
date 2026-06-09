export function lbsToKg(lbs) {
  return Number(lbs) / 2.20462;
}

export function heightToCm(feet, inches) {
  const totalInches = (Number(feet) || 0) * 12 + (Number(inches) || 0);
  return totalInches * 2.54;
}

export function formatHeight(feet, inches) {
  if (!feet && !inches) return '—';
  return `${feet || 0}'${inches || 0}"`;
}

export function formatWeight(lbs) {
  if (!lbs && lbs !== 0) return '—';
  return `${lbs} lbs`;
}

export function normalizeProfileUnits(profile) {
  const next = { ...profile };

  if (next.heightFeet === undefined && next.height && Number(next.height) > 12) {
    const totalInches = Number(next.height) / 2.54;
    next.heightFeet = Math.floor(totalInches / 12);
    next.heightInches = Math.round(totalInches % 12);
  }

  if (next.weight && Number(next.weight) < 120 && !next.heightFeet) {
    next.weight = Math.round(Number(next.weight) * 2.20462);
  }

  next.heightFeet = next.heightFeet ?? '';
  next.heightInches = next.heightInches ?? '';
  return next;
}

export function profileForCalculation(profile) {
  const p = normalizeProfileUnits(profile);
  return {
    ...p,
    weightKg: lbsToKg(p.weight || 154),
    heightCm: heightToCm(p.heightFeet || 5, p.heightInches || 9),
    weightLbs: Number(p.weightLbs || p.weight) || 154,
  };
}

