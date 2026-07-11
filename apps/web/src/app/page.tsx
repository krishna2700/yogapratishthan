import { AdmissionForm } from "@/features/student-admission/components/admission-form";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-16 sm:px-6">
      <header className="flex flex-col gap-1 py-8 sm:py-10">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          Yogapratishthan · Iyengar Yoga Center
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          New student admission
        </h1>
        <p className="text-sm text-muted-foreground">
          Fill in the student&apos;s details from their admission form below.
        </p>
      </header>

      <AdmissionForm />
    </div>
  );
}
