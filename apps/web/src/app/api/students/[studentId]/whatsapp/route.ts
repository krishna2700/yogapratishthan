import { NextResponse } from "next/server";
import { z } from "zod";
import { zodValidationError } from "@/lib/api-response";
import { recordWhatsAppSent } from "@/features/whatsapp/services/whatsapp-service";

const sendSchema = z.object({ message: z.string().trim().min(1).max(2000) });

export async function POST(request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const body = await request.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  await recordWhatsAppSent(studentId, parsed.data.message);
  return NextResponse.json({ ok: true });
}
