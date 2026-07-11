import { NextResponse } from "next/server";
import { listBatches } from "@/features/student-admission/services/batch-service";

export async function GET() {
  const batches = await listBatches();
  return NextResponse.json({ batches });
}
