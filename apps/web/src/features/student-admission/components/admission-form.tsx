"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { Loader2, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  admissionFormDefaultValues,
  admissionFormSchema,
  type AdmissionFormInput,
  type AdmissionFormValues,
} from "../client-schema";
import { PersonalInfoSection } from "./personal-info-section";
import { HealthInfoSection } from "./health-info-section";
import { AdmissionDetailsSection } from "./admission-details-section";
import { BatchAllocationSection } from "./batch-allocation-section";

async function uploadPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Photo upload failed");
  }
  const data: { url: string } = await res.json();
  return data.url;
}

export function AdmissionForm() {
  const router = useRouter();
  const [submitAction, setSubmitAction] = useState<"save" | "saveAndAddAnother" | null>(null);

  const form = useForm<AdmissionFormInput, unknown, AdmissionFormValues>({
    resolver: standardSchemaResolver(admissionFormSchema),
    defaultValues: admissionFormDefaultValues,
    mode: "onTouched",
  });

  const { handleSubmit, reset, setError, setFocus } = form;
  const isSubmitting = submitAction !== null;

  async function submit(values: AdmissionFormValues, addAnother: boolean) {
    setSubmitAction(addAnother ? "saveAndAddAnother" : "save");
    try {
      const photoUrl = values.photo ? await uploadPhoto(values.photo) : undefined;

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          dob: new Date(values.dob).toISOString(),
          gender: values.gender,
          mobileNumber: values.mobileNumber,
          whatsappNumber: values.whatsappNumber || undefined,
          photoUrl,
          healthIssues: values.healthIssues,
          healthIssueDetails: values.healthIssueDetails || undefined,
          joiningDate: new Date(values.joiningDate).toISOString(),
          paymentReceived: values.paymentReceived,
          numberOfSessions: values.numberOfSessions,
          batchId: values.batchId,
        }),
      });

      if (!res.ok) {
        const body: { error?: string; fieldErrors?: Record<string, string[]> } = await res
          .json()
          .catch(() => ({}));

        if (body.fieldErrors) {
          for (const [field, messages] of Object.entries(body.fieldErrors)) {
            setError(field as keyof AdmissionFormValues, { message: messages[0] });
          }
        }
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      const data: { student: { id: string } } = await res.json();

      toast.success(`${values.firstName} ${values.lastName} was admitted successfully`, {
        description: addAnother
          ? "Form cleared — ready for the next student."
          : "Their session schedule has been generated.",
      });

      if (addAnother) {
        reset(admissionFormDefaultValues);
        setFocus("firstName");
      } else {
        router.push(`/students/${data.student.id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitAction(null);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-6"
    >
      <PersonalInfoSection form={form} />
      <HealthInfoSection form={form} />
      <AdmissionDetailsSection form={form} />
      <BatchAllocationSection form={form} />

      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isSubmitting}
          onClick={handleSubmit((values) => submit(values, true))}
        >
          {submitAction === "saveAndAddAnother" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          Save &amp; Add Another
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={isSubmitting}
          onClick={handleSubmit((values) => submit(values, false))}
        >
          {submitAction === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </Button>
      </div>
    </form>
  );
}
