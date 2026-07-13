import "server-only";
import { prisma } from "@yogapratishthan/db";
import { generateSessionsForStudent } from "@/features/session-engine/services/session-service";
import { logEvent } from "@/features/session-engine/services/event-service";
import type { CreateStudentInput } from "../schema";

export class BatchNotFoundError extends Error {
  constructor(batchId: string) {
    super(`Batch "${batchId}" does not exist`);
    this.name = "BatchNotFoundError";
  }
}

export async function createStudent(input: CreateStudentInput) {
  const batch = await prisma.batch.findUnique({ where: { id: input.batchId } });
  if (!batch) {
    throw new BatchNotFoundError(input.batchId);
  }

  const whatsappNumber = input.whatsappNumber?.trim() || null;
  const healthIssueDetails = input.healthIssueDetails?.trim() || null;

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        dob: input.dob,
        gender: input.gender,
        mobileNumber: input.mobileNumber,
        whatsappNumber,
        photoUrl: input.photoUrl,
        healthIssues: input.healthIssues,
        healthIssueDetails,
        joiningDate: input.joiningDate,
        paymentReceived: input.paymentReceived,
        numberOfSessions: input.numberOfSessions,
        batchId: input.batchId,
      },
      include: { batch: true },
    });

    // No session count yet (e.g. payment/schedule not decided at admission
    // time) — skip schedule generation entirely; sessions can be added
    // later via a renewal once that's known.
    if (input.numberOfSessions) {
      await generateSessionsForStudent(tx, {
        studentId: student.id,
        batchId: batch.id,
        weekdays: batch.weekdays,
        startTime: batch.startTime,
        endTime: batch.endTime,
        count: input.numberOfSessions,
        startDate: input.joiningDate,
      });
    }

    await logEvent(
      {
        studentId: student.id,
        type: "ADMISSION",
        message: `${student.firstName} ${student.lastName} was admitted to ${batch.name}`,
        metadata: { numberOfSessions: input.numberOfSessions, paymentReceived: input.paymentReceived },
      },
      tx,
    );

    return student;
  });
}
