"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useBatches } from "@/features/student-admission/hooks/use-batches";
import type { Session } from "@yogapratishthan/db";

type SessionWithMakeups = Session & { makeupSessions: { id: string; status: string }[] };

interface AddMakeupDialogProps {
  studentId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddMakeupDialog({ studentId, onOpenChange, onSuccess }: AddMakeupDialogProps) {
  const { batches } = useBatches();
  const [absentSessions, setAbsentSessions] = useState<SessionWithMakeups[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/students/${studentId}/sessions`)
      .then((res) => res.json())
      .then((data: { sessions: SessionWithMakeups[] }) => {
        const unresolved = data.sessions.filter(
          (s) => s.status === "ABSENT" && !s.makeupSessions.some((m) => m.status !== "EXPIRED"),
        );
        setAbsentSessions(unresolved);
        setSessionId(unresolved[0]?.id ?? "");
      });
  }, [studentId]);

  const selectedBatch = batches.find((b) => b.id === batchId);

  function reset() {
    setSessionId("");
    setBatchId("");
    setDate("");
    setReason("");
    setError(null);
  }

  async function handleSubmit() {
    if (!sessionId || !batchId || !date || !selectedBatch) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/makeup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          date: new Date(date).toISOString(),
          startTime: selectedBatch.startTime,
          endTime: selectedBatch.endTime,
          reason: reason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not add make-up");
      }
      toast.success("Make-up class scheduled");
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
          <DialogTitle>Add make-up class</DialogTitle>
          <DialogDescription>Valid for 2 months — expires automatically if unused.</DialogDescription>
        </DialogHeader>

        {absentSessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No absences waiting for a make-up right now.
          </p>
        ) : (
          <div className="grid gap-4">
            <FieldWrapper label="Missed session" required>
              <Select value={sessionId} onValueChange={(v) => setSessionId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select the missed session">
                    {(value: string) => {
                      const s = absentSessions.find((session) => session.id === value);
                      return s ? `${format(new Date(s.scheduledDate), "PP")} · ${s.startTime}` : value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {absentSessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {format(new Date(s.scheduledDate), "PP")} · {s.startTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrapper>

            <FieldWrapper htmlFor="makeup-date" label="Make-up date" required>
              <Input id="makeup-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </FieldWrapper>

            <FieldWrapper label="Batch" required>
              <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a batch">
                    {(value: string) => {
                      const b = batches.find((batch) => batch.id === value);
                      return b ? `${b.name} · ${b.startTime}–${b.endTime}` : value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} · {b.startTime}–{b.endTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrapper>

            <FieldWrapper htmlFor="makeup-reason" label="Reason" hint="Optional">
              <Textarea
                id="makeup-reason"
                rows={2}
                placeholder="e.g. Missed due to fever"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </FieldWrapper>

            {error && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {error}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={isSubmitting || absentSessions.length === 0 || !sessionId || !batchId || !date}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
            Schedule make-up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
