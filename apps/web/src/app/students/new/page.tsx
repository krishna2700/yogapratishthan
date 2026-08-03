import { QuickAddStudentForm } from "@/features/student-admission/components/quick-add-student-form";

export default function NewStudentPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col pb-16">
      <header className="flex flex-col gap-1 pb-6">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          Yogapratishthan · Iyengar Yoga Center
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Quick add student</h1>
        <p className="text-sm text-muted-foreground">
          Just the essentials — name, joining date, batch, sessions, and fees. Once added, send the student an
          edit link via WhatsApp so they can fill in the rest.
        </p>
      </header>

      <QuickAddStudentForm />
    </div>
  );
}
