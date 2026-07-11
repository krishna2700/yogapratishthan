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
import type { Vacation } from "@yogapratishthan/db";

interface DeleteVacationDialogProps {
  vacation: Vacation | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteVacationDialog({ vacation, onOpenChange, onDeleted }: DeleteVacationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!vacation) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/vacations/${vacation.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete vacation");
      const data: { revertedCount: number } = await res.json();
      toast.success(
        data.revertedCount > 0
          ? `Vacation removed — ${data.revertedCount} session${data.revertedCount === 1 ? "" : "s"} restored`
          : "Vacation removed",
      );
      onOpenChange(false);
      onDeleted();
    } catch {
      toast.error("Could not delete vacation. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={vacation !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {vacation ? `"${vacation.reason}"` : "vacation"}?</AlertDialogTitle>
          <AlertDialogDescription>
            Sessions still untouched since being rescheduled for this vacation move back to their original date.
            Sessions already attended stay as they are.
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
