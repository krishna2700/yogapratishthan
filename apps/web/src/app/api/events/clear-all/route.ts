import { NextResponse } from "next/server";
import { clearAllEvents } from "@/features/notifications/services/notification-service";

export async function POST() {
  await clearAllEvents();
  return NextResponse.json({ ok: true });
}
