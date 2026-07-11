"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SESSION_STATUS_DISPLAY } from "../lib/session-display";
import type { Batch, Session } from "@yogapratishthan/db";

type SessionWithBatch = Session & { batch: Batch };

export function MakeupsPanel({ studentId, refreshKey }: { studentId: string; refreshKey?: number }) {
  const [sessions, setSessions] = useState<SessionWithBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/students/${studentId}/sessions`)
      .then((res) => res.json())
      .then((data: { sessions: SessionWithBatch[] }) => setSessions(data.sessions))
      .finally(() => setIsLoading(false));
  }, [studentId, refreshKey]);

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading make-up classes…</p>;
  }

  const makeups = sessions
    .filter((s) => s.isMakeup)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (makeups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <CalendarPlus className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No make-up classes yet.</p>
      </div>
    );
  }

  const originalById = new Map(sessions.map((s) => [s.id, s]));

  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {makeups.map((makeup, index) => {
        const { label, variant } = SESSION_STATUS_DISPLAY[makeup.status];
        const original = makeup.originalSessionId ? originalById.get(makeup.originalSessionId) : undefined;

        return (
          <li key={makeup.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Make-up {index + 1}</span>
              <span className="text-sm text-foreground">{format(new Date(makeup.scheduledDate), "EEE, MMM d yyyy")}</span>
              <span className="text-xs text-muted-foreground">
                {makeup.batch.name} · {makeup.startTime}–{makeup.endTime}
              </span>
              {original && (
                <span className="text-xs text-muted-foreground">
                  For absence on {format(new Date(original.scheduledDate), "PP")}
                </span>
              )}
              {makeup.makeupReason && (
                <span className="text-xs text-muted-foreground">Reason: {makeup.makeupReason}</span>
              )}
              {makeup.status === "MAKEUP" && makeup.makeupExpiresAt && (
                <span className="text-xs text-muted-foreground">
                  Expires {format(new Date(makeup.makeupExpiresAt), "PP")}
                </span>
              )}
            </div>
            <Badge variant={variant}>{label}</Badge>
          </li>
        );
      })}
    </ul>
  );
}
