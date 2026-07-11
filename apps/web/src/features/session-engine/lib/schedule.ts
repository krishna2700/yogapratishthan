import type { Weekday } from "@yogapratishthan/db";
import { WEEKDAY_ORDER } from "@/lib/weekday";
import { addUTCDays, getUTCWeekdayIndex, todayUTC } from "@/lib/calendar-date";

const MAX_LOOKAHEAD_DAYS = 730;

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

function matchesWeekday(date: Date, weekdays: Set<Weekday>): boolean {
  return weekdays.has(WEEKDAY_ORDER[getUTCWeekdayIndex(date)]!);
}

/** All calendar-date comparisons here assume UTC-midnight-normalized inputs
 *  (exactly what Prisma reads/writes for `@db.Date` columns). */
export function isDateWithinRange(date: Date, start: Date, end: Date): boolean {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function isDateInAnyVacation(date: Date, vacations: DateRange[]): boolean {
  return vacations.some((vacation) => isDateWithinRange(date, vacation.startDate, vacation.endDate));
}

/**
 * The classroom-schedule algorithm: starting from `startDate` (inclusive),
 * walk forward day by day and collect the next `count` dates that land on
 * one of the batch's weekdays and aren't already-known vacation days. This
 * is what turns "12 sessions, Mon & Thu" into an actual list of calendar
 * dates.
 */
export function generateScheduleDates(
  startDate: Date,
  weekdays: Weekday[],
  count: number,
  vacations: DateRange[] = [],
): Date[] {
  const weekdaySet = new Set(weekdays);
  const dates: Date[] = [];
  let cursor = startDate;
  let iterations = 0;

  while (dates.length < count && iterations < MAX_LOOKAHEAD_DAYS) {
    if (matchesWeekday(cursor, weekdaySet) && !isDateInAnyVacation(cursor, vacations)) {
      dates.push(cursor);
    }
    cursor = addUTCDays(cursor, 1);
    iterations += 1;
  }

  if (dates.length < count) {
    throw new Error("Could not generate the requested number of sessions — check the batch's weekdays");
  }

  return dates;
}

/**
 * Finds the next date (strictly after `afterDate`) that lands on one of the
 * batch's weekdays and isn't blocked by a vacation or another already-taken
 * date for this student. Used to reschedule a vacation-affected session, or
 * to default a make-up date.
 */
export function findNextValidDate(
  afterDate: Date,
  weekdays: Weekday[],
  vacations: DateRange[],
  takenDates: Set<string> = new Set(),
): Date {
  const weekdaySet = new Set(weekdays);
  let cursor = addUTCDays(afterDate, 1);
  let iterations = 0;

  while (iterations < MAX_LOOKAHEAD_DAYS) {
    const key = cursor.toISOString();
    if (matchesWeekday(cursor, weekdaySet) && !isDateInAnyVacation(cursor, vacations) && !takenDates.has(key)) {
      return cursor;
    }
    cursor = addUTCDays(cursor, 1);
    iterations += 1;
  }

  throw new Error("Could not find a valid rescheduling date within two years — check vacation configuration");
}

export function isSameCalendarDate(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

export { todayUTC };
