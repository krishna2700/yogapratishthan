import { NextResponse } from "next/server";
import { jsonError, zodValidationError } from "@/lib/api-response";
import { createAdmissionRequestSchema } from "@/features/admission-requests/schema";
import {
  EditLinkInvalidError,
  getStudentByEditToken,
  updateStudentByEditToken,
} from "@/features/student-directory/services/self-edit-service";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const student = await getStudentByEditToken(token);
    return NextResponse.json({ student });
  } catch (error) {
    if (error instanceof EditLinkInvalidError) return jsonError(error.message, 404);
    throw error;
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json();
  const parsed = createAdmissionRequestSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  try {
    const student = await updateStudentByEditToken(token, parsed.data);
    return NextResponse.json({ student });
  } catch (error) {
    if (error instanceof EditLinkInvalidError) return jsonError(error.message, 404);
    throw error;
  }
}
