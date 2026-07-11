import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonError(message: string, status: number, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json({ error: message, fieldErrors }, { status });
}

export function zodValidationError(error: ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return jsonError("Please fix the highlighted fields", 422, fieldErrors);
}
