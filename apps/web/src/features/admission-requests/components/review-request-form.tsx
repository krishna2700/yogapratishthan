"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, FileText, Loader2, Phone, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldWrapper } from "@/components/form/field-wrapper";
import { initialsOf } from "@/features/student-directory/lib/format";
import { HEALTH_ISSUES } from "@/features/student-admission/constants";
import { useBatches } from "@/features/student-admission/hooks/use-batches";
import { formatWeekdays } from "@/lib/weekday";
import { useAdmissionRequest } from "../hooks/use-admission-request";

export function ReviewRequestForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { request, isLoading, notFound } = useAdmissionRequest(requestId);
  const { batches, isLoading: batchesLoading } = useBatches();

  const [batchId, setBatchId] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]!);
  const [paymentReceived, setPaymentReceived] = useState("");
  const [numberOfSessions, setNumberOfSessions] = useState("");
  const [batchError, setBatchError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-sm font-medium text-foreground">Request not found</p>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/admission-requests" />}>
          Back to admission requests
        </Button>
      </div>
    );
  }

  if (isLoading || !request) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const healthLabels = request.healthIssues.map(
    (issue) => HEALTH_ISSUES.find((h) => h.value === issue)?.label ?? issue,
  );

  async function accept() {
    if (!request) return;
    if (!batchId) {
      setBatchError("Please assign a batch");
      return;
    }
    setBatchError(null);
    setIsAccepting(true);
    try {
      const res = await fetch(`/api/admission-requests/${requestId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          joiningDate: joiningDate ? new Date(joiningDate).toISOString() : undefined,
          paymentReceived: paymentReceived || undefined,
          numberOfSessions: numberOfSessions || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not accept request");
      }
      const data: { student: { id: string } } = await res.json();
      toast.success(`${request.firstName} ${request.lastName} was admitted`);
      router.push(`/students/${data.student.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAccepting(false);
    }
  }

  async function reject() {
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/admission-requests/${requestId}/reject`, { method: "POST" });
      if (!res.ok) throw new Error("Could not reject request");
      toast.success("Request rejected");
      router.push("/admission-requests");
    } catch {
      toast.error("Could not reject request");
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar size="lg" className="size-16">
            <AvatarImage src={request.photoUrl ?? undefined} alt={request.firstName} />
            <AvatarFallback className="text-base">{initialsOf(request.firstName, request.lastName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-foreground">
              {request.firstName} {request.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {request.gender.charAt(0) + request.gender.slice(1).toLowerCase()} · Born{" "}
              {format(new Date(request.dob), "PP")}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              {request.mobileNumber}
              {request.whatsappNumber !== request.mobileNumber && ` (WhatsApp: ${request.whatsappNumber})`}
            </p>
          </div>
        </div>
        {request.status !== "PENDING" && (
          <Badge variant={request.status === "ACCEPTED" ? "secondary" : "destructive"}>
            {request.status === "ACCEPTED" ? "Accepted" : "Rejected"}
          </Badge>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Health information</h2>
        {healthLabels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No health issues reported</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {healthLabels.map((label) => (
              <Badge key={label} variant="outline">
                {label}
              </Badge>
            ))}
          </div>
        )}
        {request.healthIssueDetails && <p className="mt-2 text-sm text-muted-foreground">{request.healthIssueDetails}</p>}
      </div>

      {request.aadharUrl && (
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Aadhar card</h2>
          {request.aadharUrl.endsWith(".pdf") ? (
            <a
              href={request.aadharUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <FileText className="size-4" />
              Open Aadhar PDF
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={request.aadharUrl} alt="Aadhar card" className="max-h-64 rounded-lg border border-border" />
          )}
        </div>
      )}

      {request.status === "PENDING" && (
        <div className="flex flex-col gap-5 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Complete admission</h2>

          <FieldWrapper label="Batch" required error={batchError ?? undefined}>
            {batchesLoading ? (
              <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading batches…
              </div>
            ) : (
              <RadioGroup value={batchId} onValueChange={setBatchId} className="grid gap-2.5 sm:grid-cols-2">
                {batches.map((batch) => (
                  <Label
                    key={batch.id}
                    htmlFor={`review-batch-${batch.id}`}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-input p-3.5 font-normal has-data-checked:border-primary has-data-checked:bg-primary/5"
                  >
                    <RadioGroupItem id={`review-batch-${batch.id}`} value={batch.id} className="mt-0.5" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{batch.name}</span>
                      <span className="text-xs text-muted-foreground">{formatWeekdays(batch.weekdays)}</span>
                      <span className="text-xs text-muted-foreground">
                        {batch.startTime} – {batch.endTime}
                      </span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            )}
          </FieldWrapper>

          <FieldWrapper htmlFor="joiningDate" label="Date of joining" hint="Optional">
            <Input id="joiningDate" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
          </FieldWrapper>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldWrapper htmlFor="paymentReceived" label="Payment received (₹)" hint="Optional">
              <Input
                id="paymentReceived"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={paymentReceived}
                onChange={(e) => setPaymentReceived(e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper htmlFor="numberOfSessions" label="Number of sessions" hint="Optional">
              <Input
                id="numberOfSessions"
                type="number"
                inputMode="numeric"
                min={1}
                step="1"
                value={numberOfSessions}
                onChange={(e) => setNumberOfSessions(e.target.value)}
              />
            </FieldWrapper>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={isRejecting || isAccepting} onClick={reject}>
              {isRejecting ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              Reject
            </Button>
            <Button type="button" disabled={isAccepting || isRejecting} onClick={accept}>
              {isAccepting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Accept &amp; admit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
