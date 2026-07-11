import "server-only";
import { prisma } from "@yogapratishthan/db";
import { logEvent } from "@/features/session-engine/services/event-service";

export async function recordWhatsAppSent(studentId: string, message: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return null;

  return logEvent({
    studentId,
    type: "WHATSAPP_SENT",
    message: `WhatsApp reminder sent to ${student.firstName} ${student.lastName}`,
    metadata: { text: message },
  });
}
