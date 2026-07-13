import "server-only";
import { prisma, SessionStatus } from "@yogapratishthan/db";
import { generateSessionsForStudent } from "@/features/session-engine/services/session-service";
import { logEvent } from "@/features/session-engine/services/event-service";
import type { Gender, HealthIssue } from "@yogapratishthan/db";

export class StudentNotFoundError extends Error {}
export class BatchNotFoundError extends Error {}

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
  batchId: string;
}

const OPEN_STATUSES: SessionStatus[] = [SessionStatus.UPCOMING, SessionStatus.MAKEUP];

export async function updateStudent(studentId: string, input: UpdateStudentInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.student.findUnique({ where: { id: studentId } });
    if (!existing) throw new StudentNotFoundError("Student not found");

    const batchChanged = input.batchId !== existing.batchId;
    let newBatch = null;
    if (batchChanged) {
      newBatch = await tx.batch.findUnique({ where: { id: input.batchId } });
      if (!newBatch) throw new BatchNotFoundError("Selected batch no longer exists");
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

    return student;
  });
}
