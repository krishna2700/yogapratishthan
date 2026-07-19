import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { getRegisterMonths } from "@/features/attendance/services/attendance-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");
  if (!batchId) return jsonError("batchId is required", 400);

  const months = await getRegisterMonths(batchId);
  return NextResponse.json({ months });
}
