import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { getAdmissionRequest } from "@/features/admission-requests/services/admission-request-service";

export async function GET(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const admissionRequest = await getAdmissionRequest(requestId);
  if (!admissionRequest) return jsonError("Admission request not found", 404);
  return NextResponse.json({ admissionRequest });
}
