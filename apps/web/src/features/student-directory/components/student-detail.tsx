"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarPlus,
  MessageCircle,
  MoreVertical,
  Pencil,
  Phone,
  Repeat,
  StickyNote,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatWeekdays } from "@/lib/weekday";
import { NotesPanel } from "@/features/notes/components/notes-panel";
import { TimelinePanel } from "@/features/notifications/components/timeline-panel";
import { SessionsPanel } from "@/features/session-engine/components/sessions-panel";
import { MakeupsPanel } from "@/features/session-engine/components/makeups-panel";
import { AddMakeupDialog } from "@/features/session-engine/components/add-makeup-dialog";
import { SendWhatsAppDialog } from "@/features/whatsapp/components/send-whatsapp-dialog";
import { formatCurrency, initialsOf } from "../lib/format";
import { useStudent } from "../hooks/use-student";
import { RenewDialog } from "./renew-dialog";
import { DeleteStudentDialog } from "./delete-student-dialog";

export function StudentDetail({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { student, isLoading, notFound, reload } = useStudent(studentId);
  const [makeupOpen, setMakeupOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function reloadEverything() {
    reload();
    setRefreshKey((k) => k + 1);
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-sm font-medium text-foreground">Student not found</p>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/students" />}>
          Back to directory
        </Button>
      </div>
    );
  }

  if (isLoading || !student) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const { stats } = student;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar size="lg" className="size-16">
            <AvatarImage src={student.photoUrl ?? undefined} alt={`${student.firstName} ${student.lastName}`} />
            <AvatarFallback className="text-base">
              {initialsOf(student.firstName, student.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">
                {student.firstName} {student.lastName}
              </h1>
              <Badge variant={student.status === "expired" ? "destructive" : "secondary"}>
                {student.status === "expired" ? "Expired" : "Active"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {student.batch.name} · {formatWeekdays(student.batch.weekdays)} · {student.batch.startTime}–
              {student.batch.endTime}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              {student.mobileNumber}
            </p>
            <p className="text-xs text-muted-foreground">Joined {format(new Date(student.joiningDate), "PP")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/students/${student.id}/edit`} />}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMakeupOpen(true)}>
            <CalendarPlus className="size-3.5" />
            Add Make-up
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRenewOpen(true)}>
            <Repeat className="size-3.5" />
            Renew
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWhatsappOpen(true)}>
            <MessageCircle className="size-3.5" />
            WhatsApp
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label="More actions" />}>
              <MoreVertical className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 />
                Delete Student
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Completed" value={stats.completed} />
        <StatTile label="Remaining" value={stats.remaining} />
        <StatTile label="Total" value={stats.total} />
        <StatTile label="Payment" value={formatCurrency(student.paymentReceived.toString())} />
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="makeups">
            <CalendarPlus className="size-3.5" />
            Make-up Classes
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="size-3.5" />
            Notes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sessions" className="pt-4">
          <SessionsPanel studentId={student.id} refreshKey={refreshKey} onChange={reloadEverything} />
        </TabsContent>
        <TabsContent value="makeups" className="pt-4">
          <MakeupsPanel studentId={student.id} refreshKey={refreshKey} />
        </TabsContent>
        <TabsContent value="timeline" className="pt-4">
          <TimelinePanel studentId={student.id} />
        </TabsContent>
        <TabsContent value="notes" className="pt-4">
          <NotesPanel studentId={student.id} />
        </TabsContent>
      </Tabs>

      <AddMakeupDialog
        studentId={makeupOpen ? student.id : null}
        onOpenChange={setMakeupOpen}
        onSuccess={reloadEverything}
      />
      <RenewDialog
        studentId={renewOpen ? student.id : null}
        onOpenChange={setRenewOpen}
        onSuccess={reloadEverything}
      />
      <SendWhatsAppDialog
        student={whatsappOpen ? student : null}
        remaining={stats.remaining}
        defaultTemplate={student.status === "expired" ? "Membership expired" : "Low sessions"}
        onOpenChange={setWhatsappOpen}
      />
      <DeleteStudentDialog
        student={deleteOpen ? student : null}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/students")}
      />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
