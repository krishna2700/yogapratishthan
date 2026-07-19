"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  applyFormDefaultValues,
  applyFormSchema,
  type ApplyFormInput,
  type ApplyFormValues,
} from "../client-schema";
import { PersonalInfoSection } from "./personal-info-section";
import { HealthInfoSection } from "./health-info-section";

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

export function ApplyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  const form = useForm<ApplyFormInput, unknown, ApplyFormValues>({
    resolver: standardSchemaResolver(applyFormSchema),
    defaultValues: applyFormDefaultValues,
    mode: "onTouched",
  });

  const { handleSubmit, setError } = form;

  async function submit(values: ApplyFormValues) {
    setIsSubmitting(true);
    try {
      const [photoUrl, aadharUrl] = await Promise.all([
        values.photo ? uploadFile(values.photo, "/api/upload") : Promise.resolve(undefined),
        values.aadhar ? uploadFile(values.aadhar, "/api/upload/document") : Promise.resolve(undefined),
      ]);

      const res = await fetch("/api/admission-requests", {
        method: "POST",
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

      setSubmittedName(`${values.firstName} ${values.lastName}`);
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedName) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card py-16 text-center shadow-sm">
        <CheckCircle2 className="size-10 text-primary" />
        <p className="text-lg font-semibold text-foreground">Thanks, {submittedName}!</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your admission form has been submitted. The instructor will review it and confirm your batch shortly.
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
      <PersonalInfoSection form={form} />
      <HealthInfoSection form={form} />

      {form.formState.errors.root?.message && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
        <Button type="button" size="lg" disabled={isSubmitting} onClick={handleSubmit(submit)}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Submit application
        </Button>
      </div>
    </form>
  );
}
