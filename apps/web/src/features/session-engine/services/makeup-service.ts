import "server-only";
import { addMonths, format } from "date-fns";
import { prisma, SessionStatus } from "@yogapratishthan/db";
import { logEvent } from "./event-service";
import { checkSessionThresholdNotifications } from "./session-service";

export class MakeupNotAllowedError extends Error {}

interface AddMakeupParams {
  originalSessionId: string;
  batchId: string;
  date: Date;
  startTime: string;
  endTime: string;
  reason?: string;
}

export async function addMakeup(params: AddMakeupParams) {
  return prisma.$transaction(async (tx) => {
    const original = await tx.session.findUnique({
      where: { id: params.originalSessionId },
      include: { student: true },
    });
    if (!original) throw new MakeupNotAllowedError("Original session not found");
    if (original.status !== SessionStatus.ABSENT) {
      throw new MakeupNotAllowedError("Make-ups can only be added for a session marked absent");
    }

    const makeupExpiresAt = addMonths(new Date(), 2);

    const makeup = await tx.session.create({
      data: {
        studentId: original.studentId,
        batchId: params.batchId,
        scheduledDate: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
        status: SessionStatus.MAKEUP,
        isMakeup: true,
        originalSessionId: original.id,
        makeupReason: params.reason || null,
        makeupExpiresAt,
      },
    });

    const studentName = `${original.student.firstName} ${original.student.lastName}`;
    await logEvent(
      {
        studentId: original.studentId,
        type: "MAKEUP_ADDED",
        message: `Make-up class scheduled for ${studentName} on ${format(params.date, "PP")}`,
        metadata: { originalSessionId: original.id, makeupSessionId: makeup.id, expiresAt: makeupExpiresAt },
      },
      tx,
    );

    return makeup;
  });
}

/**
 * No cron infra yet, so this runs opportunistically whenever a screen that
 * cares about make-ups loads (dashboard, reminders, student directory) —
 * cheap enough to run on every read, and keeps status eventually consistent
 * without needing a scheduler.
 */
export async function expireStaleMakeups() {
  const stale = await prisma.session.findMany({
    where: { status: SessionStatus.MAKEUP, makeupExpiresAt: { lt: new Date() } },
    include: { student: true },
  });

  for (const session of stale) {
    const studentName = `${session.student.firstName} ${session.student.lastName}`;
    await prisma.$transaction(async (tx) => {
      await tx.session.update({ where: { id: session.id }, data: { status: SessionStatus.EXPIRED } });
      await logEvent(
        {
          studentId: session.studentId,
          type: "MAKEUP_EXPIRED",
          message: `Unused make-up for ${studentName} expired`,
          metadata: { sessionId: session.id },
        },
        tx,
      );
      await checkSessionThresholdNotifications(session.studentId, studentName, tx);
    });
  }

  return stale.length;
}
