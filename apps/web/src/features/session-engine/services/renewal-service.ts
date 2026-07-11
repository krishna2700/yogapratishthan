import "server-only";
import { prisma } from "@yogapratishthan/db";
import { generateSessionsForStudent } from "./session-service";
import { logEvent } from "./event-service";
import { addUTCDays, todayUTC } from "@/lib/calendar-date";

export class StudentNotFoundError extends Error {}

interface RenewStudentParams {
  studentId: string;
  paymentReceived: number;
  numberOfSessions: number;
}

/** Generates a fresh batch of sessions continuing straight on from the
 *  student's last scheduled session, rather than resetting to today. */
export async function renewStudent(params: RenewStudentParams) {
  return prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({ where: { id: params.studentId }, include: { batch: true } });
    if (!student) throw new StudentNotFoundError("Student not found");

    const renewal = await tx.renewal.create({
      data: {
        studentId: params.studentId,
        paymentReceived: params.paymentReceived,
        numberOfSessions: params.numberOfSessions,
      },
    });

    const lastSession = await tx.session.findFirst({
      where: { studentId: params.studentId },
      orderBy: { scheduledDate: "desc" },
    });
    const startDate = lastSession ? addUTCDays(lastSession.scheduledDate, 1) : todayUTC();

    await generateSessionsForStudent(tx, {
      studentId: params.studentId,
      batchId: student.batchId,
      weekdays: student.batch.weekdays,
      startTime: student.batch.startTime,
      endTime: student.batch.endTime,
      count: params.numberOfSessions,
      startDate,
    });

    await logEvent(
      {
        studentId: params.studentId,
        type: "RENEWAL",
        message: `${student.firstName} ${student.lastName} renewed ${params.numberOfSessions} sessions (₹${params.paymentReceived})`,
        metadata: { renewalId: renewal.id, numberOfSessions: params.numberOfSessions },
      },
      tx,
    );

    return renewal;
  });
}
