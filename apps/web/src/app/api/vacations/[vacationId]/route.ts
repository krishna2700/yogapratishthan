import { NextResponse } from "next/server";
import { jsonError, zodValidationError } from "@/lib/api-response";
import { vacationSchema } from "@/features/vacations/schema";
import {
  deleteVacation,
  updateVacation,
  VacationNotFoundError,
} from "@/features/session-engine/services/vacation-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ vacationId: string }> }) {
  const { vacationId } = await params;
  const body = await request.json();
  const parsed = vacationSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  try {
    const result = await updateVacation(vacationId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof VacationNotFoundError) return jsonError(error.message, 404);
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ vacationId: string }> }) {
  const { vacationId } = await params;
  try {
    const result = await deleteVacation(vacationId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof VacationNotFoundError) return jsonError(error.message, 404);
    throw error;
  }
}
