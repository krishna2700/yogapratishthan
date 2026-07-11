import "server-only";
import { prisma, type NoteCategory } from "@yogapratishthan/db";
import { logEvent } from "@/features/session-engine/services/event-service";

export async function listNotes(studentId: string) {
  return prisma.note.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } });
}

interface AddNoteParams {
  studentId: string;
  content: string;
  category: NoteCategory;
}

export async function addNote(params: AddNoteParams) {
  return prisma.$transaction(async (tx) => {
    const note = await tx.note.create({
      data: { studentId: params.studentId, content: params.content, category: params.category },
    });
    await logEvent(
      { studentId: params.studentId, type: "NOTE_ADDED", message: params.content, metadata: { noteId: note.id } },
      tx,
    );
    return note;
  });
}
