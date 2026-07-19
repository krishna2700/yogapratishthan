import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/features/admin-auth/services/admin-credential-service";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  // Always returns ok, whether or not an email actually sent — no signal to
  // leak about internal state to an unauthenticated caller.
  try {
    await requestPasswordReset(origin);
  } catch {
    // swallow — see above
  }
  return NextResponse.json({ ok: true });
}
