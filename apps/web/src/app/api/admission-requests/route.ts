import { NextResponse } from "next/server";
import { AdmissionRequestStatus } from "@yogapratishthan/db";
import { zodValidationError } from "@/lib/api-response";
import { createAdmissionRequestSchema } from "@/features/admission-requests/schema";
import { createAdmissionRequest, listAdmissionRequests } from "@/features/admission-requests/services/admission-request-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = (searchParams.get("status") ?? "PENDING").toUpperCase();
  const status = AdmissionRequestStatus[statusParam as keyof typeof AdmissionRequestStatus] ?? AdmissionRequestStatus.PENDING;

  const requests = await listAdmissionRequests(status);
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createAdmissionRequestSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  const admissionRequest = await createAdmissionRequest(parsed.data);
  return NextResponse.json({ admissionRequest }, { status: 201 });
}
