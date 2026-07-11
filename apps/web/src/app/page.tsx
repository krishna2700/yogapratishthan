import { Dashboard } from "@/features/dashboard/components/dashboard";

export default function Home() {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Yogapratishthan · Iyengar Yoga Center
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">Everything happening at the center, at a glance.</p>
      <Dashboard />
    </div>
  );
}
