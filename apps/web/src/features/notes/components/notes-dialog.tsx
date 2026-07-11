"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotesPanel } from "./notes-panel";

interface NotesDialogProps {
  studentId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function NotesDialog({ studentId, onOpenChange }: NotesDialogProps) {
  return (
    <Dialog open={studentId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notes</DialogTitle>
          <DialogDescription>Unlimited notes — health, scheduling, or anything worth remembering.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-96">{studentId && <NotesPanel studentId={studentId} />}</ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
