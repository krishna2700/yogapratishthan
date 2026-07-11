"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldWrapper } from "@/components/form/field-wrapper";

interface RenewDialogProps {
  studentId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RenewDialog({ studentId, onOpenChange, onSuccess }: RenewDialogProps) {
  const [paymentReceived, setPaymentReceived] = useState("");
  const [numberOfSessions, setNumberOfSessions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPaymentReceived("");
    setNumberOfSessions("");
    setError(null);
  }

  async function handleSubmit() {
    if (!studentId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReceived, numberOfSessions }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not renew sessions");
      }
      toast.success(`${numberOfSessions} sessions renewed`);
      reset();
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
      open={studentId !== null}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renew sessions</DialogTitle>
          <DialogDescription>
            Adds a fresh batch of sessions continuing straight on from the student&apos;s current schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <FieldWrapper htmlFor="renew-payment" label="Payment received (₹)" required>
            <Input
              id="renew-payment"
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 3000"
              value={paymentReceived}
              onChange={(e) => setPaymentReceived(e.target.value)}
            />
          </FieldWrapper>
          <FieldWrapper htmlFor="renew-sessions" label="Number of sessions" required>
            <Input
              id="renew-sessions"
              type="number"
              min={1}
              step="1"
              placeholder="e.g. 12"
              value={numberOfSessions}
              onChange={(e) => setNumberOfSessions(e.target.value)}
            />
          </FieldWrapper>
          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            disabled={isSubmitting || !paymentReceived || !numberOfSessions}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Repeat className="size-4" />}
            Renew
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
