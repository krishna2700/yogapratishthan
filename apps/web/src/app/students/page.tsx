import { StudentDirectory } from "@/features/student-directory/components/student-directory";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const initialStatus = status === "expired" || status === "all" ? status : "active";

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Students</h1>
      <p className="mb-6 text-sm text-muted-foreground">Every student, their batch, and where they stand.</p>
      <StudentDirectory initialStatus={initialStatus} />
    </div>
  );
}
