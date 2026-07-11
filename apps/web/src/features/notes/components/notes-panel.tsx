"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Loader2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NOTE_CATEGORIES } from "../schema";
import type { Note, NoteCategory } from "@yogapratishthan/db";

export function NotesPanel({ studentId }: { studentId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory>("GENERAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/students/${studentId}/notes`)
      .then((res) => res.json())
      .then((data: { notes: Note[] }) => setNotes(data.notes))
      .finally(() => setIsLoading(false));
  }, [studentId]);

  async function handleAdd() {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/students/${studentId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, category }),
      });
      if (!res.ok) throw new Error("Could not add note");
      const data: { note: Note } = await res.json();
      setNotes((prev) => [data.note, ...prev]);
      setContent("");
      setCategory("GENERAL");
    } catch {
      toast.error("Could not add note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Textarea placeholder="Add a note…" rows={2} value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={(v) => setCategory((v as NoteCategory) ?? "GENERAL")}>
            <SelectTrigger size="sm" className="flex-1">
              <SelectValue>
                {(value: NoteCategory) => NOTE_CATEGORIES.find((c) => c.value === value)?.label ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {NOTE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!content.trim() || isSubmitting} onClick={handleAdd}>
            {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <StickyNote className="size-3.5" />}
            Add
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="flex flex-col gap-1 border-b border-border/60 pb-3 last:border-0">
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {NOTE_CATEGORIES.find((c) => c.value === note.category)?.label ?? note.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-foreground">{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
