import "server-only";
import { prisma } from "@yogapratishthan/db";

interface ListEventsParams {
  studentId?: string;
  unreadOnly?: boolean;
  /** Notification bell only wants events that haven't been cleared. The
   *  student timeline ignores this and always shows the full history. */
  activeOnly?: boolean;
  limit?: number;
}

export async function listEvents(params: ListEventsParams = {}) {
  return prisma.event.findMany({
    where: {
      studentId: params.studentId,
      isRead: params.unreadOnly ? false : undefined,
      clearedAt: params.activeOnly ? null : undefined,
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

export async function countUnreadEvents() {
  return prisma.event.count({ where: { isRead: false, clearedAt: null } });
}

export async function markEventRead(eventId: string) {
  return prisma.event.update({ where: { id: eventId }, data: { isRead: true } });
}

export async function markAllEventsRead() {
  return prisma.event.updateMany({ where: { isRead: false }, data: { isRead: true } });
}

export async function clearEvent(eventId: string) {
  return prisma.event.update({ where: { id: eventId }, data: { clearedAt: new Date() } });
}

export async function clearAllEvents() {
  return prisma.event.updateMany({ where: { clearedAt: null }, data: { clearedAt: new Date() } });
}
