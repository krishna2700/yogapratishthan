/**
 * Postgres `@db.Date` columns (scheduledDate, vacation start/end) store pure
 * calendar dates with no time-of-day, and Prisma reads/writes them as
 * UTC-midnight `Date` objects. date-fns's `startOfDay`/`addDays` operate in
 * the server's *local* timezone — on a server not running in UTC, mixing
 * the two silently shifts dates by a day. Everything that touches a
 * `@db.Date` field must go through these UTC-safe helpers instead.
 */

/** Today's calendar date (as the server's wall clock sees it), at UTC midnight. */
export function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function addUTCDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function getUTCWeekdayIndex(date: Date): number {
  return date.getUTCDay();
}
