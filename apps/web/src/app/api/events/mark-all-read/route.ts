import { NextResponse } from "next/server";
import { markAllEventsRead } from "@/features/notifications/services/notification-service";

export async function POST() {
  await markAllEventsRead();
  return NextResponse.json({ ok: true });
}
