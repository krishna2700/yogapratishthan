"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePendingAdmissionRequestsCount } from "@/features/admission-requests/hooks/use-pending-count";
import { NAV_LINKS } from "./nav-links";

export function SidebarNav() {
  const pathname = usePathname();
  const pendingCount = usePendingAdmissionRequestsCount();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_LINKS.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {link.label}
            {link.href === "/admission-requests" && pendingCount > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
