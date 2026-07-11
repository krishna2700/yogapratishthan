"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VacationFormFields } from "./vacation-form-fields";
import type { Vacation } from "@yogapratishthan/db";

function toDateInputValue(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0]!;
}

interface EditVacationDialogProps {
  vacation: Vacation | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditVacationDialog({ vacation, onOpenChange, onSuccess }: EditVacationDialogProps) {
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
      const res = await fetch(`/api/vacations/${vacation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not update vacation");
      }
      const data: { revertedCount: number; affectedCount: number } = await res.json();
      toast.success(
        data.affectedCount > 0 || data.revertedCount > 0
          ? `Vacation updated — sessions rescheduled to match`
          : "Vacation updated",
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={vacation !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit vacation</DialogTitle>
          <DialogDescription>
            Changing the dates automatically undoes the old reschedule (where safe) and reapplies it to the new
            range.
          </DialogDescription>
        </DialogHeader>
        <VacationFormFields
          idPrefix="vac-edit"
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
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
