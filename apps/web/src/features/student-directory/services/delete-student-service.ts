import "server-only";
import { prisma } from "@yogapratishthan/db";

export class StudentNotFoundError extends Error {}

export async function deleteStudent(studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new StudentNotFoundError("Student not found");

  // Sessions, notes, renewals, and events all cascade via the schema's
  // onDelete: Cascade — deleting the student is enough.
  await prisma.student.delete({ where: { id: studentId } });
}
