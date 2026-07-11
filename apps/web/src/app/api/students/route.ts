import { NextResponse } from "next/server";
import { jsonError, zodValidationError } from "@/lib/api-response";
import { createStudentSchema } from "@/features/student-admission/schema";
import {
  BatchNotFoundError,
  createStudent,
} from "@/features/student-admission/services/student-service";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createStudentSchema.safeParse(body);

  if (!parsed.success) {
    return zodValidationError(parsed.error);
  }

  try {
    const student = await createStudent(parsed.data);
    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    if (error instanceof BatchNotFoundError) {
      return jsonError("Selected batch no longer exists", 422, {
        batchId: [error.message],
      });
    }
    throw error;
  }
}
