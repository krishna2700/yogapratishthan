import { NextResponse } from "next/server";
import { getReminders } from "@/features/reminders/services/reminder-service";

export async function GET() {
  const reminders = await getReminders();
  return NextResponse.json({ reminders });
}
