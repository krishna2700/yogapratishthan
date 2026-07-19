"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdmissionRequest, AdmissionRequestStatus } from "@yogapratishthan/db";

export function useAdmissionRequests(status: AdmissionRequestStatus) {
  const [requests, setRequests] = useState<AdmissionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(`/api/admission-requests?status=${status}`);
    if (res.ok) {
      const data: { requests: AdmissionRequest[] } = await res.json();
      setRequests(data.requests);
    }
    setIsLoading(false);
  }, [status]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { requests, isLoading, reload };
}
