"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  CalendarOff,
  ClipboardCheck,
  Repeat,
  ShieldAlert,
  TrendingDown,
  UserPlus,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_DISPLAY } from "@/features/notifications/lib/event-display";
import { initialsOf } from "@/features/student-directory/lib/format";
import type { EventWithStudent } from "@/features/notifications/hooks/use-events";
import type { Batch, Student, Vacation } from "@yogapratishthan/db";

interface DashboardData {
  studentsToday: number;
  attendanceToday: { present: number; absent: number; total: number };
  lowSessionsCount: number;
  expiredCount: number;
  pendingMakeups: number;
  upcomingVacations: Vacation[];
  recentAdmissions: (Student & { batch: Batch })[];
  recentActivity: EventWithStudent[];
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const widgets = [
    { label: "Students today", value: data.studentsToday, icon: Users, href: "/attendance" },
    {
      label: "Today's attendance",
      value: `${data.attendanceToday.present + data.attendanceToday.absent}/${data.attendanceToday.total}`,
      icon: ClipboardCheck,
      href: "/attendance",
    },
    { label: "Low sessions", value: data.lowSessionsCount, icon: TrendingDown, href: "/reminders" },
    { label: "Expired memberships", value: data.expiredCount, icon: ShieldAlert, href: "/students?status=expired" },
    { label: "Pending make-ups", value: data.pendingMakeups, icon: Repeat, href: "/reminders" },
    { label: "Upcoming vacations", value: data.upcomingVacations.length, icon: CalendarOff, href: "/vacations" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {widgets.map((widget) => (
          <Link
            key={widget.label}
            href={widget.href}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <widget.icon className="size-4.5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{widget.label}</p>
              <p className="text-xl font-semibold text-foreground">{widget.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent admissions</h2>
            <Link href="/students" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {data.recentAdmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students yet.</p>
          ) : (
            <ul className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card p-2 shadow-sm">
              {data.recentAdmissions.map((student) => (
                <li key={student.id}>
                  <Link
                    href={`/students/${student.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <Avatar>
                      <AvatarImage src={student.photoUrl ?? undefined} alt={student.firstName} />
                      <AvatarFallback>{initialsOf(student.firstName, student.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{student.batch.name}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <UserPlus className="size-3" />
                      {formatDistanceToNow(new Date(student.createdAt), { addSuffix: true })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing has happened yet.</p>
          ) : (
            <ul className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card p-2 shadow-sm">
              {data.recentActivity.map((event) => {
                const { icon: Icon } = EVENT_DISPLAY[event.type];
                return (
                  <li key={event.id} className="flex items-start gap-3 rounded-lg p-2">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="size-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{event.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {data.upcomingVacations.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Upcoming center vacations</h2>
          <ul className="flex flex-col gap-2">
            {data.upcomingVacations.map((vacation) => (
              <li
                key={vacation.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3.5 text-sm shadow-sm"
              >
                <span className="font-medium text-foreground">{vacation.reason}</span>
                <span className="text-muted-foreground">
                  {format(new Date(vacation.startDate), "PP")} – {format(new Date(vacation.endDate), "PP")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
