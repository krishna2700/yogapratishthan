import "server-only";
import { prisma, SessionStatus, type AbsenceReason, type Prisma, type Weekday } from "@yogapratishthan/db";
import { generateScheduleDates } from "../lib/schedule";
import { logEvent } from "./event-service";
import { todayUTC } from "@/lib/calendar-date";

type Client = Prisma.TransactionClient | typeof prisma;

interface GenerateSessionsParams {
  studentId: string;
  batchId: string;
  weekdays: Weekday[];
  startTime: string;
  endTime: string;
  count: number;
  startDate?: Date;
}

/** Sessions still owed to the student: not yet attended, absent, or resolved otherwise. */
const REMAINING_STATUSES: SessionStatus[] = [SessionStatus.UPCOMING, SessionStatus.MAKEUP];

/** Thresholds (remaining count) that trigger a one-time "running low" notification. */
const LOW_SESSIONS_THRESHOLDS = [3, 2, 1];

export async function generateSessionsForStudent(client: Client, params: GenerateSessionsParams) {
  const vacations = await client.vacation.findMany();
  const dates = generateScheduleDates(params.startDate ?? todayUTC(), params.weekdays, params.count, vacations);

  await client.session.createMany({
    data: dates.map((scheduledDate) => ({
      studentId: params.studentId,
      batchId: params.batchId,
      scheduledDate,
      startTime: params.startTime,
      endTime: params.endTime,
      status: SessionStatus.UPCOMING,
    })),
  });

  return dates;
}

export interface SessionStats {
  /** Sessions actually purchased (admission + renewals) — fixed, never
   *  inflated by make-up or vacation-reschedule rows. */
  total: number;
  completed: number;
  remaining: number;
  absent: number;
  /** Make-ups that expired unused — permanently unrecoverable against `total`. */
  lost: number;
  isExpired: boolean;
  nextSessionDate: Date | null;
}

async function getPurchasedCount(studentId: string, client: Client): Promise<number> {
  const student = await client.student.findUnique({
    where: { id: studentId },
    select: { numberOfSessions: true, renewals: { select: { numberOfSessions: true } } },
  });
  if (!student) return 0;
  return student.numberOfSessions + student.renewals.reduce((sum, r) => sum + r.numberOfSessions, 0);
}

export async function getSessionStats(studentId: string, client: Client = prisma): Promise<SessionStats> {
  const [purchased, completed, lost, absent, next] = await Promise.all([
    getPurchasedCount(studentId, client),
    client.session.count({ where: { studentId, status: SessionStatus.PRESENT } }),
    client.session.count({ where: { studentId, status: SessionStatus.EXPIRED } }),
    client.session.count({ where: { studentId, status: SessionStatus.ABSENT } }),
    client.session.findFirst({
      where: { studentId, status: { in: REMAINING_STATUSES } },
      orderBy: { scheduledDate: "asc" },
      select: { scheduledDate: true },
    }),
  ]);

  const remaining = Math.max(0, purchased - completed - lost);

  return {
    total: purchased,
    completed,
    remaining,
    absent,
    lost,
    isExpired: remaining === 0,
    nextSessionDate: next?.scheduledDate ?? null,
  };
}

export async function getSessionStatsForStudents(
  studentIds: string[],
  client: Client = prisma,
): Promise<Map<string, SessionStats>> {
  const stats = await Promise.all(studentIds.map(async (id) => [id, await getSessionStats(id, client)] as const));
  return new Map(stats);
}

interface MarkAttendanceParams {
  sessionId: string;
  status: typeof SessionStatus.PRESENT | typeof SessionStatus.ABSENT;
  absenceReason?: AbsenceReason;
  absenceNote?: string;
}

export class SessionNotAttendableError extends Error {}

/**
 * Fires a one-time notification whenever a student's remaining count either
 * hits zero (membership expired) or crosses a "running low" threshold —
 * called after anything that can reduce `remaining` (attendance marked
 * present, a make-up expiring unused). Re-arms after a renewal, since
 * remaining goes back up and the same milestone is worth flagging again
 * next time it's reached.
 */
export async function checkSessionThresholdNotifications(
  studentId: string,
  studentName: string,
  tx: Prisma.TransactionClient,
) {
  const stats = await getSessionStats(studentId, tx);
  const lastRenewal = await tx.renewal.findFirst({ where: { studentId }, orderBy: { createdAt: "desc" } });

  if (stats.isExpired) {
    const alreadyNotified = await tx.event.findFirst({
      where: {
        studentId,
        type: "MEMBERSHIP_EXPIRED",
        ...(lastRenewal ? { createdAt: { gte: lastRenewal.createdAt } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    if (!alreadyNotified) {
      await logEvent(
        {
          studentId,
          type: "MEMBERSHIP_EXPIRED",
          message: `${studentName}'s membership has expired — all sessions used`,
        },
        tx,
      );
    }
    return;
  }

  if (!LOW_SESSIONS_THRESHOLDS.includes(stats.remaining)) return;

  const alreadyNotified = await tx.event.findFirst({
    where: {
      studentId,
      type: "LOW_SESSIONS",
      ...(lastRenewal ? { createdAt: { gte: lastRenewal.createdAt } } : {}),
      metadata: { path: ["remaining"], equals: stats.remaining },
    },
  });
  if (alreadyNotified) return;

  await logEvent(
    {
      studentId,
      type: "LOW_SESSIONS",
      message: `${studentName} has only ${stats.remaining} session${stats.remaining === 1 ? "" : "s"} left`,
      metadata: { remaining: stats.remaining },
    },
    tx,
  );
}

export async function markAttendance(params: MarkAttendanceParams) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { id: params.sessionId },
      include: { student: true },
    });
    if (!session) throw new SessionNotAttendableError("Session not found");
    if (session.status !== SessionStatus.UPCOMING && session.status !== SessionStatus.MAKEUP) {
      throw new SessionNotAttendableError("This session has already been resolved");
    }

    const updated = await tx.session.update({
      where: { id: params.sessionId },
      data: {
        status: params.status,
        absenceReason: params.status === SessionStatus.ABSENT ? (params.absenceReason ?? "UNKNOWN") : null,
        absenceNote: params.status === SessionStatus.ABSENT ? params.absenceNote : null,
      },
    });

    const studentName = `${session.student.firstName} ${session.student.lastName}`;
    await logEvent(
      {
        studentId: session.studentId,
        type: params.status === SessionStatus.PRESENT ? "SESSION_COMPLETED" : "ATTENDANCE_MARKED",
        message:
          params.status === SessionStatus.PRESENT
            ? `${studentName} attended their session`
            : `${studentName} was marked absent${params.absenceReason ? ` (${params.absenceReason.toLowerCase()})` : ""}`,
        metadata: { sessionId: session.id, status: params.status },
      },
      tx,
    );

    await checkSessionThresholdNotifications(session.studentId, studentName, tx);

    return updated;
  });
}
