import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { getRegisterData } from "@/features/attendance/services/attendance-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");
  const month = searchParams.get("month");
  if (!batchId || !month) return jsonError("batchId and month are required", 400);

  const data = await getRegisterData(batchId, month);
  return NextResponse.json(data);
}
