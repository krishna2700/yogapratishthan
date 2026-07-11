import { NextResponse } from "next/server";
import { getTodaysSessions } from "@/features/attendance/services/attendance-service";

export async function GET() {
  const sessions = await getTodaysSessions();
  return NextResponse.json({ sessions });
}
