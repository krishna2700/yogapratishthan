"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  applyFormSchema,
  type ApplyFormInput,
  type ApplyFormValues,
} from "@/features/admission-requests/client-schema";
import { PersonalInfoSection } from "@/features/admission-requests/components/personal-info-section";
import { HealthInfoSection } from "@/features/admission-requests/components/health-info-section";
import type { Gender, HealthIssue } from "@yogapratishthan/db";

interface EditableStudent {
  firstName: string;
  lastName: string;
  dob: string | Date | null;
  gender: Gender | null;
  mobileNumber: string | null;
  whatsappNumber: string | null;
  healthIssues: HealthIssue[];
  healthIssueDetails: string | null;
}

async function uploadFile(file: File, endpoint: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(endpoint, { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Upload failed");
  }
  const data: { url: string } = await res.json();
  return data.url;
}

export function SelfEditForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"loading" | "invalid" | "ready">("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const form = useForm<ApplyFormInput, unknown, ApplyFormValues>({
    resolver: standardSchemaResolver(applyFormSchema),
  });
  const { handleSubmit, reset, setError } = form;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/edit-access/${token}`);
      if (cancelled) return;
      if (!res.ok) {
        setStatus("invalid");
        return;
      }
      const data: { student: EditableStudent } = await res.json();
      const s = data.student;
      reset({
        firstName: s.firstName,
        lastName: s.lastName,
        dob: (s.dob ? new Date(s.dob).toISOString().split("T")[0] : "") as unknown as ApplyFormInput["dob"],
        gender: (s.gender ?? "") as unknown as ApplyFormInput["gender"],
        mobileNumber: s.mobileNumber ?? "",
        whatsappNumber: s.whatsappNumber ?? "",
        healthIssues: s.healthIssues,
        healthIssueDetails: s.healthIssueDetails ?? "",
        photo: undefined,
        aadhar: undefined,
      });
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [token, reset]);

  async function submit(values: ApplyFormValues) {
    setIsSubmitting(true);
    setJustSaved(false);
    try {
      const [photoUrl, aadharUrl] = await Promise.all([
        values.photo ? uploadFile(values.photo, "/api/upload") : Promise.resolve(undefined),
        values.aadhar ? uploadFile(values.aadhar, "/api/upload/document") : Promise.resolve(undefined),
      ]);

      const res = await fetch(`/api/edit-access/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          dob: new Date(values.dob).toISOString(),
          gender: values.gender,
          mobileNumber: values.mobileNumber,
          whatsappNumber: values.whatsappNumber,
          photoUrl,
          aadharUrl,
          healthIssues: values.healthIssues,
          healthIssueDetails: values.healthIssueDetails || undefined,
        }),
      });

      if (!res.ok) {
        const body: { error?: string; fieldErrors?: Record<string, string[]> } = await res
          .json()
          .catch(() => ({}));
        if (body.fieldErrors) {
          for (const [field, messages] of Object.entries(body.fieldErrors)) {
            setError(field as keyof ApplyFormValues, { message: messages[0] });
          }
        }
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      setJustSaved(true);
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-foreground">This link is no longer active</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ask the instructor to share a new edit link if you need to update your details.
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
      <PersonalInfoSection form={form} />
      <HealthInfoSection form={form} />

      {justSaved && (
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle2 className="size-4" />
          Saved — your details have been updated.
        </p>
      )}
      {form.formState.errors.root?.message && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
        <Button type="button" size="lg" disabled={isSubmitting} onClick={handleSubmit(submit)}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
