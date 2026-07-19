import { ReviewRequestForm } from "@/features/admission-requests/components/review-request-form";

export default async function AdmissionRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 pb-16">
      <ReviewRequestForm requestId={requestId} />
    </div>
  );
}
