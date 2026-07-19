"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarOff, Loader2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VacationFormFields } from "@/features/vacations/components/vacation-form-fields";
import { useStudentVacations } from "../hooks/use-student-vacations";
import type { StudentVacation } from "@yogapratishthan/db";

function toDateInputValue(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0]!;
}

export function StudentVacationsPanel({ studentId }: { studentId: string }) {
  const { vacations, isLoading, reload } = useStudentVacations(studentId);
  const [editTarget, setEditTarget] = useState<StudentVacation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentVacation | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateDialog studentId={studentId} onSuccess={reload} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : vacations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
          <CalendarOff className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No vacations for this student</p>
          <p className="text-xs text-muted-foreground">
            Add one when they informally request time off — their schedule adjusts automatically.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {vacations.map((vacation) => (
            <li
              key={vacation.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{vacation.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(vacation.startDate), "PP")} – {format(new Date(vacation.endDate), "PP")}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Vacation actions" />}>
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditTarget(vacation)}>
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(vacation)}>
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <EditDialog studentId={studentId} vacation={editTarget} onOpenChange={(open) => !open && setEditTarget(null)} onSuccess={reload} />
      <DeleteDialog
        studentId={studentId}
        vacation={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={reload}
      />
    </div>
  );
}

function CreateDialog({ studentId, onSuccess }: { studentId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStartDate("");
    setEndDate("");
    setReason("");
    setError(null);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/vacations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not add vacation");
      }
      const data: { affectedCount: number } = await res.json();
      toast.success(
        data.affectedCount > 0
          ? `Vacation added — ${data.affectedCount} session${data.affectedCount === 1 ? "" : "s"} rescheduled`
          : "Vacation added",
      );
      reset();
      setOpen(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Add vacation
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add vacation</DialogTitle>
          <DialogDescription>
            Only this student&apos;s sessions in the range are rescheduled — the rest of the batch is unaffected.
          </DialogDescription>
        </DialogHeader>
        <VacationFormFields
          idPrefix="student-vac-new"
          startDate={startDate}
          endDate={endDate}
          reason={reason}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onReasonChange={setReason}
          error={error}
        />
        <DialogFooter>
          <Button disabled={isSubmitting || !startDate || !endDate || !reason} onClick={handleSubmit}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CalendarOff className="size-4" />}
            Add vacation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  studentId,
  vacation,
  onOpenChange,
  onSuccess,
}: {
  studentId: string;
  vacation: StudentVacation | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vacation) return;
    setStartDate(toDateInputValue(vacation.startDate));
    setEndDate(toDateInputValue(vacation.endDate));
    setReason(vacation.reason);
    setError(null);
  }, [vacation]);

  async function handleSubmit() {
    if (!vacation) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/vacations/${vacation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not update vacation");
      }
      toast.success("Vacation updated");
      setStartDate("");
      setEndDate("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={vacation !== null}
      onOpenChange={(open) => {
        if (!open) {
          setStartDate("");
          setEndDate("");
        }
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit vacation</DialogTitle>
        </DialogHeader>
        <VacationFormFields
          idPrefix="student-vac-edit"
          startDate={startDate}
          endDate={endDate}
          reason={reason}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onReasonChange={setReason}
          error={error}
        />
        <DialogFooter>
          <Button disabled={isSubmitting || !startDate || !endDate || !reason} onClick={handleSubmit}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  studentId,
  vacation,
  onOpenChange,
  onDeleted,
}: {
  studentId: string;
  vacation: StudentVacation | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!vacation) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/students/${studentId}/vacations/${vacation.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete vacation");
      toast.success("Vacation removed");
      onOpenChange(false);
      onDeleted();
    } catch {
      toast.error("Could not delete vacation");
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
            Sessions still untouched since being rescheduled move back to their original date. Sessions already
            attended stay as they are.
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
