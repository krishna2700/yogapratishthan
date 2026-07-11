"use client";

import { useCallback, useEffect, useState } from "react";
import type { Event, Student } from "@yogapratishthan/db";

export type EventWithStudent = Event & {
  student: Pick<Student, "id" | "firstName" | "lastName" | "photoUrl"> | null;
};

export function useEvents(params: { limit?: number; studentId?: string; activeOnly?: boolean } = {}) {
  const [events, setEvents] = useState<EventWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.activeOnly) query.set("activeOnly", "true");
    const res = await fetch(`/api/events?${query.toString()}`);
    if (res.ok) {
      const data: { events: EventWithStudent[] } = await res.json();
      setEvents(data.events);
    }
    setIsLoading(false);
  }, [params.limit, params.studentId, params.activeOnly]);

  useEffect(() => {
    reload();
  }, [reload]);

  const unreadCount = events.filter((e) => !e.isRead).length;

  async function markRead(eventId: string) {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, isRead: true } : e)));
    await fetch(`/api/events/${eventId}/read`, { method: "POST" });
  }

  async function markAllRead() {
    setEvents((prev) => prev.map((e) => ({ ...e, isRead: true })));
    await fetch("/api/events/mark-all-read", { method: "POST" });
  }

  async function clearEvent(eventId: string) {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    await fetch(`/api/events/${eventId}/clear`, { method: "POST" });
  }

  async function clearAll() {
    setEvents([]);
    await fetch("/api/events/clear-all", { method: "POST" });
  }

  return { events, isLoading, unreadCount, reload, markRead, markAllRead, clearEvent, clearAll };
}
