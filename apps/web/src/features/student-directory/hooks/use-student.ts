"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudentDirectoryEntry } from "../services/student-directory-service";

export function useStudent(studentId: string) {
  const [student, setStudent] = useState<StudentDirectoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(`/api/students/${studentId}`);
    if (res.status === 404) {
      setNotFound(true);
    } else if (res.ok) {
      const data: { student: StudentDirectoryEntry } = await res.json();
      setStudent(data.student);
    }
    setIsLoading(false);
  }, [studentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { student, isLoading, notFound, reload };
}
