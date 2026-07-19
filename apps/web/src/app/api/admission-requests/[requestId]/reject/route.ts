import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import {
  AdmissionRequestAlreadyResolvedError,
  AdmissionRequestNotFoundError,
  rejectAdmissionRequest,
} from "@/features/admission-requests/services/admission-request-service";

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const body: { reviewNote?: string } = await request.json().catch(() => ({}));

  try {
    const admissionRequest = await rejectAdmissionRequest(requestId, body.reviewNote);
    return NextResponse.json({ admissionRequest });
  } catch (error) {
    if (error instanceof AdmissionRequestNotFoundError) return jsonError(error.message, 404);
    if (error instanceof AdmissionRequestAlreadyResolvedError) return jsonError(error.message, 409);
    throw error;
  }
}
