"use client";

import { useEffect, useState } from "react";
import type { Batch } from "@yogapratishthan/db";

interface UseBatchesResult {
  batches: Batch[];
  isLoading: boolean;
  error: string | null;
}

export function useBatches(): UseBatchesResult {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/batches");
        if (!res.ok) throw new Error("Failed to load batches");
        const data: { batches: Batch[] } = await res.json();
        if (!cancelled) setBatches(data.batches);
      } catch {
        if (!cancelled) setError("Couldn't load batches. Refresh the page to try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { batches, isLoading, error };
}
