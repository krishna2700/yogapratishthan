import { CalendarClock, CalendarOff, LayoutDashboard, ListChecks, Users } from "lucide-react";

export const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/attendance", label: "Attendance", icon: ListChecks },
  { href: "/vacations", label: "Vacations", icon: CalendarOff },
  { href: "/reminders", label: "Reminders", icon: CalendarClock },
] as const;
