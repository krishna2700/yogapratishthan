import "server-only";
import { prisma } from "@yogapratishthan/db";
import { logEvent } from "@/features/session-engine/services/event-service";
import type { CreateAdmissionRequestInput } from "@/features/admission-requests/schema";

export class EditLinkInvalidError extends Error {}

/**
 * Fields a student can touch through their self-edit link. Deliberately the
 * same shape as the public /apply form — batch, admission details, and
 * sessions are never reachable here regardless of what a client sends.
 */
export async function getStudentByEditToken(token: string) {
  const student = await prisma.student.findUnique({ where: { editAccessToken: token } });
  if (!student) throw new EditLinkInvalidError("This link is no longer active");
  return student;
}

export async function updateStudentByEditToken(token: string, input: CreateAdmissionRequestInput) {
  const student = await prisma.student.findUnique({ where: { editAccessToken: token } });
  if (!student) throw new EditLinkInvalidError("This link is no longer active");

  const updated = await prisma.student.update({
    where: { id: student.id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      dob: input.dob,
      gender: input.gender,
      mobileNumber: input.mobileNumber,
      whatsappNumber: input.whatsappNumber,
      photoUrl: input.photoUrl ?? student.photoUrl,
      healthIssues: input.healthIssues,
      healthIssueDetails: input.healthIssueDetails?.trim() || null,
      aadharUrl: input.aadharUrl ?? student.aadharUrl,
    },
  });

  await logEvent({
    studentId: student.id,
    type: "STUDENT_SELF_EDITED",
    message: `${updated.firstName} ${updated.lastName} updated their own details`,
  });

  return updated;
}
