import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { ADMIN_SESSION_COOKIE, createSessionToken } from "@/lib/admin-session";

export async function POST(request: Request) {
  const body: { password?: string } = await request.json().catch(() => ({}));

  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return jsonError("Incorrect password", 401);
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
