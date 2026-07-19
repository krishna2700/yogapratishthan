import { NextResponse } from "next/server";
import { zodValidationError } from "@/lib/api-response";
import { vacationSchema } from "@/features/vacations/schema";
import { createStudentVacation, listStudentVacations } from "@/features/student-directory/services/student-vacation-service";

export async function GET(_request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const vacations = await listStudentVacations(studentId);
  return NextResponse.json({ vacations });
}

export async function POST(request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const body = await request.json();
  const parsed = vacationSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  const result = await createStudentVacation(studentId, parsed.data);
  return NextResponse.json(result, { status: 201 });
}
