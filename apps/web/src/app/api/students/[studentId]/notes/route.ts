import { NextResponse } from "next/server";
import { zodValidationError } from "@/lib/api-response";
import { addNoteSchema } from "@/features/notes/schema";
import { addNote, listNotes } from "@/features/notes/services/notes-service";
import type { NoteCategory } from "@yogapratishthan/db";

export async function GET(_request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const notes = await listNotes(studentId);
  return NextResponse.json({ notes });
}

export async function POST(request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const body = await request.json();
  const parsed = addNoteSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  const note = await addNote({
    studentId,
    content: parsed.data.content,
    category: parsed.data.category as NoteCategory,
  });
  return NextResponse.json({ note }, { status: 201 });
}
