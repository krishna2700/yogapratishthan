import "server-only";
import { addDays } from "date-fns";
import { prisma, SessionStatus } from "@yogapratishthan/db";
import { getSessionStatsForStudents } from "@/features/session-engine/services/session-service";
import { expireStaleMakeups } from "@/features/session-engine/services/makeup-service";
import { addUTCDays, todayUTC } from "@/lib/calendar-date";

export type ReminderType =
  | "LOW_SESSIONS"
  | "MEMBERSHIP_EXPIRED"
  | "MAKEUP_EXPIRING"
  | "CONSECUTIVE_ABSENCES"
  | "BIRTHDAY"
  | "VACATION_IMPACT";

export interface Reminder {
  id: string;
  type: ReminderType;
  severity: "info" | "warning" | "critical";
  message: string;
  studentId?: string;
  student?: {
    firstName: string;
    lastName: string;
    mobileNumber: string | null;
    whatsappNumber: string | null;
  };
  remaining?: number;
}

const LOW_SESSIONS_THRESHOLD = 2;
const MAKEUP_EXPIRING_WITHIN_DAYS = 7;
const VACATION_LOOKAHEAD_DAYS = 14;
const CONSECUTIVE_ABSENCE_COUNT = 3;

export async function getReminders(): Promise<Reminder[]> {
  await expireStaleMakeups();

  const reminders: Reminder[] = [];
  const students = await prisma.student.findMany({ include: { batch: true } });
  const statsMap = await getSessionStatsForStudents(students.map((s) => s.id));

  const now = new Date();
  const today = todayUTC();
  const todayMonth = today.getUTCMonth();
  const todayDate = today.getUTCDate();

  for (const student of students) {
    const stats = statsMap.get(student.id)!;
    const name = `${student.firstName} ${student.lastName}`;
    const contact = {
      firstName: student.firstName,
      lastName: student.lastName,
      mobileNumber: student.mobileNumber,
      whatsappNumber: student.whatsappNumber,
    };

    // A student with nothing purchased yet was never scheduled — that's
    // not the same as a membership having run out.
    if (stats.total > 0 && stats.remaining === 0) {
      reminders.push({
        id: `expired-${student.id}`,
        type: "MEMBERSHIP_EXPIRED",
        severity: "critical",
        message: `${name}'s membership has expired`,
        studentId: student.id,
        student: contact,
        remaining: stats.remaining,
      });
    } else if (stats.total > 0 && stats.remaining <= LOW_SESSIONS_THRESHOLD) {
      reminders.push({
        id: `low-${student.id}`,
        type: "LOW_SESSIONS",
        severity: "warning",
        message: `${name} has only ${stats.remaining} session${stats.remaining === 1 ? "" : "s"} remaining`,
        studentId: student.id,
        student: contact,
        remaining: stats.remaining,
      });
    }

    if (student.dob) {
      const dob = new Date(student.dob);
      if (dob.getUTCMonth() === todayMonth && dob.getUTCDate() === todayDate) {
        reminders.push({
          id: `birthday-${student.id}`,
          type: "BIRTHDAY",
          severity: "info",
          message: `${name}'s birthday is today 🎂`,
          studentId: student.id,
          student: contact,
        });
      }
    }
  }

  const expiringMakeups = await prisma.session.findMany({
    where: {
      status: SessionStatus.MAKEUP,
      makeupExpiresAt: { gte: now, lte: addDays(now, MAKEUP_EXPIRING_WITHIN_DAYS) },
    },
    include: { student: true },
  });
  for (const session of expiringMakeups) {
    reminders.push({
      id: `makeup-expiring-${session.id}`,
      type: "MAKEUP_EXPIRING",
      severity: "warning",
      message: `${session.student.firstName} ${session.student.lastName}'s make-up class expires soon`,
      studentId: session.studentId,
      student: {
        firstName: session.student.firstName,
        lastName: session.student.lastName,
        mobileNumber: session.student.mobileNumber,
        whatsappNumber: session.student.whatsappNumber,
      },
    });
  }

  const recentSessions = await prisma.session.findMany({
    where: { status: { in: [SessionStatus.PRESENT, SessionStatus.ABSENT] } },
    include: { student: true },
    orderBy: { scheduledDate: "desc" },
  });
  const seen = new Set<string>();
  const byStudent = new Map<string, typeof recentSessions>();
  for (const session of recentSessions) {
    const list = byStudent.get(session.studentId) ?? [];
    if (list.length < CONSECUTIVE_ABSENCE_COUNT) list.push(session);
    byStudent.set(session.studentId, list);
  }
  for (const [studentId, list] of byStudent) {
    if (list.length === CONSECUTIVE_ABSENCE_COUNT && list.every((s) => s.status === SessionStatus.ABSENT)) {
      if (!seen.has(studentId)) {
        seen.add(studentId);
        const student = list[0]!.student;
        reminders.push({
          id: `consecutive-absent-${studentId}`,
          type: "CONSECUTIVE_ABSENCES",
          severity: "critical",
          message: `${student.firstName} ${student.lastName} has missed the last ${CONSECUTIVE_ABSENCE_COUNT} classes in a row`,
          studentId,
          student: {
            firstName: student.firstName,
            lastName: student.lastName,
            mobileNumber: student.mobileNumber,
            whatsappNumber: student.whatsappNumber,
          },
        });
      }
    }
  }

  const upcomingVacations = await prisma.vacation.findMany({
    where: { startDate: { gte: today, lte: addUTCDays(today, VACATION_LOOKAHEAD_DAYS) } },
  });
  for (const vacation of upcomingVacations) {
    const affected = await prisma.session.count({
      where: {
        status: { in: [SessionStatus.UPCOMING, SessionStatus.MAKEUP] },
        scheduledDate: { gte: vacation.startDate, lte: vacation.endDate },
      },
    });
    reminders.push({
      id: `vacation-${vacation.id}`,
      type: "VACATION_IMPACT",
      severity: "info",
      message: `Upcoming vacation "${vacation.reason}" will affect ${affected} session${affected === 1 ? "" : "s"}`,
    });
  }

  return reminders;
}
