"use client";

import { useCallback, useEffect, useState } from "react";
import type { Vacation } from "@yogapratishthan/db";

export function useVacations() {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch("/api/vacations");
    if (res.ok) {
      const data: { vacations: Vacation[] } = await res.json();
      setVacations(data.vacations);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { vacations, isLoading, reload };
}
