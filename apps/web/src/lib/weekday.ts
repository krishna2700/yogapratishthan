import { Weekday } from "@yogapratishthan/db";

/** Prisma enum declaration order matches JS Date.getDay() (0 = Sunday). */
export const WEEKDAY_ORDER: Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

export function weekdayFromJsDay(day: number): Weekday {
  const weekday = WEEKDAY_ORDER[day];
  if (!weekday) throw new Error(`Invalid JS day index: ${day}`);
  return weekday;
}

export function formatWeekdays(weekdays: Weekday[]): string {
  const sorted = [...weekdays].sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
  return new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(
    sorted.map((day) => WEEKDAY_LABELS[day]),
  );
}
