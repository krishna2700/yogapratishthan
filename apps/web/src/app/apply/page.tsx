import { ApplyForm } from "@/features/admission-requests/components/apply-form";

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 pb-16">
        <header className="flex flex-col gap-1 pb-6">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Yogapratishthan · Iyengar Yoga Center
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Student admission form
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill in your details below. The instructor will review your submission and confirm your batch.
          </p>
        </header>

        <ApplyForm />
      </div>
    </div>
  );
}
