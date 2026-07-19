import { SelfEditForm } from "@/features/student-directory/components/self-edit-form";

export default async function SelfEditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 pb-16">
        <header className="flex flex-col gap-1 pb-6">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Yogapratishthan · Iyengar Yoga Center
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Update your details</h1>
          <p className="text-sm text-muted-foreground">Make any corrections below and save when you&apos;re done.</p>
        </header>

        <SelfEditForm token={token} />
      </div>
    </div>
  );
}
