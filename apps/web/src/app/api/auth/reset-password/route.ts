import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import {
  InvalidResetTokenError,
  confirmPasswordReset,
} from "@/features/admin-auth/services/admin-credential-service";

export async function POST(request: Request) {
  const body: { token?: string; password?: string } = await request.json().catch(() => ({}));
  if (!body.token || !body.password) return jsonError("Token and new password are required", 400);
  if (body.password.length < 8) return jsonError("Password must be at least 8 characters", 422);

  try {
    await confirmPasswordReset(body.token, body.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InvalidResetTokenError) return jsonError(error.message, 400);
    throw error;
  }
}
