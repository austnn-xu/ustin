/** Local calendar day as YYYY-MM-DD. Streaks and the daily goal are about the user's day, not UTC's. */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y!, m! - 1, d! + days));
}

/** The last seven days ending today, oldest first. */
export function lastWeek(today: string = dayKey()): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
}

/** Single-letter weekday for a day key. */
export function weekdayLetter(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(y!, m! - 1, d!).getDay()]!;
}

