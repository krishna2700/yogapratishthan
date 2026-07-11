import "server-only";
import { prisma } from "@yogapratishthan/db";
import { getSessionStatsForStudents, type SessionStats } from "@/features/session-engine/services/session-service";

export interface ListStudentsParams {
  search?: string;
  batchId?: string;
  status?: "active" | "expired" | "all";
}

export type StudentDirectoryEntry = Awaited<ReturnType<typeof listStudents>>[number];

export async function listStudents(params: ListStudentsParams = {}) {
  const students = await prisma.student.findMany({
    where: {
      batchId: params.batchId,
      OR: params.search
        ? [
            { firstName: { contains: params.search, mode: "insensitive" } },
            { lastName: { contains: params.search, mode: "insensitive" } },
            { mobileNumber: { contains: params.search } },
          ]
        : undefined,
    },
    include: { batch: true },
    orderBy: { createdAt: "desc" },
  });

  const statsMap = await getSessionStatsForStudents(students.map((s) => s.id));

  const withStats = students.map((student) => {
    const stats = statsMap.get(student.id)!;
    return {
      ...student,
      stats,
      status: stats.isExpired ? ("expired" as const) : ("active" as const),
    };
  });

  if (!params.status || params.status === "all") return withStats;
  return withStats.filter((s) => s.status === params.status);
}

export async function getStudentDirectoryEntry(studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId }, include: { batch: true } });
  if (!student) return null;
  const stats: SessionStats = (await getSessionStatsForStudents([studentId])).get(studentId)!;
  return { ...student, stats, status: stats.isExpired ? ("expired" as const) : ("active" as const) };
}
