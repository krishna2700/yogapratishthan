import { NextResponse } from "next/server";
import { z } from "zod";
import { zodValidationError, jsonError } from "@/lib/api-response";
import { markAttendance, SessionNotAttendableError } from "@/features/session-engine/services/session-service";

const attendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT"]),
  absenceReason: z.enum(["SICK", "TRAVEL", "BUSY", "UNKNOWN", "OTHER"]).optional(),
  absenceNote: z.string().trim().max(500).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = await request.json();
  const parsed = attendanceSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  try {
    const session = await markAttendance({ sessionId, ...parsed.data });
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof SessionNotAttendableError) return jsonError(error.message, 422);
    throw error;
  }
}
