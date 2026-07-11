"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarOff, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VacationFormFields } from "./vacation-form-fields";

export function CreateVacationDialog({ onSuccess }: { onSuccess: () => void }) {
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
      const res = await fetch("/api/vacations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create vacation");
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
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Add vacation
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add vacation</DialogTitle>
          <DialogDescription>
            Every affected session is automatically rescheduled to the next valid class — no student loses a
            session.
          </DialogDescription>
        </DialogHeader>
        <VacationFormFields
          idPrefix="vac-new"
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
