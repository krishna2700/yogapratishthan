"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteStudentDialogProps {
  student: { id: string; firstName: string; lastName: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteStudentDialog({ student, onOpenChange, onDeleted }: DeleteStudentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!student) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete student");
      toast.success(`${student.firstName} ${student.lastName} was deleted`);
      onOpenChange(false);
      onDeleted();
    } catch {
      toast.error("Could not delete student. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={student !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {student ? `${student.firstName} ${student.lastName}` : "student"}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes their profile, sessions, notes, and activity history. This can&apos;t be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
