import { NextResponse } from "next/server";
import { prisma } from "@yogapratishthan/db";

export async function GET(_request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const sessions = await prisma.session.findMany({
    where: { studentId },
    include: { batch: true, makeupSessions: { select: { id: true, status: true } } },
    orderBy: { scheduledDate: "asc" },
  });
  return NextResponse.json({ sessions });
}
