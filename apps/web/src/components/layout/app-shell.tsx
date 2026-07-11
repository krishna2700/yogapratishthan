"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border/60 bg-card px-4 py-6 md:flex">
        <BrandHeader />
        <div className="mt-8">
          <SidebarNav />
        </div>
        <div className="mt-auto">
          <Button className="w-full" nativeButton={false} render={<Link href="/students/new" />}>
            <Plus className="size-4" />
            New Admission
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button size="sm" className="md:hidden" nativeButton={false} render={<Link href="/students/new" />}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64">
          <SheetHeader>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <BrandHeader />
          </SheetHeader>
          <div className="px-4" onClick={() => setMobileNavOpen(false)}>
            <SidebarNav />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function BrandHeader() {
  return (
    <Link href="/" className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold tracking-tight text-foreground">Yogapratishthan</span>
      <span className="text-[11px] text-muted-foreground">Iyengar Yoga Center</span>
    </Link>
  );
}
