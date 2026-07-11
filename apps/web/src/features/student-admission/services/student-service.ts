import "server-only";
import { prisma } from "@yogapratishthan/db";
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

  return prisma.student.create({
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
      paymentReceived: input.paymentReceived,
      numberOfSessions: input.numberOfSessions,
      batchId: input.batchId,
    },
    include: { batch: true },
  });
}
