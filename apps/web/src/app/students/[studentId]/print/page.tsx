import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getStudentDirectoryEntry } from "@/features/student-directory/services/student-directory-service";
import { PrintButton } from "@/features/student-directory/components/print-button";
import { HEALTH_ISSUES } from "@/features/student-admission/constants";
import { formatWeekdays } from "@/lib/weekday";
import { formatCurrency } from "@/features/student-directory/lib/format";

export default async function PrintStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const student = await getStudentDirectoryEntry(studentId);
  if (!student) notFound();

  const healthLabels = student.healthIssues.map(
    (issue) => HEALTH_ISSUES.find((h) => h.value === issue)?.label ?? issue,
  );
  const isAadharPdf = student.aadharUrl?.toLowerCase().endsWith(".pdf");

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-background px-6 py-10 print:gap-4 print:px-0 print:py-0">
      <div className="flex items-start justify-between print:hidden">
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Yogapratishthan · Iyengar Yoga Center
          </p>
          <h1 className="text-xl font-semibold text-foreground">Student admission form</h1>
        </div>
        <PrintButton />
      </div>

      <div className="hidden flex-col gap-0.5 border-b border-border pb-3 print:flex">
        <p className="text-xs font-medium tracking-wide uppercase">Yogapratishthan · Iyengar Yoga Center</p>
        <h1 className="text-xl font-semibold">Student admission form</h1>
      </div>

      <div className="flex items-start gap-5 rounded-xl border border-border/60 p-5 print:rounded-none print:border-0 print:p-0">
        {student.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={student.photoUrl}
            alt={`${student.firstName} ${student.lastName}`}
            className="size-28 shrink-0 rounded-xl border border-border object-cover"
          />
        )}
        <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Field label="Name" value={`${student.firstName} ${student.lastName}`} />
          <Field label="Batch" value={`${student.batch.name} (${formatWeekdays(student.batch.weekdays)})`} />
          <Field label="Date of birth" value={student.dob ? format(new Date(student.dob), "PP") : "—"} />
          <Field label="Gender" value={student.gender ?? "—"} />
          <Field label="Mobile number" value={student.mobileNumber ?? "—"} />
          <Field label="WhatsApp number" value={student.whatsappNumber ?? "—"} />
          <Field label="Date of joining" value={student.joiningDate ? format(new Date(student.joiningDate), "PP") : "—"} />
          <Field
            label="Payment received"
            value={student.paymentReceived != null ? formatCurrency(student.paymentReceived.toString()) : "—"}
          />
          <Field label="Number of sessions" value={student.numberOfSessions?.toString() ?? "—"} />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 p-5 print:break-inside-avoid print:rounded-none print:border-0 print:border-t print:p-0 print:pt-4">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Health information</h2>
        {healthLabels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No health issues reported</p>
        ) : (
          <p className="text-sm text-foreground">{healthLabels.join(", ")}</p>
        )}
        {student.healthIssueDetails && (
          <p className="mt-2 text-sm text-muted-foreground">{student.healthIssueDetails}</p>
        )}
      </div>

      {student.aadharUrl && (
        <div className="rounded-xl border border-border/60 p-5 print:break-inside-avoid print:rounded-none print:border-0 print:border-t print:p-0 print:pt-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Aadhar card</h2>
          {isAadharPdf ? (
            <iframe src={student.aadharUrl} className="h-[500px] w-full rounded-lg border border-border" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.aadharUrl} alt="Aadhar card" className="max-h-96 rounded-lg border border-border" />
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
