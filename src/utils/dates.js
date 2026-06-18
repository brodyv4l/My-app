/** Local calendar date as YYYY-MM-DD — never use toISOString() for log dates (UTC shift bug). */
export function getLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse a YYYY-MM-DD key as local noon (avoids timezone edge cases in display math). */
export function parseLocalDateKey(dateStr) {
  return new Date(`${dateStr}T12:00:00`);
}

/** Shift a YYYY-MM-DD key by N calendar days. */
export function shiftLocalDateKey(dateStr, days) {
  const d = parseLocalDateKey(dateStr);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}
