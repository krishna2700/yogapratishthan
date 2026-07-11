"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SendWhatsAppDialog, type WhatsAppTarget } from "@/features/whatsapp/components/send-whatsapp-dialog";
import { REMINDER_DISPLAY } from "../lib/reminder-display";
import type { Reminder, ReminderType } from "../services/reminder-service";

const SEVERITY_VARIANT = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
} as const;

const REMINDER_TEMPLATE: Partial<Record<ReminderType, string>> = {
  LOW_SESSIONS: "Low sessions",
  MEMBERSHIP_EXPIRED: "Membership expired",
  CONSECUTIVE_ABSENCES: "Attendance reminder",
};

export function ReminderCenter() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [whatsappReminder, setWhatsappReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    fetch("/api/reminders")
      .then((res) => res.json())
      .then((data: { reminders: Reminder[] }) => setReminders(data.reminders))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <BellRing className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">All caught up</p>
        <p className="text-sm text-muted-foreground">Nothing needs your attention right now.</p>
      </div>
    );
  }

  const whatsappTarget: WhatsAppTarget | null =
    whatsappReminder?.studentId && whatsappReminder.student
      ? { id: whatsappReminder.studentId, ...whatsappReminder.student }
      : null;

  return (
    <>
      <ul className="flex flex-col gap-3">
        {reminders.map((reminder) => {
          const { label, icon: Icon } = REMINDER_DISPLAY[reminder.type];
          return (
            <li
              key={reminder.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <Badge variant={SEVERITY_VARIANT[reminder.severity]} className="mb-1 text-[10px]">
                  {label}
                </Badge>
                {reminder.studentId ? (
                  <Link href={`/students/${reminder.studentId}`} className="block text-sm text-foreground hover:underline">
                    {reminder.message}
                  </Link>
                ) : (
                  <p className="text-sm text-foreground">{reminder.message}</p>
                )}
              </div>
              {reminder.student && (
                <Button variant="ghost" size="sm" onClick={() => setWhatsappReminder(reminder)}>
                  <MessageCircle className="size-3.5" />
                  WhatsApp
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <SendWhatsAppDialog
        student={whatsappTarget}
        remaining={whatsappReminder?.remaining}
        defaultTemplate={whatsappReminder ? REMINDER_TEMPLATE[whatsappReminder.type] : undefined}
        onOpenChange={(open) => !open && setWhatsappReminder(null)}
      />
    </>
  );
}
