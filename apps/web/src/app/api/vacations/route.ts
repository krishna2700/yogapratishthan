import { NextResponse } from "next/server";
import { zodValidationError } from "@/lib/api-response";
import { vacationSchema } from "@/features/vacations/schema";
import { createVacation, listVacations } from "@/features/session-engine/services/vacation-service";

export async function GET() {
  const vacations = await listVacations();
  return NextResponse.json({ vacations });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = vacationSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  const result = await createVacation(parsed.data);
  return NextResponse.json(result, { status: 201 });
}
