import { ReminderCenter } from "@/features/reminders/components/reminder-center";

export default function RemindersPage() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reminders</h1>
      <p className="mb-6 text-sm text-muted-foreground">Everything that needs your attention, computed live.</p>
      <ReminderCenter />
    </div>
  );
}
