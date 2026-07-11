import { NextResponse } from "next/server";
import { z } from "zod";
import { zodValidationError, jsonError } from "@/lib/api-response";
import { addMakeup, MakeupNotAllowedError } from "@/features/session-engine/services/makeup-service";

const makeupSchema = z.object({
  batchId: z.string().min(1),
  date: z.coerce.date(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  reason: z.string().trim().max(500).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = await request.json();
  const parsed = makeupSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  try {
    const makeup = await addMakeup({ originalSessionId: sessionId, ...parsed.data });
    return NextResponse.json({ session: makeup }, { status: 201 });
  } catch (error) {
    if (error instanceof MakeupNotAllowedError) return jsonError(error.message, 422);
    throw error;
  }
}
