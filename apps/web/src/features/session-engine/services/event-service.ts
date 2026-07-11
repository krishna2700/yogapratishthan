import "server-only";
import { prisma, type EventType, type Prisma } from "@yogapratishthan/db";

interface LogEventInput {
  studentId?: string;
  type: EventType;
  message: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Every notable thing that happens in the system goes through here. This is
 * the single seam where a future integration (WhatsApp, email, push) plugs
 * in — react to event creation instead of polling state. For now it just
 * writes the row that powers the student timeline and notification center.
 */
export async function logEvent(
  input: LogEventInput,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  return client.event.create({
    data: {
      studentId: input.studentId,
      type: input.type,
      message: input.message,
      metadata: input.metadata,
    },
  });
}
