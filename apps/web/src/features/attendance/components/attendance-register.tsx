"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, Loader2, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/features/student-directory/lib/format";
import { useBatches } from "@/features/student-admission/hooks/use-batches";
import { AbsenceReasonDialog } from "@/features/session-engine/components/absence-reason-dialog";
import { todayUTC } from "@/lib/calendar-date";
import { useBatchMonths } from "../hooks/use-batch-months";
import { useAttendanceRegister } from "../hooks/use-attendance-register";
import type { AbsenceReason } from "@yogapratishthan/db";

const MARKABLE_STATUSES = new Set(["UPCOMING", "MAKEUP"]);

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number) as [number, number];
  return format(new Date(Date.UTC(year, month - 1, 1)), "MMMM yyyy");
}

export function AttendanceRegister() {
  const { batches, isLoading: batchesLoading } = useBatches();

  if (batchesLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-20 text-center">
        <Users className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">No batches yet</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={batches[0]!.id}>
      <TabsList>
        {batches.map((batch) => (
          <TabsTrigger key={batch.id} value={batch.id}>
            {batch.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {batches.map((batch) => (
        <TabsContent key={batch.id} value={batch.id} className="pt-4">
          <BatchRegister batchId={batch.id} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function BatchRegister({ batchId }: { batchId: string }) {
  const { months, isLoading: monthsLoading } = useBatchMonths(batchId);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    if (months.length === 0) {
      setSelectedMonth(null);
      return;
    }
    const currentMonth = monthLabelKey(todayUTC());
    setSelectedMonth(months.includes(currentMonth) ? currentMonth : months[months.length - 1]!);
  }, [months]);

  const { data, isLoading: registerLoading, reload } = useAttendanceRegister(batchId, selectedMonth);

  if (monthsLoading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  if (months.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <Users className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">No sessions yet for this batch</p>
      </div>
    );
  }

  return (
    <div className="flex gap-5">
      <div className="flex w-36 shrink-0 flex-col gap-1 overflow-y-auto rounded-xl border border-border/60 bg-card p-2" style={{ maxHeight: 480 }}>
        {months.map((month) => (
          <button
            key={month}
            type="button"
            onClick={() => setSelectedMonth(month)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
              selectedMonth === month
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {monthLabel(month)}
          </button>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        {registerLoading || !data ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <RegisterGrid data={data} onChange={reload} />
        )}
      </div>
    </div>
  );
}

function monthLabelKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function RegisterGrid({
  data,
  onChange,
}: {
  data: import("../services/attendance-service").RegisterData;
  onChange: () => void;
}) {
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [absenceDialogSessionId, setAbsenceDialogSessionId] = useState<string | null>(null);
  const today = useMemo(() => todayUTC().toISOString().split("T")[0]!, []);

  async function markPresent(sessionId: string) {
    setPendingSessionId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PRESENT" }),
      });
      if (!res.ok) throw new Error();
      onChange();
    } catch {
      toast.error("Could not mark attendance");
    } finally {
      setPendingSessionId(null);
    }
  }

  async function markAbsent(sessionId: string, reason: AbsenceReason, note: string) {
    setPendingSessionId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ABSENT", absenceReason: reason, absenceNote: note || undefined }),
      });
      if (!res.ok) throw new Error();
      setAbsenceDialogSessionId(null);
      onChange();
    } catch {
      toast.error("Could not mark attendance");
    } finally {
      setPendingSessionId(null);
    }
  }

  if (data.rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <Users className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">No sessions this month</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60">
            <th className="sticky left-0 z-10 min-w-44 bg-card px-3 py-2 text-left font-medium text-muted-foreground">
              Student
            </th>
            {data.dates.map((date) => (
              <th key={date} className="min-w-14 px-1.5 py-2 text-center text-xs font-medium text-muted-foreground">
                {format(new Date(date), "d MMM")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.student.id} className="border-b border-border/40 last:border-0">
              <td className="sticky left-0 z-10 flex items-center gap-2 bg-card px-3 py-2">
                <Avatar size="sm">
                  <AvatarImage src={row.student.photoUrl ?? undefined} alt={row.student.firstName} />
                  <AvatarFallback className="text-[10px]">
                    {initialsOf(row.student.firstName, row.student.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs font-medium text-foreground">
                  {row.student.firstName} {row.student.lastName}
                </span>
              </td>
              {data.dates.map((date) => {
                const cell = row.cells[date];
                return (
                  <td key={date} className="px-1.5 py-2 text-center">
                    {cell ? (
                      <RegisterCellButton
                        cell={cell}
                        isFuture={date > today}
                        isPending={pendingSessionId === cell.sessionId}
                        onMarkPresent={() => markPresent(cell.sessionId)}
                        onMarkAbsent={() => setAbsenceDialogSessionId(cell.sessionId)}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground/40">·</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <AbsenceReasonDialog
        open={absenceDialogSessionId !== null}
        onOpenChange={(open) => !open && setAbsenceDialogSessionId(null)}
        onConfirm={(reason, note) => markAbsent(absenceDialogSessionId!, reason, note)}
      />
    </div>
  );
}

function RegisterCellButton({
  cell,
  isFuture,
  isPending,
  onMarkPresent,
  onMarkAbsent,
}: {
  cell: { sessionId: string; status: string };
  isFuture: boolean;
  isPending: boolean;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
}) {
  if (cell.status === "PRESENT") {
    return <Check className="mx-auto size-4 text-primary" aria-label="Present" />;
  }
  if (cell.status === "ABSENT") {
    return <X className="mx-auto size-4 text-destructive" aria-label="Absent" />;
  }
  if (cell.status === "VACATION") {
    return <span className="text-xs font-medium text-muted-foreground" aria-label="Vacation">V</span>;
  }
  if (isFuture || !MARKABLE_STATUSES.has(cell.status)) {
    return <span className="text-xs text-muted-foreground/50">—</span>;
  }

  if (isPending) {
    return <Loader2 className="mx-auto size-3.5 animate-spin text-muted-foreground" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="mx-auto flex size-6 items-center justify-center rounded-md border border-dashed border-input text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
            aria-label="Mark attendance"
          />
        }
      >
        {cell.status === "MAKEUP" ? "M" : ""}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem onClick={onMarkPresent}>
          <Check />
          Present
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMarkAbsent}>
          <X />
          Absent
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
