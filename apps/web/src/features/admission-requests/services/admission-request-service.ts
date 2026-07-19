import "server-only";
import { prisma, AdmissionRequestStatus } from "@yogapratishthan/db";
import { createStudent, BatchNotFoundError } from "@/features/student-admission/services/student-service";
import { logEvent } from "@/features/session-engine/services/event-service";
import type { CreateAdmissionRequestInput } from "../schema";

export class AdmissionRequestNotFoundError extends Error {}
export class AdmissionRequestAlreadyResolvedError extends Error {}
export { BatchNotFoundError };

export async function createAdmissionRequest(input: CreateAdmissionRequestInput) {
  const request = await prisma.admissionRequest.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      dob: input.dob,
      gender: input.gender,
      mobileNumber: input.mobileNumber,
      whatsappNumber: input.whatsappNumber,
      photoUrl: input.photoUrl,
      aadharUrl: input.aadharUrl,
      healthIssues: input.healthIssues,
      healthIssueDetails: input.healthIssueDetails?.trim() || null,
    },
  });

  await logEvent({
    type: "ADMISSION_REQUEST_RECEIVED",
    message: `${request.firstName} ${request.lastName} submitted an admission request`,
    metadata: { admissionRequestId: request.id },
  });

  return request;
}

export async function listAdmissionRequests(status: AdmissionRequestStatus) {
  return prisma.admissionRequest.findMany({
    where: { status },
    orderBy: { createdAt: status === AdmissionRequestStatus.PENDING ? "asc" : "desc" },
  });
}

export async function countPendingAdmissionRequests() {
  return prisma.admissionRequest.count({ where: { status: AdmissionRequestStatus.PENDING } });
}

export async function getAdmissionRequest(id: string) {
  return prisma.admissionRequest.findUnique({ where: { id } });
}

interface AcceptAdmissionRequestParams {
  batchId: string;
  joiningDate?: Date;
  paymentReceived?: number;
  numberOfSessions?: number;
}

export async function acceptAdmissionRequest(id: string, params: AcceptAdmissionRequestParams) {
  const request = await prisma.admissionRequest.findUnique({ where: { id } });
  if (!request) throw new AdmissionRequestNotFoundError("Admission request not found");
  if (request.status !== AdmissionRequestStatus.PENDING) {
    throw new AdmissionRequestAlreadyResolvedError("This request has already been reviewed");
  }

  const student = await createStudent({
    firstName: request.firstName,
    lastName: request.lastName,
    dob: request.dob,
    gender: request.gender,
    mobileNumber: request.mobileNumber,
    whatsappNumber: request.whatsappNumber,
    photoUrl: request.photoUrl ?? undefined,
    healthIssues: request.healthIssues,
    healthIssueDetails: request.healthIssueDetails ?? undefined,
    joiningDate: params.joiningDate,
    paymentReceived: params.paymentReceived,
    numberOfSessions: params.numberOfSessions,
    batchId: params.batchId,
  });

  if (request.aadharUrl) {
    await prisma.student.update({ where: { id: student.id }, data: { aadharUrl: request.aadharUrl } });
  }

  await prisma.admissionRequest.update({
    where: { id },
    data: { status: AdmissionRequestStatus.ACCEPTED, studentId: student.id },
  });

  return student;
}

export async function rejectAdmissionRequest(id: string, reviewNote?: string) {
  const request = await prisma.admissionRequest.findUnique({ where: { id } });
  if (!request) throw new AdmissionRequestNotFoundError("Admission request not found");
  if (request.status !== AdmissionRequestStatus.PENDING) {
    throw new AdmissionRequestAlreadyResolvedError("This request has already been reviewed");
  }

  return prisma.admissionRequest.update({
    where: { id },
    data: { status: AdmissionRequestStatus.REJECTED, reviewNote: reviewNote || null },
  });
}
