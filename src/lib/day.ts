// Canonical local-day helpers. All day math is in *local* time (mirrors the
// setHours(0,0,0,0) pattern in ordering.ts) so the ritual flips at local
// midnight, consistent with the due-date logic. Never raw-slice a UTC ISO
// string for a day key — that's off-by-one near midnight in many timezones.

/** Local yyyy-mm-dd for the given date (defaults to now). */
export function todayKey(d: Date = new Date()): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Shift a yyyy-mm-dd key by n days (local). */
export function addDays(key: string, n: number): string {
  const d = new Date(key + "T00:00:00");
  d.setDate(d.getDate() + n);
  return todayKey(d);
}

/** True when day-key a is strictly before day-key b. yyyy-mm-dd sorts lexically. */
export function isBefore(a: string, b: string): boolean {
  return a < b;
}
