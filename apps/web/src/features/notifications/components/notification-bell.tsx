"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow, isToday } from "date-fns";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { initialsOf } from "@/features/student-directory/lib/format";
import { useEvents, type EventWithStudent } from "../hooks/use-events";
import { EVENT_DISPLAY } from "../lib/event-display";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { events, isLoading, unreadCount, reload, markRead, markAllRead, clearEvent, clearAll } = useEvents({
    limit: 30,
    activeOnly: true,
  });

  const groups = useMemo(() => {
    const today: EventWithStudent[] = [];
    const earlier: EventWithStudent[] = [];
    for (const event of events) {
      (isToday(new Date(event.createdAt)) ? today : earlier).push(event);
    }
    return { today, earlier };
  }, [events]);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reload();
      }}
    >
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Notifications" className="relative" />}>
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-sm">
        <SheetHeader className="gap-1 border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
          </div>
          {events.length > 0 && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearAll}>
                <Trash2 className="size-3.5" />
                Clear all
              </Button>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Bell className="size-7 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
              <p className="px-6 text-xs text-muted-foreground">New activity will show up here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2">
              {groups.today.length > 0 && (
                <EventGroup label="Today" events={groups.today} onRead={markRead} onClear={clearEvent} />
              )}
              {groups.earlier.length > 0 && (
                <EventGroup label="Earlier" events={groups.earlier} onRead={markRead} onClear={clearEvent} />
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function EventGroup({
  label,
  events,
  onRead,
  onClear,
}: {
  label: string;
  events: EventWithStudent[];
  onRead: (id: string) => void;
  onClear: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-2.5 pt-2 pb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {events.map((event) => (
        <NotificationItem key={event.id} event={event} onRead={onRead} onClear={onClear} />
      ))}
    </div>
  );
}

function NotificationItem({
  event,
  onRead,
  onClear,
}: {
  event: EventWithStudent;
  onRead: (id: string) => void;
  onClear: (id: string) => void;
}) {
  const { label, icon: Icon } = EVENT_DISPLAY[event.type];

  return (
    <div className="relative flex items-start gap-3 rounded-lg p-2.5 pr-9 transition-colors hover:bg-muted">
      <button
        type="button"
        onClick={() => !event.isRead && onRead(event.id)}
        className="flex flex-1 items-start gap-3 text-left"
      >
        <div className="relative mt-0.5 shrink-0">
          {event.student ? (
            <Avatar size="sm">
              <AvatarImage src={event.student.photoUrl ?? undefined} alt={event.student.firstName} />
              <AvatarFallback className="text-[10px]">
                {initialsOf(event.student.firstName, event.student.lastName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className={`flex size-6 items-center justify-center rounded-full ${
                event.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
              }`}
            >
              <Icon className="size-3.5" />
            </div>
          )}
          {event.student && (
            <div className="absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full bg-background ring-1 ring-border">
              <Icon className="size-2.5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {label}
            </Badge>
            {!event.isRead && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
          </div>
          <p className="mt-1 text-sm text-foreground">{event.message}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
          </p>
        </div>
      </button>

      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Clear notification"
        className="absolute top-2.5 right-2 text-muted-foreground opacity-60 hover:opacity-100"
        onClick={() => onClear(event.id)}
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
