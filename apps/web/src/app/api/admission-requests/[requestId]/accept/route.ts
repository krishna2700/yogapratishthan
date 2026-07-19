import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, zodValidationError } from "@/lib/api-response";
import {
  AdmissionRequestAlreadyResolvedError,
  AdmissionRequestNotFoundError,
  BatchNotFoundError,
  acceptAdmissionRequest,
} from "@/features/admission-requests/services/admission-request-service";
import { blankToUndefined } from "@/features/student-admission/schema";

const acceptSchema = z.object({
  batchId: z.string().min(1, "Please assign a batch"),
  joiningDate: z.preprocess(blankToUndefined, z.coerce.date().optional()),
  paymentReceived: z.preprocess(blankToUndefined, z.coerce.number().positive().optional()),
  numberOfSessions: z.preprocess(blankToUndefined, z.coerce.number().int().positive().optional()),
});

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const body = await request.json();
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  try {
    const student = await acceptAdmissionRequest(requestId, parsed.data);
    return NextResponse.json({ student });
  } catch (error) {
    if (error instanceof AdmissionRequestNotFoundError) return jsonError(error.message, 404);
    if (error instanceof AdmissionRequestAlreadyResolvedError) return jsonError(error.message, 409);
    if (error instanceof BatchNotFoundError) return jsonError("Selected batch no longer exists", 422, { batchId: [error.message] });
    throw error;
  }
}
