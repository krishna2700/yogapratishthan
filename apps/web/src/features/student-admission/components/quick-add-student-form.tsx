"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { CalendarClock, Loader2, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldWrapper } from "@/components/form/field-wrapper";
import { FormSection } from "./form-section";
import { formatWeekdays } from "@/lib/weekday";
import { useBatches } from "../hooks/use-batches";
import { quickAddStudentSchema, type QuickAddStudentInput, type QuickAddStudentValues } from "../schema";

const defaultValues: QuickAddStudentInput = {
  firstName: "",
  lastName: "",
  // Default to today — the common case is same-day admission.
  joiningDate: new Date().toISOString().split("T")[0] as unknown as QuickAddStudentInput["joiningDate"],
  numberOfSessions: "" as unknown as QuickAddStudentInput["numberOfSessions"],
  paymentReceived: "" as unknown as QuickAddStudentInput["paymentReceived"],
  batchId: "",
  healthIssues: [],
};

export function QuickAddStudentForm() {
  const router = useRouter();
  const [submitAction, setSubmitAction] = useState<"save" | "saveAndAddAnother" | null>(null);
  const { batches, isLoading: batchesLoading, error: batchesError } = useBatches();

  const form = useForm<QuickAddStudentInput, unknown, QuickAddStudentValues>({
    resolver: standardSchemaResolver(quickAddStudentSchema),
    defaultValues,
    mode: "onTouched",
  });

  const { register, control, handleSubmit, reset, setError, setFocus, formState } = form;
  const { errors } = formState;
  const isSubmitting = submitAction !== null;

  async function submit(values: QuickAddStudentValues, addAnother: boolean) {
    setSubmitAction(addAnother ? "saveAndAddAnother" : "save");
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          joiningDate: new Date(values.joiningDate).toISOString(),
          numberOfSessions: values.numberOfSessions,
          paymentReceived: values.paymentReceived,
          batchId: values.batchId,
          healthIssues: [],
        }),
      });

      if (!res.ok) {
        const body: { error?: string; fieldErrors?: Record<string, string[]> } = await res
          .json()
          .catch(() => ({}));

        if (body.fieldErrors) {
          for (const [field, messages] of Object.entries(body.fieldErrors)) {
            setError(field as keyof QuickAddStudentValues, { message: messages[0] });
          }
        }
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      const data: { student: { id: string } } = await res.json();

      toast.success(`${values.firstName} ${values.lastName} was admitted successfully`, {
        description: "Send them the edit link via WhatsApp so they can fill in the rest.",
      });

      if (addAnother) {
        reset(defaultValues);
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
    <form noValidate onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
      <FormSection icon={UserPlus} title="Student">
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldWrapper htmlFor="firstName" label="First name" required error={errors.firstName?.message}>
            <Input id="firstName" {...register("firstName")} />
          </FieldWrapper>
          <FieldWrapper htmlFor="lastName" label="Last name" required error={errors.lastName?.message}>
            <Input id="lastName" {...register("lastName")} />
          </FieldWrapper>
        </div>

        <FieldWrapper htmlFor="joiningDate" label="Date of joining" required error={errors.joiningDate?.message}>
          <Input id="joiningDate" type="date" {...register("joiningDate")} />
        </FieldWrapper>

        <div className="grid gap-5 sm:grid-cols-2">
          <FieldWrapper
            htmlFor="numberOfSessions"
            label="Number of sessions"
            required
            error={errors.numberOfSessions?.message}
          >
            <Input
              id="numberOfSessions"
              type="number"
              inputMode="numeric"
              min={1}
              step="1"
              placeholder="e.g. 12"
              {...register("numberOfSessions")}
            />
          </FieldWrapper>
          <FieldWrapper
            htmlFor="paymentReceived"
            label="Fees received (₹)"
            required
            error={errors.paymentReceived?.message}
          >
            <Input
              id="paymentReceived"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="e.g. 3000"
              {...register("paymentReceived")}
            />
          </FieldWrapper>
        </div>
      </FormSection>

      <FormSection icon={CalendarClock} title="Batch Allocation" description="Assign the student to one batch">
        <FieldWrapper label="Batch" required error={errors.batchId?.message ?? batchesError ?? undefined}>
          {batchesLoading ? (
            <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading batches…
            </div>
          ) : (
            <Controller
              name="batchId"
              control={control}
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2.5 sm:grid-cols-2">
                  {batches.map((batch) => (
                    <Label
                      key={batch.id}
                      htmlFor={`batch-${batch.id}`}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-input p-3.5 font-normal transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5"
                    >
                      <RadioGroupItem id={`batch-${batch.id}`} value={batch.id} className="mt-0.5" />
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
            />
          )}
        </FieldWrapper>
      </FormSection>

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
