"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudentDirectoryEntry } from "../services/student-directory-service";

interface UseStudentsParams {
  search?: string;
  batchId?: string;
  status?: "active" | "expired" | "all";
}

export function useStudents(params: UseStudentsParams) {
  const [students, setStudents] = useState<StudentDirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.batchId) query.set("batchId", params.batchId);
    if (params.status) query.set("status", params.status);

    const res = await fetch(`/api/students?${query.toString()}`);
    if (res.ok) {
      const data: { students: StudentDirectoryEntry[] } = await res.json();
      setStudents(data.students);
    }
    setIsLoading(false);
  }, [params.search, params.batchId, params.status]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { students, isLoading, reload };
}
