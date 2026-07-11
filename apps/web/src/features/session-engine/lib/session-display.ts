import type { SessionStatus } from "@yogapratishthan/db";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export const SESSION_STATUS_DISPLAY: Record<SessionStatus, { label: string; variant: BadgeVariant }> = {
  UPCOMING: { label: "Upcoming", variant: "secondary" },
  PRESENT: { label: "Present", variant: "default" },
  ABSENT: { label: "Absent", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
  VACATION: { label: "Vacation", variant: "outline" },
  MAKEUP: { label: "Make-up", variant: "secondary" },
  EXPIRED: { label: "Expired", variant: "destructive" },
};
