import { NextResponse } from "next/server";
import { listEvents } from "@/features/notifications/services/notification-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId") ?? undefined;
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const activeOnly = searchParams.get("activeOnly") === "true";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const events = await listEvents({ studentId, unreadOnly, activeOnly, limit });
  return NextResponse.json({ events });
}
