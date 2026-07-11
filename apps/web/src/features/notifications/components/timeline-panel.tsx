"use client";

import { format } from "date-fns";
import { useEvents } from "../hooks/use-events";
import { EVENT_DISPLAY } from "../lib/event-display";

export function TimelinePanel({ studentId }: { studentId: string }) {
  const { events, isLoading } = useEvents({ studentId, limit: 200 });

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading timeline…</p>;
  }

  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {events.map((event) => {
        const { label, icon: Icon } = EVENT_DISPLAY[event.type];
        return (
          <li key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-3.5" />
              </div>
              <div className="mt-1 w-px flex-1 bg-border" />
            </div>
            <div className="pb-2">
              <p className="text-xs font-medium text-muted-foreground">
                {format(new Date(event.createdAt), "PPP · p")} · {label}
              </p>
              <p className="text-sm text-foreground">{event.message}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
