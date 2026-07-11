"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBatches } from "@/features/student-admission/hooks/use-batches";
import { NotesDialog } from "@/features/notes/components/notes-dialog";
import { AddMakeupDialog } from "@/features/session-engine/components/add-makeup-dialog";
import { SendWhatsAppDialog } from "@/features/whatsapp/components/send-whatsapp-dialog";
import { useStudents } from "../hooks/use-students";
import { StudentCard } from "./student-card";
import { RenewDialog } from "./renew-dialog";
import { DeleteStudentDialog } from "./delete-student-dialog";

type QuickAction = { type: "makeup" | "notes" | "renew" | "whatsapp" | "delete"; studentId: string } | null;

interface StudentDirectoryProps {
  initialStatus?: "active" | "expired" | "all";
}

export function StudentDirectory({ initialStatus = "active" }: StudentDirectoryProps) {
  const [search, setSearch] = useState("");
  const [batchId, setBatchId] = useState<string>("all");
  const [status, setStatus] = useState<"active" | "expired" | "all">(initialStatus);
  const [quickAction, setQuickAction] = useState<QuickAction>(null);

  const { batches } = useBatches();
  const { students, isLoading, reload } = useStudents({
    search: search || undefined,
    batchId: batchId === "all" ? undefined : batchId,
    status,
  });

  const whatsappTarget =
    quickAction?.type === "whatsapp" ? (students.find((s) => s.id === quickAction.studentId) ?? null) : null;
  const deleteTarget =
    quickAction?.type === "delete" ? (students.find((s) => s.id === quickAction.studentId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or mobile"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Batch">
                {(value: string) => (value === "all" ? "All batches" : (batches.find((b) => b.id === value)?.name ?? value))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue>
                {(value: typeof status) => ({ active: "Active", expired: "Expired", all: "All" })[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">No students found</p>
            <p className="text-sm text-muted-foreground">
              {search || batchId !== "all" || status !== "active"
                ? "Try adjusting your filters."
                : "Get started by admitting your first student."}
            </p>
          </div>
          <Button size="sm" nativeButton={false} render={<Link href="/students/new" />}>
            <Plus className="size-4" />
            New Admission
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onQuickAction={(type, studentId) => setQuickAction({ type, studentId })}
            />
          ))}
        </div>
      )}

      <AddMakeupDialog
        studentId={quickAction?.type === "makeup" ? quickAction.studentId : null}
        onOpenChange={(open) => !open && setQuickAction(null)}
        onSuccess={reload}
      />
      <NotesDialog
        studentId={quickAction?.type === "notes" ? quickAction.studentId : null}
        onOpenChange={(open) => !open && setQuickAction(null)}
      />
      <RenewDialog
        studentId={quickAction?.type === "renew" ? quickAction.studentId : null}
        onOpenChange={(open) => !open && setQuickAction(null)}
        onSuccess={reload}
      />
      <SendWhatsAppDialog
        student={whatsappTarget}
        remaining={whatsappTarget?.stats.remaining}
        defaultTemplate={whatsappTarget?.status === "expired" ? "Membership expired" : "Low sessions"}
        onOpenChange={(open) => !open && setQuickAction(null)}
      />
      <DeleteStudentDialog
        student={deleteTarget}
        onOpenChange={(open) => !open && setQuickAction(null)}
        onDeleted={reload}
      />
    </div>
  );
}
