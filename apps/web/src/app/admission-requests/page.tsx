import { AdmissionRequestsList } from "@/features/admission-requests/components/admission-requests-list";

export default function AdmissionRequestsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-1 pb-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admission Requests</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Review self-submitted applications from{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">/apply</code>, then assign a batch to admit.
      </p>
      <AdmissionRequestsList />
    </div>
  );
}
