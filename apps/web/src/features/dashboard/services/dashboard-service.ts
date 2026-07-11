import "server-only";
import { prisma, SessionStatus } from "@yogapratishthan/db";
import { getSessionStatsForStudents } from "@/features/session-engine/services/session-service";
import { addUTCDays, todayUTC } from "@/lib/calendar-date";

const LOW_SESSIONS_THRESHOLD = 2;

export async function getDashboardData() {
  const today = todayUTC();

  const [todaysSessions, presentToday, absentToday, students, pendingMakeups, upcomingVacations, recentAdmissions, recentActivity] =
    await Promise.all([
      prisma.session.findMany({
        where: {
          scheduledDate: today,
          status: { in: [SessionStatus.UPCOMING, SessionStatus.MAKEUP, SessionStatus.PRESENT, SessionStatus.ABSENT] },
        },
        select: { studentId: true },
      }),
      prisma.session.count({ where: { scheduledDate: today, status: SessionStatus.PRESENT } }),
      prisma.session.count({ where: { scheduledDate: today, status: SessionStatus.ABSENT } }),
      prisma.student.findMany({ select: { id: true } }),
      prisma.session.count({ where: { status: SessionStatus.MAKEUP } }),
      prisma.vacation.findMany({
        where: { startDate: { gte: today, lte: addUTCDays(today, 30) } },
        orderBy: { startDate: "asc" },
        take: 5,
      }),
      prisma.student.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { batch: true } }),
      prisma.event.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
      }),
    ]);

  const statsMap = await getSessionStatsForStudents(students.map((s) => s.id));
  let lowSessionsCount = 0;
  let expiredCount = 0;
  for (const stats of statsMap.values()) {
    if (stats.remaining === 0) expiredCount += 1;
    else if (stats.remaining <= LOW_SESSIONS_THRESHOLD) lowSessionsCount += 1;
  }

  const uniqueStudentsToday = new Set(todaysSessions.map((s) => s.studentId)).size;

  return {
    studentsToday: uniqueStudentsToday,
    attendanceToday: { present: presentToday, absent: absentToday, total: todaysSessions.length },
    lowSessionsCount,
    expiredCount,
    pendingMakeups,
    upcomingVacations,
    recentAdmissions,
    recentActivity,
  };
}
