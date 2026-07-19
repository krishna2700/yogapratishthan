import { NextResponse } from "next/server";
import { jsonError, zodValidationError } from "@/lib/api-response";
import { vacationSchema } from "@/features/vacations/schema";
import {
  StudentVacationNotFoundError,
  deleteStudentVacation,
  updateStudentVacation,
} from "@/features/student-directory/services/student-vacation-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string; vacationId: string }> },
) {
  const { studentId, vacationId } = await params;
  const body = await request.json();
  const parsed = vacationSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  try {
    const result = await updateStudentVacation(studentId, vacationId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StudentVacationNotFoundError) return jsonError(error.message, 404);
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ studentId: string; vacationId: string }> },
) {
  const { studentId, vacationId } = await params;
  try {
    const result = await deleteStudentVacation(studentId, vacationId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StudentVacationNotFoundError) return jsonError(error.message, 404);
    throw error;
  }
}
