"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudentVacation } from "@yogapratishthan/db";

export function useStudentVacations(studentId: string) {
  const [vacations, setVacations] = useState<StudentVacation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(`/api/students/${studentId}/vacations`);
    if (res.ok) {
      const data: { vacations: StudentVacation[] } = await res.json();
      setVacations(data.vacations);
    }
    setIsLoading(false);
  }, [studentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { vacations, isLoading, reload };
}
