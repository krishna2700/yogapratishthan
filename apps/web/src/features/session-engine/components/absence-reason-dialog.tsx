"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldWrapper } from "@/components/form/field-wrapper";
import type { AbsenceReason } from "@yogapratishthan/db";

const REASONS: { value: AbsenceReason; label: string }[] = [
  { value: "SICK", label: "Sick" },
  { value: "TRAVEL", label: "Travel" },
  { value: "BUSY", label: "Busy" },
  { value: "UNKNOWN", label: "Unknown" },
  { value: "OTHER", label: "Other" },
];

interface AbsenceReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: AbsenceReason, note: string) => Promise<void>;
}

export function AbsenceReasonDialog({ open, onOpenChange, onConfirm }: AbsenceReasonDialogProps) {
  const [reason, setReason] = useState<AbsenceReason>("UNKNOWN");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm(reason, note);
      setReason("UNKNOWN");
      setNote("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark absent</DialogTitle>
          <DialogDescription>Optional — helps explain the absence later.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <FieldWrapper label="Reason">
            <Select value={reason} onValueChange={(v) => setReason((v as AbsenceReason) ?? "UNKNOWN")}>
              <SelectTrigger className="w-full">
                <SelectValue>{(value: AbsenceReason) => REASONS.find((r) => r.value === value)?.label ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
          <FieldWrapper htmlFor="absence-note" label="Note">
            <Textarea
              id="absence-note"
              rows={2}
              placeholder="Optional details"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FieldWrapper>
        </div>
        <DialogFooter>
          <Button variant="destructive" disabled={isSubmitting} onClick={handleConfirm}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Confirm absent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
