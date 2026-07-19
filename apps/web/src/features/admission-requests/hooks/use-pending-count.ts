"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 60_000;

export function usePendingAdmissionRequestsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/admission-requests?status=PENDING");
      if (!res.ok || cancelled) return;
      const data: { requests: unknown[] } = await res.json();
      if (!cancelled) setCount(data.requests.length);
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return count;
}
