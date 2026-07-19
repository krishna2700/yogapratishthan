"use client";

import { useCallback, useEffect, useState } from "react";
import type { RegisterData } from "../services/attendance-service";

export function useAttendanceRegister(batchId: string, month: string | null) {
  const [data, setData] = useState<RegisterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!month) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const res = await fetch(`/api/attendance/register?batchId=${batchId}&month=${month}`);
    if (res.ok) {
      setData(await res.json());
    }
    setIsLoading(false);
  }, [batchId, month]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, isLoading, reload };
}
