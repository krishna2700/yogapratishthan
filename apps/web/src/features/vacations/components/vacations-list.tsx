"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarOff, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVacations } from "../hooks/use-vacations";
import { CreateVacationDialog } from "./create-vacation-dialog";
import { EditVacationDialog } from "./edit-vacation-dialog";
import { DeleteVacationDialog } from "./delete-vacation-dialog";
import type { Vacation } from "@yogapratishthan/db";

export function VacationsList() {
  const { vacations, isLoading, reload } = useVacations();
  const [editTarget, setEditTarget] = useState<Vacation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vacation | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <CreateVacationDialog onSuccess={reload} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : vacations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <CalendarOff className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No vacations scheduled</p>
          <p className="text-sm text-muted-foreground">Holidays and closures you add will appear here.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {vacations.map((vacation) => (
            <li
              key={vacation.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{vacation.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(vacation.startDate), "PP")} – {format(new Date(vacation.endDate), "PP")}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Vacation actions" />}>
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditTarget(vacation)}>
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(vacation)}>
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <EditVacationDialog vacation={editTarget} onOpenChange={(open) => !open && setEditTarget(null)} onSuccess={reload} />
      <DeleteVacationDialog
        vacation={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={reload}
      />
    </div>
  );
}
