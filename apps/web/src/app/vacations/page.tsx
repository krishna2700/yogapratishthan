import { VacationsList } from "@/features/vacations/components/vacations-list";

export default function VacationsPage() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Vacations</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Center closures — Diwali, Guru Purnima, maintenance, holidays.
      </p>
      <VacationsList />
    </div>
  );
}
