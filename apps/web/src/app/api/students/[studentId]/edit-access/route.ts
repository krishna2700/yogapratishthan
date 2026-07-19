import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@yogapratishthan/db";
import { jsonError } from "@/lib/api-response";

export async function POST(request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return jsonError("Student not found", 404);

  // Regenerating replaces the token, which invalidates any previously shared link.
  const token = randomUUID();
  await prisma.student.update({ where: { id: studentId }, data: { editAccessToken: token } });

  const origin = new URL(request.url).origin;
  return NextResponse.json({ token, url: `${origin}/edit/${token}` });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return jsonError("Student not found", 404);

  await prisma.student.update({ where: { id: studentId }, data: { editAccessToken: null } });
  return NextResponse.json({ ok: true });
}
