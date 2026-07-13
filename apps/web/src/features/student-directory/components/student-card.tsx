"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  ClipboardList,
  MessageCircle,
  MoreVertical,
  Pencil,
  Repeat,
  StickyNote,
  Trash2,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatWeekdays } from "@/lib/weekday";
import { formatCurrency, initialsOf } from "../lib/format";
import type { StudentDirectoryEntry } from "../services/student-directory-service";

interface StudentCardProps {
  student: StudentDirectoryEntry;
  onQuickAction: (action: "makeup" | "notes" | "renew" | "whatsapp" | "delete", studentId: string) => void;
}

export function StudentCard({ student, onQuickAction }: StudentCardProps) {
  const router = useRouter();
  const { stats } = student;
  const progressPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="group relative flex flex-col gap-3.5 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => router.push(`/students/${student.id}`)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <Avatar size="lg">
            <AvatarImage src={student.photoUrl ?? undefined} alt={`${student.firstName} ${student.lastName}`} />
            <AvatarFallback>{initialsOf(student.firstName, student.lastName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {student.firstName} {student.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{student.batch.name}</p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <Badge variant={student.status === "expired" ? "destructive" : "secondary"}>
            {student.status === "expired" ? "Expired" : "Active"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Quick actions" />}>
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={`/students/${student.id}`} />}>
                <UserRound />
                View
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href={`/students/${student.id}/edit`} />}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/attendance" />}>
                <ClipboardList />
                Attendance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQuickAction("makeup", student.id)}>
                <CalendarPlus />
                Add Make-up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQuickAction("notes", student.id)}>
                <StickyNote />
                Notes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQuickAction("renew", student.id)}>
                <Repeat />
                Renew Sessions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQuickAction("whatsapp", student.id)}>
                <MessageCircle />
                Send WhatsApp
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onQuickAction("delete", student.id)}>
                <Trash2 />
                Delete Student
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <span>{formatWeekdays(student.batch.weekdays)}</span>
        <span>
          {student.batch.startTime} – {student.batch.endTime}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {stats.completed} completed · {stats.remaining} remaining
          </span>
          <span className="font-medium text-foreground">{stats.total} total</span>
        </div>
        <Progress value={progressPct} className="h-1.5" />
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        <span className="text-muted-foreground">Payment received</span>
        <span className="font-medium text-foreground">
          {student.paymentReceived != null ? formatCurrency(student.paymentReceived.toString()) : "—"}
        </span>
      </div>
    </div>
  );
}
