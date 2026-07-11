import "server-only";
import { format } from "date-fns";
import { prisma, SessionStatus, type Prisma } from "@yogapratishthan/db";
import { findNextValidDate } from "../lib/schedule";
import { logEvent } from "./event-service";

const AFFECTABLE_STATUSES: SessionStatus[] = [SessionStatus.UPCOMING, SessionStatus.MAKEUP];

export class VacationNotFoundError extends Error {}

interface CreateVacationParams {
  startDate: Date;
  endDate: Date;
  reason: string;
}

interface UpdateVacationParams {
  startDate: Date;
  endDate: Date;
  reason: string;
}

export async function listVacations() {
  return prisma.vacation.findMany({ orderBy: { startDate: "desc" } });
}

/**
 * Marks every session in [startDate, endDate] as VACATION and generates a
 * replacement on the next valid date, so the student never loses a session
 * to a center holiday. Shared by create and by edit-with-date-change.
 */
async function applyVacationEffects(
  tx: Prisma.TransactionClient,
  vacationId: string,
  startDate: Date,
  endDate: Date,
  reason: string,
): Promise<number> {
  const allVacations = await tx.vacation.findMany();

  const affected = await tx.session.findMany({
    where: {
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

    const nextDate = findNextValidDate(session.scheduledDate, session.student.batch.weekdays, allVacations, takenDates);

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
        metadata: { originalSessionId: session.id, replacementSessionId: replacement.id, vacationId },
      },
      tx,
    );
  }

  return affected.length;
}

/**
 * Undoes what a vacation did, for sessions where that's still safe: if the
 * replacement session it generated hasn't been touched (still upcoming),
 * delete the replacement and put the original back to its pre-vacation
 * status. If the replacement was already attended, leave it — rewriting
 * real attendance history is worse than an orphaned reschedule.
 */
async function revertVacationEffects(tx: Prisma.TransactionClient, startDate: Date, endDate: Date): Promise<number> {
  const originals = await tx.session.findMany({
    where: { status: SessionStatus.VACATION, scheduledDate: { gte: startDate, lte: endDate } },
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

export async function createVacation(params: CreateVacationParams) {
  return prisma.$transaction(async (tx) => {
    const vacation = await tx.vacation.create({
      data: { startDate: params.startDate, endDate: params.endDate, reason: params.reason },
    });

    const affectedCount = await applyVacationEffects(tx, vacation.id, params.startDate, params.endDate, params.reason);

    await logEvent(
      {
        type: "VACATION_CREATED",
        message: `Vacation added: ${params.reason} (${format(params.startDate, "PP")} – ${format(params.endDate, "PP")}), ${affectedCount} session${affectedCount === 1 ? "" : "s"} rescheduled`,
        metadata: { vacationId: vacation.id, affectedCount },
      },
      tx,
    );

    return { vacation, affectedCount };
  });
}

export async function updateVacation(vacationId: string, params: UpdateVacationParams) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.vacation.findUnique({ where: { id: vacationId } });
    if (!existing) throw new VacationNotFoundError("Vacation not found");

    const datesChanged =
      existing.startDate.getTime() !== params.startDate.getTime() ||
      existing.endDate.getTime() !== params.endDate.getTime();

    let revertedCount = 0;
    let affectedCount = 0;

    if (datesChanged) {
      revertedCount = await revertVacationEffects(tx, existing.startDate, existing.endDate);
    }

    const vacation = await tx.vacation.update({
      where: { id: vacationId },
      data: { startDate: params.startDate, endDate: params.endDate, reason: params.reason },
    });

    if (datesChanged) {
      affectedCount = await applyVacationEffects(tx, vacation.id, params.startDate, params.endDate, params.reason);
    }

    await logEvent(
      {
        type: "VACATION_UPDATED",
        message: datesChanged
          ? `Vacation updated: ${params.reason} (${format(params.startDate, "PP")} – ${format(params.endDate, "PP")})`
          : `Vacation updated: ${params.reason}`,
        metadata: { vacationId: vacation.id, revertedCount, affectedCount },
      },
      tx,
    );

    return { vacation, revertedCount, affectedCount };
  });
}

export async function deleteVacation(vacationId: string) {
  return prisma.$transaction(async (tx) => {
    const vacation = await tx.vacation.findUnique({ where: { id: vacationId } });
    if (!vacation) throw new VacationNotFoundError("Vacation not found");

    const revertedCount = await revertVacationEffects(tx, vacation.startDate, vacation.endDate);
    await tx.vacation.delete({ where: { id: vacationId } });

    await logEvent(
      {
        type: "VACATION_UPDATED",
        message: `Vacation removed: ${vacation.reason}`,
        metadata: { vacationId, revertedCount },
      },
      tx,
    );

    return { revertedCount };
  });
}
