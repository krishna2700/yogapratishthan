import { AttendanceView } from "@/features/attendance/components/attendance-view";

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Attendance</h1>
      <p className="mb-6 text-sm text-muted-foreground">Today&apos;s classes, one tap to mark.</p>
      <AttendanceView />
    </div>
  );
}
