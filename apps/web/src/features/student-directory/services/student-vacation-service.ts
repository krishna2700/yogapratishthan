import "server-only";
import { format } from "date-fns";
import { prisma, SessionStatus, type Prisma } from "@yogapratishthan/db";
import { findNextValidDate } from "@/features/session-engine/lib/schedule";
import { logEvent } from "@/features/session-engine/services/event-service";

const AFFECTABLE_STATUSES: SessionStatus[] = [SessionStatus.UPCOMING, SessionStatus.MAKEUP];

export class StudentVacationNotFoundError extends Error {}

interface VacationParams {
  startDate: Date;
  endDate: Date;
  reason: string;
}

export async function listStudentVacations(studentId: string) {
  return prisma.studentVacation.findMany({ where: { studentId }, orderBy: { startDate: "desc" } });
}

/**
 * Same mechanism as the center-wide Vacation (mark affected sessions
 * VACATION, generate a replacement on the next valid date) but scoped to
 * one student's sessions only. The reschedule also avoids center-wide
 * closures and this student's other StudentVacation ranges, so it never
 * lands back on a day they're also away for a different reason.
 */
async function applyVacationEffects(
  tx: Prisma.TransactionClient,
  studentId: string,
  vacationId: string,
  startDate: Date,
  endDate: Date,
  reason: string,
): Promise<number> {
  const [centerVacations, otherStudentVacations] = await Promise.all([
    tx.vacation.findMany(),
    tx.studentVacation.findMany({ where: { studentId, id: { not: vacationId } } }),
  ]);
  const blockedRanges = [...centerVacations, ...otherStudentVacations];

  const affected = await tx.session.findMany({
    where: {
      studentId,
      status: { in: AFFECTABLE_STATUSES },
      scheduledDate: { gte: startDate, lte: endDate },
    },
    include: { student: { include: { batch: true } } },
    orderBy: { scheduledDate: "asc" },
  });

  for (const session of affected) {
    await tx.session.update({ where: { id: session.id }, data: { status: SessionStatus.VACATION } });

    const existing = await tx.session.findMany({
      where: { studentId: session.studentId },
      select: { scheduledDate: true },
    });
    const takenDates = new Set(existing.map((s) => s.scheduledDate.toISOString()));

    const nextDate = findNextValidDate(session.scheduledDate, session.student.batch.weekdays, blockedRanges, takenDates);

    const replacement = await tx.session.create({
      data: {
        studentId: session.studentId,
        batchId: session.batchId,
        scheduledDate: nextDate,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.isMakeup ? SessionStatus.MAKEUP : SessionStatus.UPCOMING,
        isMakeup: session.isMakeup,
        originalSessionId: session.id,
        makeupExpiresAt: session.makeupExpiresAt,
      },
    });

    await logEvent(
      {
        studentId: session.studentId,
        type: "VACATION_ADJUSTMENT",
        message: `Session moved from ${format(session.scheduledDate, "PP")} to ${format(nextDate, "PP")} (${reason})`,
        metadata: { originalSessionId: session.id, replacementSessionId: replacement.id, studentVacationId: vacationId },
      },
      tx,
    );
  }

  return affected.length;
}

/** Mirrors the center-wide Vacation's revert logic — see vacation-service.ts for why. */
async function revertVacationEffects(
  tx: Prisma.TransactionClient,
  studentId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const originals = await tx.session.findMany({
    where: { studentId, status: SessionStatus.VACATION, scheduledDate: { gte: startDate, lte: endDate } },
  });

  let revertedCount = 0;
  for (const original of originals) {
    const replacement = await tx.session.findFirst({ where: { originalSessionId: original.id } });
    if (!replacement) continue;
    if (replacement.status !== SessionStatus.UPCOMING && replacement.status !== SessionStatus.MAKEUP) continue;

    await tx.session.delete({ where: { id: replacement.id } });
    await tx.session.update({
      where: { id: original.id },
      data: { status: original.isMakeup ? SessionStatus.MAKEUP : SessionStatus.UPCOMING },
    });
    revertedCount += 1;
  }

  return revertedCount;
}

export async function createStudentVacation(studentId: string, params: VacationParams) {
  return prisma.$transaction(async (tx) => {
    const vacation = await tx.studentVacation.create({
      data: { studentId, startDate: params.startDate, endDate: params.endDate, reason: params.reason },
    });

    const affectedCount = await applyVacationEffects(
      tx,
      studentId,
      vacation.id,
      params.startDate,
      params.endDate,
      params.reason,
    );

    await logEvent(
      {
        studentId,
        type: "VACATION_CREATED",
        message: `Vacation added: ${params.reason} (${format(params.startDate, "PP")} – ${format(params.endDate, "PP")}), ${affectedCount} session${affectedCount === 1 ? "" : "s"} rescheduled`,
        metadata: { studentVacationId: vacation.id, affectedCount },
      },
      tx,
    );

    return { vacation, affectedCount };
  });
}

export async function updateStudentVacation(studentId: string, vacationId: string, params: VacationParams) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.studentVacation.findFirst({ where: { id: vacationId, studentId } });
    if (!existing) throw new StudentVacationNotFoundError("Vacation not found");

    const datesChanged =
      existing.startDate.getTime() !== params.startDate.getTime() ||
      existing.endDate.getTime() !== params.endDate.getTime();

    let revertedCount = 0;
    let affectedCount = 0;

    if (datesChanged) {
      revertedCount = await revertVacationEffects(tx, studentId, existing.startDate, existing.endDate);
    }

    const vacation = await tx.studentVacation.update({
      where: { id: vacationId },
      data: { startDate: params.startDate, endDate: params.endDate, reason: params.reason },
    });

    if (datesChanged) {
      affectedCount = await applyVacationEffects(tx, studentId, vacation.id, params.startDate, params.endDate, params.reason);
    }

    await logEvent(
      {
        studentId,
        type: "VACATION_UPDATED",
        message: datesChanged
          ? `Vacation updated: ${params.reason} (${format(params.startDate, "PP")} – ${format(params.endDate, "PP")})`
          : `Vacation updated: ${params.reason}`,
        metadata: { studentVacationId: vacation.id, revertedCount, affectedCount },
      },
      tx,
    );

    return { vacation, revertedCount, affectedCount };
  });
}

export async function deleteStudentVacation(studentId: string, vacationId: string) {
  return prisma.$transaction(async (tx) => {
    const vacation = await tx.studentVacation.findFirst({ where: { id: vacationId, studentId } });
    if (!vacation) throw new StudentVacationNotFoundError("Vacation not found");

    const revertedCount = await revertVacationEffects(tx, studentId, vacation.startDate, vacation.endDate);
    await tx.studentVacation.delete({ where: { id: vacationId } });

    await logEvent(
      {
        studentId,
        type: "VACATION_UPDATED",
        message: `Vacation removed: ${vacation.reason}`,
        metadata: { studentVacationId: vacationId, revertedCount },
      },
      tx,
    );

    return { revertedCount };
  });
}
