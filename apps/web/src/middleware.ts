import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

const PUBLIC_PAGE_PREFIXES = ["/apply", "/edit/", "/login", "/reset-password"];
const PUBLIC_API_EXACT = [
  "/api/auth/login",
  "/api/auth/request-password-reset",
  "/api/auth/reset-password",
  "/api/upload",
  "/api/upload/document",
];
const PUBLIC_API_PREFIXES = ["/api/admission-requests", "/api/edit-access/"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) return true;
  if (PUBLIC_API_EXACT.includes(pathname)) return true;
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // POST /api/admission-requests (public submit) is allowed, but GET (the
  // admin inbox list) is not — same path, method-gated.
  if (pathname === "/api/admission-requests" && request.method !== "POST") {
    return (await isAuthenticated(request)) ? NextResponse.next() : unauthenticated(request);
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  if (await isAuthenticated(request)) return NextResponse.next();
  return unauthenticated(request);
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  return verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

function unauthenticated(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
