"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SESSION_STATUS_DISPLAY } from "../lib/session-display";
import { AbsenceReasonDialog } from "./absence-reason-dialog";
import type { AbsenceReason, Batch, Session } from "@yogapratishthan/db";

type SessionWithBatch = Session & { batch: Batch };

export function SessionsPanel({
  studentId,
  refreshKey,
  onChange,
}: {
  studentId: string;
  refreshKey?: number;
  onChange?: () => void;
}) {
  const [sessions, setSessions] = useState<SessionWithBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [absenceDialogSessionId, setAbsenceDialogSessionId] = useState<string | null>(null);

  function reload() {
    setIsLoading(true);
    fetch(`/api/students/${studentId}/sessions`)
      .then((res) => res.json())
      .then((data: { sessions: SessionWithBatch[] }) => setSessions(data.sessions))
      .finally(() => setIsLoading(false));
  }

  useEffect(reload, [studentId, refreshKey]);

  async function markPresent(sessionId: string) {
    setPendingSessionId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PRESENT" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Marked present");
      reload();
      onChange?.();
    } catch {
      toast.error("Could not mark attendance");
    } finally {
      setPendingSessionId(null);
    }
  }

  async function markAbsent(sessionId: string, reason: AbsenceReason, note: string) {
    setPendingSessionId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ABSENT", absenceReason: reason, absenceNote: note || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success("Marked absent");
      setAbsenceDialogSessionId(null);
      reload();
      onChange?.();
    } catch {
      toast.error("Could not mark attendance");
    } finally {
      setPendingSessionId(null);
    }
  }

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading sessions…</p>;
  }

  if (sessions.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No sessions generated yet.</p>;
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-border/60">
        {sessions.map((session) => {
          const { label, variant } = SESSION_STATUS_DISPLAY[session.status];
          const isActionable = session.status === "UPCOMING" || session.status === "MAKEUP";
          const isPending = pendingSessionId === session.id;

          return (
            <li key={session.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex flex-col">
                <span className="text-sm text-foreground">
                  {format(new Date(session.scheduledDate), "EEE, MMM d yyyy")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {session.batch.name} · {session.startTime}–{session.endTime}
                  {session.isMakeup && " · Make-up"}
                </span>
                {session.absenceReason && (
                  <span className="text-xs text-muted-foreground">
                    Reason: {session.absenceReason.toLowerCase()}
                    {session.absenceNote ? ` — ${session.absenceNote}` : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isActionable && (
                  <>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      aria-label="Mark present"
                      disabled={isPending}
                      onClick={() => markPresent(session.id)}
                    >
                      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      aria-label="Mark absent"
                      disabled={isPending}
                      onClick={() => setAbsenceDialogSessionId(session.id)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </>
                )}
                <Badge variant={variant}>{label}</Badge>
              </div>
            </li>
          );
        })}
      </ul>

      <AbsenceReasonDialog
        open={absenceDialogSessionId !== null}
        onOpenChange={(open) => !open && setAbsenceDialogSessionId(null)}
        onConfirm={(reason, note) => markAbsent(absenceDialogSessionId!, reason, note)}
      />
    </>
  );
}
