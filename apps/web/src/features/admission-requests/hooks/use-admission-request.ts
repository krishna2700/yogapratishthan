"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdmissionRequest } from "@yogapratishthan/db";

export function useAdmissionRequest(requestId: string) {
  const [request, setRequest] = useState<AdmissionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(`/api/admission-requests/${requestId}`);
    if (res.status === 404) {
      setNotFound(true);
    } else if (res.ok) {
      const data: { admissionRequest: AdmissionRequest } = await res.json();
      setRequest(data.admissionRequest);
    }
    setIsLoading(false);
  }, [requestId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { request, isLoading, notFound, reload };
}
