import { NextResponse } from "next/server";
import { z } from "zod";
import { zodValidationError } from "@/lib/api-response";
import { renewStudent, StudentNotFoundError } from "@/features/session-engine/services/renewal-service";
import { jsonError } from "@/lib/api-response";

const renewSchema = z.object({
  paymentReceived: z.coerce.number().positive("Payment received must be greater than ₹0"),
  numberOfSessions: z.coerce.number().int().positive("Number of sessions must be greater than 0"),
});

export async function POST(request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const body = await request.json();
  const parsed = renewSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  try {
    const renewal = await renewStudent({ studentId, ...parsed.data });
    return NextResponse.json({ renewal }, { status: 201 });
  } catch (error) {
    if (error instanceof StudentNotFoundError) return jsonError(error.message, 404);
    throw error;
  }
}
