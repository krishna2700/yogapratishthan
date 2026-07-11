import {
  AlertTriangle,
  Cake,
  CalendarOff,
  Clock,
  ShieldAlert,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import type { ReminderType } from "../services/reminder-service";

export const REMINDER_DISPLAY: Record<ReminderType, { label: string; icon: LucideIcon }> = {
  LOW_SESSIONS: { label: "Low sessions", icon: TrendingDown },
  MEMBERSHIP_EXPIRED: { label: "Expired", icon: ShieldAlert },
  MAKEUP_EXPIRING: { label: "Make-up expiring", icon: Clock },
  CONSECUTIVE_ABSENCES: { label: "Consecutive absences", icon: AlertTriangle },
  BIRTHDAY: { label: "Birthday", icon: Cake },
  VACATION_IMPACT: { label: "Vacation impact", icon: CalendarOff },
};
