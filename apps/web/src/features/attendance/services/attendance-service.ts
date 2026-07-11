import "server-only";
import { prisma, SessionStatus } from "@yogapratishthan/db";
import { todayUTC } from "@/lib/calendar-date";

const RELEVANT_STATUSES: SessionStatus[] = [
  SessionStatus.UPCOMING,
  SessionStatus.MAKEUP,
  SessionStatus.PRESENT,
  SessionStatus.ABSENT,
];

/** Every session scheduled for today, across every batch meeting today. */
export async function getTodaysSessions() {
  return prisma.session.findMany({
    where: {
      scheduledDate: todayUTC(),
      status: { in: RELEVANT_STATUSES },
    },
    include: { student: true, batch: true },
    orderBy: [{ batch: { startTime: "asc" } }, { student: { firstName: "asc" } }],
  });
}
