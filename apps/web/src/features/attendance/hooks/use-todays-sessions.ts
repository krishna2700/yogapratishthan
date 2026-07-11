"use client";

import { useCallback, useEffect, useState } from "react";
import type { Batch, Session, Student } from "@yogapratishthan/db";

export type TodaySession = Session & { student: Student; batch: Batch };

export function useTodaysSessions() {
  const [sessions, setSessions] = useState<TodaySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch("/api/attendance/today");
    if (res.ok) {
      const data: { sessions: TodaySession[] } = await res.json();
      setSessions(data.sessions);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { sessions, isLoading, reload };
}
