import { EditStudentForm } from "@/features/student-directory/components/edit-student-form";

export default async function EditStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 pb-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit student</h1>
      <p className="mb-6 text-sm text-muted-foreground">Update details or move them to a different batch.</p>
      <EditStudentForm studentId={studentId} />
    </div>
  );
}
