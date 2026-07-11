"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { initialsOf } from "@/features/student-directory/lib/format";
import { AbsenceReasonDialog } from "@/features/session-engine/components/absence-reason-dialog";
import { useTodaysSessions, type TodaySession } from "../hooks/use-todays-sessions";
import type { AbsenceReason } from "@yogapratishthan/db";

function minutesSinceMidnight(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function closestBatchId(groups: Map<string, TodaySession[]>): string | null {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let closest: { id: string; diff: number } | null = null;

  for (const [batchId, sessions] of groups) {
    const start = minutesSinceMidnight(sessions[0]!.startTime);
    const diff = Math.abs(start - nowMinutes);
    if (!closest || diff < closest.diff) closest = { id: batchId, diff };
  }
  return closest?.id ?? null;
}

export function AttendanceView() {
  const { sessions, isLoading, reload } = useTodaysSessions();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [absenceDialogSessionId, setAbsenceDialogSessionId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, TodaySession[]>();
    for (const session of sessions) {
      const list = map.get(session.batchId) ?? [];
      list.push(session);
      map.set(session.batchId, list);
    }
    return map;
  }, [sessions]);

  const activeBatchId = selectedBatchId ?? closestBatchId(groups);
  const activeSessions = activeBatchId ? (groups.get(activeBatchId) ?? []) : [];
  const activeBatch = activeSessions[0]?.batch;

  async function markPresent(sessionId: string) {
    setPendingId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PRESENT" }),
      });
      if (!res.ok) throw new Error();
      reload();
    } catch {
      toast.error("Could not mark attendance");
    } finally {
      setPendingId(null);
    }
  }

  async function markAbsent(sessionId: string, reason: AbsenceReason, note: string) {
    setPendingId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ABSENT", absenceReason: reason, absenceNote: note || undefined }),
      });
      if (!res.ok) throw new Error();
      setAbsenceDialogSessionId(null);
      reload();
    } catch {
      toast.error("Could not mark attendance");
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (groups.size === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-20 text-center">
        <Users className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">No classes today</p>
        <p className="text-sm text-muted-foreground">Nothing scheduled for today&apos;s date.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.size > 1 && (
        <div className="flex flex-wrap gap-2">
          {[...groups.entries()].map(([batchId, batchSessions]) => (
            <Button
              key={batchId}
              size="sm"
              variant={activeBatchId === batchId ? "default" : "outline"}
              onClick={() => setSelectedBatchId(batchId)}
            >
              {batchSessions[0]!.batch.name} · {batchSessions[0]!.startTime}
            </Button>
          ))}
        </div>
      )}

      {activeBatch && (
        <p className="text-sm text-muted-foreground">
          {activeBatch.name} · {activeBatch.startTime}–{activeBatch.endTime} · {activeSessions.length} student
          {activeSessions.length === 1 ? "" : "s"}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeSessions.map((session) => {
          const isPending = pendingId === session.id;
          const isResolved = session.status === "PRESENT" || session.status === "ABSENT";

          return (
            <div
              key={session.id}
              className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-5 text-center shadow-sm"
            >
              <Avatar size="lg" className="size-16">
                <AvatarImage src={session.student.photoUrl ?? undefined} alt={session.student.firstName} />
                <AvatarFallback className="text-base">
                  {initialsOf(session.student.firstName, session.student.lastName)}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold text-foreground">
                {session.student.firstName} {session.student.lastName}
              </p>

              {isResolved ? (
                <Badge variant={session.status === "PRESENT" ? "default" : "destructive"}>
                  {session.status === "PRESENT" ? "Present" : "Absent"}
                </Badge>
              ) : (
                <div className="flex w-full gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => markPresent(session.id)}
                  >
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Present
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => setAbsenceDialogSessionId(session.id)}
                  >
                    <X className="size-4" />
                    Absent
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AbsenceReasonDialog
        open={absenceDialogSessionId !== null}
        onOpenChange={(open) => !open && setAbsenceDialogSessionId(null)}
        onConfirm={(reason, note) => markAbsent(absenceDialogSessionId!, reason, note)}
      />
    </div>
  );
}
