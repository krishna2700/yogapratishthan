import "server-only";
import { prisma, SessionStatus } from "@yogapratishthan/db";
import { todayUTC } from "@/lib/calendar-date";

const RELEVANT_STATUSES: SessionStatus[] = [
  SessionStatus.UPCOMING,
  SessionStatus.MAKEUP,
  SessionStatus.PRESENT,
  SessionStatus.ABSENT,
];

/** Every session scheduled for today, across every batch meeting today. */
export async function getTodaysSessions() {
  return prisma.session.findMany({
    where: {
      scheduledDate: todayUTC(),
      status: { in: RELEVANT_STATUSES },
    },
    include: { student: true, batch: true },
    orderBy: [{ batch: { startTime: "asc" } }, { student: { firstName: "asc" } }],
  });
}

function monthKeyOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Statuses shown in the register grid. CANCELLED/EXPIRED rows are never a
 *  real class day for the student, so they're excluded entirely. */
const REGISTER_STATUSES: SessionStatus[] = [
  SessionStatus.UPCOMING,
  SessionStatus.MAKEUP,
  SessionStatus.PRESENT,
  SessionStatus.ABSENT,
  SessionStatus.VACATION,
];

/** Every distinct month (as "YYYY-MM") that has at least one register-relevant
 *  session for this batch — drives the attendance sidebar's month list. */
export async function getRegisterMonths(batchId: string): Promise<string[]> {
  const sessions = await prisma.session.findMany({
    where: { batchId, status: { in: REGISTER_STATUSES } },
    select: { scheduledDate: true },
  });

  const months = new Set(sessions.map((s) => monthKeyOf(s.scheduledDate)));
  return [...months].sort();
}

export interface RegisterCell {
  sessionId: string;
  status: SessionStatus;
}

export interface RegisterRow {
  student: { id: string; firstName: string; lastName: string; photoUrl: string | null };
  cells: Record<string, RegisterCell>;
}

export interface RegisterData {
  dates: string[];
  rows: RegisterRow[];
}

/** Pivots a batch's sessions for one month into a student x date grid. A
 *  student who joined partway through the month simply has no sessions on
 *  the earlier dates — no separate "partial month" logic needed, it falls
 *  out of the underlying Session rows exactly like the rest of the app. */
export async function getRegisterData(batchId: string, monthKey: string): Promise<RegisterData> {
  const [year, month] = monthKey.split("-").map(Number) as [number, number];
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));

  const sessions = await prisma.session.findMany({
    where: {
      batchId,
      status: { in: REGISTER_STATUSES },
      scheduledDate: { gte: monthStart, lte: monthEnd },
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
    orderBy: [{ student: { firstName: "asc" } }, { scheduledDate: "asc" }],
  });

  const dateSet = new Set<string>();
  const rowsByStudent = new Map<string, RegisterRow>();

  for (const session of sessions) {
    const dateKey = session.scheduledDate.toISOString().split("T")[0]!;
    dateSet.add(dateKey);

    let row = rowsByStudent.get(session.studentId);
    if (!row) {
      row = { student: session.student, cells: {} };
      rowsByStudent.set(session.studentId, row);
    }
    row.cells[dateKey] = { sessionId: session.id, status: session.status };
  }

  return {
    dates: [...dateSet].sort(),
    rows: [...rowsByStudent.values()].sort((a, b) => a.student.firstName.localeCompare(b.student.firstName)),
  };
}
