import "server-only";
import { prisma, SessionStatus, type Prisma } from "@yogapratishthan/db";
import { generateSessionsForStudent } from "@/features/session-engine/services/session-service";
import { logEvent } from "@/features/session-engine/services/event-service";
import { addUTCDays, todayUTC } from "@/lib/calendar-date";
import type { Gender, HealthIssue, Weekday } from "@yogapratishthan/db";

export class StudentNotFoundError extends Error {}
export class BatchNotFoundError extends Error {}
export class SessionCountTooLowError extends Error {}

export interface UpdateStudentInput {
  firstName: string;
  lastName: string;
  dob?: Date;
  gender?: Gender;
  mobileNumber?: string;
  whatsappNumber?: string;
  photoUrl?: string;
  healthIssues: HealthIssue[];
  healthIssueDetails?: string;
  joiningDate?: Date;
  paymentReceived?: number;
  numberOfSessions?: number;
  batchId: string;
}

const OPEN_STATUSES: SessionStatus[] = [SessionStatus.UPCOMING, SessionStatus.MAKEUP];

/**
 * Grows or shrinks a student's generated schedule to match a new
 * numberOfSessions, in whichever batch is current at the time this runs.
 * Growing just appends more sessions after the last scheduled one (like a
 * renewal). Shrinking only removes still-untouched trailing UPCOMING/MAKEUP
 * sessions — never ones already attended, absent, or already someone else's
 * make-up target — and throws if there aren't enough of those to reach the
 * requested count, so history is never silently discarded.
 */
async function reconcileSessionCount(
  tx: Prisma.TransactionClient,
  params: {
    studentId: string;
    batchId: string;
    weekdays: Weekday[];
    startTime: string;
    endTime: string;
    oldCount: number;
    newCount: number;
  },
) {
  const diff = params.newCount - params.oldCount;
  if (diff === 0) return;

  if (diff > 0) {
    const lastSession = await tx.session.findFirst({
      where: { studentId: params.studentId },
      orderBy: { scheduledDate: "desc" },
    });
    await generateSessionsForStudent(tx, {
      studentId: params.studentId,
      batchId: params.batchId,
      weekdays: params.weekdays,
      startTime: params.startTime,
      endTime: params.endTime,
      count: diff,
      startDate: lastSession ? addUTCDays(lastSession.scheduledDate, 1) : todayUTC(),
    });
    return;
  }

  const toRemove = -diff;
  const candidates = await tx.session.findMany({
    where: { studentId: params.studentId, status: { in: OPEN_STATUSES } },
    orderBy: { scheduledDate: "desc" },
    include: { makeupSessions: { select: { id: true } } },
  });
  const removable = candidates.filter((s) => s.makeupSessions.length === 0).slice(0, toRemove);

  if (removable.length < toRemove) {
    throw new SessionCountTooLowError(
      `Can only reduce by ${removable.length} session${removable.length === 1 ? "" : "s"} — the rest are already attended, absent, or have a make-up attached.`,
    );
  }

  await tx.session.deleteMany({ where: { id: { in: removable.map((s) => s.id) } } });
}

export async function updateStudent(studentId: string, input: UpdateStudentInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.student.findUnique({ where: { id: studentId }, include: { batch: true } });
    if (!existing) throw new StudentNotFoundError("Student not found");

    const batchChanged = input.batchId !== existing.batchId;
    let newBatch = null;
    if (batchChanged) {
      newBatch = await tx.batch.findUnique({ where: { id: input.batchId } });
      if (!newBatch) throw new BatchNotFoundError("Selected batch no longer exists");
    }

    const oldCount = existing.numberOfSessions ?? 0;
    const newCount = input.numberOfSessions ?? 0;
    const countChanged = newCount !== oldCount;

    // Reconcile the count first, in the *current* batch — so if the batch is
    // also changing this same save, the batch-change step below carries the
    // already-correct number of open sessions over to the new batch.
    if (countChanged) {
      await reconcileSessionCount(tx, {
        studentId,
        batchId: existing.batch.id,
        weekdays: existing.batch.weekdays,
        startTime: existing.batch.startTime,
        endTime: existing.batch.endTime,
        oldCount,
        newCount,
      });
    }

    const student = await tx.student.update({
      where: { id: studentId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        dob: input.dob ?? null,
        gender: input.gender ?? null,
        mobileNumber: input.mobileNumber ?? null,
        whatsappNumber: input.whatsappNumber || null,
        photoUrl: input.photoUrl,
        healthIssues: input.healthIssues,
        healthIssueDetails: input.healthIssueDetails || null,
        joiningDate: input.joiningDate ?? existing.joiningDate,
        paymentReceived: input.paymentReceived ?? existing.paymentReceived,
        numberOfSessions: input.numberOfSessions ?? existing.numberOfSessions,
        batchId: input.batchId,
      },
      include: { batch: true },
    });

    if (batchChanged && newBatch) {
      const remainingCount = await tx.session.count({
        where: { studentId, status: { in: OPEN_STATUSES } },
      });

      await tx.session.updateMany({
        where: { studentId, status: { in: OPEN_STATUSES } },
        data: { status: SessionStatus.CANCELLED },
      });

      if (remainingCount > 0) {
        await generateSessionsForStudent(tx, {
          studentId,
          batchId: newBatch.id,
          weekdays: newBatch.weekdays,
          startTime: newBatch.startTime,
          endTime: newBatch.endTime,
          count: remainingCount,
        });
      }

      await logEvent(
        {
          studentId,
          type: "BATCH_CHANGED",
          message: `${student.firstName} ${student.lastName} moved to ${newBatch.name}`,
          metadata: { fromBatchId: existing.batchId, toBatchId: newBatch.id },
        },
        tx,
      );
    }

    if (countChanged) {
      await logEvent(
        {
          studentId,
          type: "RENEWAL",
          message:
            newCount > oldCount
              ? `${student.firstName} ${student.lastName}'s session count increased to ${newCount} (+${newCount - oldCount})`
              : `${student.firstName} ${student.lastName}'s session count reduced to ${newCount} (-${oldCount - newCount})`,
          metadata: { oldCount, newCount },
        },
        tx,
      );
    }

    return student;
  });
}
