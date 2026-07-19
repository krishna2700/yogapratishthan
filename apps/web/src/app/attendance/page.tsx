import { AttendanceRegister } from "@/features/attendance/components/attendance-register";

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Attendance</h1>
      <p className="mb-6 text-sm text-muted-foreground">Pick a batch and month, then mark each session.</p>
      <AttendanceRegister />
    </div>
  );
}
