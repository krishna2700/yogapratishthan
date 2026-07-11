"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { Loader2, Save, User, HeartPulse, CalendarClock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldWrapper } from "@/components/form/field-wrapper";
import { FormSection } from "@/features/student-admission/components/form-section";
import { PhotoUpload } from "@/features/student-admission/components/photo-upload";
import { useBatches } from "@/features/student-admission/hooks/use-batches";
import { GENDER_OPTIONS, HEALTH_ISSUES } from "@/features/student-admission/constants";
import { formatWeekdays } from "@/lib/weekday";
import {
  updateStudentSchema,
  type UpdateStudentFormInput,
  type UpdateStudentSchemaInput,
} from "../schema";
import { useStudent } from "../hooks/use-student";

async function uploadPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Photo upload failed");
  const data: { url: string } = await res.json();
  return data.url;
}

export function EditStudentForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { student, isLoading } = useStudent(studentId);
  const { batches } = useBatches();
  const [newPhoto, setNewPhoto] = useState<File | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateStudentFormInput, unknown, UpdateStudentSchemaInput>({
    resolver: standardSchemaResolver(updateStudentSchema),
  });
  const { register, control, handleSubmit, watch, reset, formState: { errors } } = form;

  useEffect(() => {
    if (!student) return;
    reset({
      firstName: student.firstName,
      lastName: student.lastName,
      dob: student.dob.toString().split("T")[0] as unknown as UpdateStudentFormInput["dob"],
      gender: student.gender,
      mobileNumber: student.mobileNumber,
      whatsappNumber: student.whatsappNumber ?? "",
      healthIssues: student.healthIssues,
      healthIssueDetails: student.healthIssueDetails ?? "",
      batchId: student.batchId,
    });
  }, [student, reset]);

  const healthIssues = watch("healthIssues") ?? [];
  const showHealthDetails = healthIssues.includes("OTHER");

  async function onSubmit(values: UpdateStudentSchemaInput) {
    setIsSubmitting(true);
    try {
      const photoUrl = newPhoto ? await uploadPhoto(newPhoto) : undefined;
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          dob: new Date(values.dob).toISOString(),
          photoUrl,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save changes");
      }
      toast.success("Student updated");
      router.push(`/students/${studentId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !student) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormSection icon={User} title="Personal Information">
        <FieldWrapper label="Student photo">
          <PhotoUpload
            value={newPhoto}
            onChange={setNewPhoto}
            error={undefined}
          />
          {!newPhoto && (
            <p className="mt-1 text-xs text-muted-foreground">Leave blank to keep the current photo.</p>
          )}
        </FieldWrapper>

        <div className="grid gap-5 sm:grid-cols-2">
          <FieldWrapper htmlFor="firstName" label="First name" required error={errors.firstName?.message}>
            <Input id="firstName" {...register("firstName")} />
          </FieldWrapper>
          <FieldWrapper htmlFor="lastName" label="Last name" required error={errors.lastName?.message}>
            <Input id="lastName" {...register("lastName")} />
          </FieldWrapper>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FieldWrapper htmlFor="dob" label="Date of birth" required error={errors.dob?.message}>
            <Input id="dob" type="date" defaultValue={new Date(student.dob).toISOString().split("T")[0]} {...register("dob")} />
          </FieldWrapper>
          <FieldWrapper label="Gender" required error={errors.gender?.message}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`edit-gender-${option.value}`}
                      className="flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-input text-sm font-normal has-data-checked:border-primary has-data-checked:bg-primary/5"
                    >
                      <RadioGroupItem id={`edit-gender-${option.value}`} value={option.value} />
                      {option.label}
                    </Label>
                  ))}
                </RadioGroup>
              )}
            />
          </FieldWrapper>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FieldWrapper htmlFor="mobileNumber" label="Mobile number" required error={errors.mobileNumber?.message}>
            <Input id="mobileNumber" type="tel" {...register("mobileNumber")} />
          </FieldWrapper>
          <FieldWrapper htmlFor="whatsappNumber" label="WhatsApp number" error={errors.whatsappNumber?.message}>
            <Input id="whatsappNumber" type="tel" {...register("whatsappNumber")} />
          </FieldWrapper>
        </div>
      </FormSection>

      <FormSection icon={HeartPulse} title="Health Information">
        <Controller
          name="healthIssues"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              {HEALTH_ISSUES.map((issue) => {
                const checked = field.value?.includes(issue.value) ?? false;
                return (
                  <Label key={issue.value} htmlFor={`edit-health-${issue.value}`} className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                    <Checkbox
                      id={`edit-health-${issue.value}`}
                      checked={checked}
                      onCheckedChange={(next) => {
                        const current = field.value ?? [];
                        field.onChange(next ? [...current, issue.value] : current.filter((v) => v !== issue.value));
                      }}
                    />
                    {issue.label}
                  </Label>
                );
              })}
            </div>
          )}
        />
        {showHealthDetails && (
          <FieldWrapper htmlFor="healthIssueDetails" label="Detailed health information" required error={errors.healthIssueDetails?.message}>
            <Textarea id="healthIssueDetails" rows={3} {...register("healthIssueDetails")} />
          </FieldWrapper>
        )}
      </FormSection>

      <FormSection icon={CalendarClock} title="Batch Allocation" description="Changing batches reschedules remaining sessions">
        <Controller
          name="batchId"
          control={control}
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2.5 sm:grid-cols-2">
              {batches.map((batch) => (
                <Label
                  key={batch.id}
                  htmlFor={`edit-batch-${batch.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-input p-3.5 font-normal has-data-checked:border-primary has-data-checked:bg-primary/5"
                >
                  <RadioGroupItem id={`edit-batch-${batch.id}`} value={batch.id} className="mt-0.5" />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{batch.name}</span>
                    <span className="text-xs text-muted-foreground">{formatWeekdays(batch.weekdays)}</span>
                    <span className="text-xs text-muted-foreground">{batch.startTime} – {batch.endTime}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
