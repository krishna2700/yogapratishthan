"use client";

import { useEffect, useState } from "react";

export function useBatchMonths(batchId: string) {
  const [months, setMonths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/attendance/months?batchId=${batchId}`)
      .then((res) => res.json())
      .then((data: { months: string[] }) => {
        if (!cancelled) setMonths(data.months);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  return { months, isLoading };
}
