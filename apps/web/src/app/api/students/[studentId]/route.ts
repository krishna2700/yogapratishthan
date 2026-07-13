import { NextResponse } from "next/server";
import { jsonError, zodValidationError } from "@/lib/api-response";
import { getStudentDirectoryEntry } from "@/features/student-directory/services/student-directory-service";
import { updateStudentSchema } from "@/features/student-directory/schema";
import {
  BatchNotFoundError,
  SessionCountTooLowError,
  StudentNotFoundError,
  updateStudent,
} from "@/features/student-directory/services/update-student-service";
import {
  deleteStudent,
  StudentNotFoundError as DeleteStudentNotFoundError,
} from "@/features/student-directory/services/delete-student-service";

export async function GET(_request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const student = await getStudentDirectoryEntry(studentId);
  if (!student) return jsonError("Student not found", 404);
  return NextResponse.json({ student });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const body = await request.json();
  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  try {
    const student = await updateStudent(studentId, {
      ...parsed.data,
      whatsappNumber: parsed.data.whatsappNumber || undefined,
      healthIssueDetails: parsed.data.healthIssueDetails || undefined,
    });
    return NextResponse.json({ student });
  } catch (error) {
    if (error instanceof StudentNotFoundError) return jsonError(error.message, 404);
    if (error instanceof BatchNotFoundError) return jsonError(error.message, 422, { batchId: [error.message] });
    if (error instanceof SessionCountTooLowError) {
      return jsonError(error.message, 422, { numberOfSessions: [error.message] });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  try {
    await deleteStudent(studentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DeleteStudentNotFoundError) return jsonError(error.message, 404);
    throw error;
  }
}
