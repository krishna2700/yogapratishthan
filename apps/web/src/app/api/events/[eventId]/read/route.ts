import { NextResponse } from "next/server";
import { markEventRead } from "@/features/notifications/services/notification-service";

export async function POST(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await markEventRead(eventId);
  return NextResponse.json({ event });
}
