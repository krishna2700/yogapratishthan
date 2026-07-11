import { NextResponse } from "next/server";
import { clearEvent } from "@/features/notifications/services/notification-service";

export async function POST(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await clearEvent(eventId);
  return NextResponse.json({ event });
}
