"use client";

import { Controller } from "react-hook-form";
import { CalendarClock, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FieldWrapper } from "@/components/form/field-wrapper";
import { FormSection } from "./form-section";
import { useBatches } from "../hooks/use-batches";
import type { AdmissionUseFormReturn } from "../client-schema";

export function BatchAllocationSection({ form }: { form: AdmissionUseFormReturn }) {
  const { control, formState: { errors } } = form;
  const { batches, isLoading, error } = useBatches();

  return (
    <FormSection icon={CalendarClock} title="Batch Allocation" description="Assign the student to one batch">
      <FieldWrapper label="Batch" required error={errors.batchId?.message ?? error ?? undefined}>
        {isLoading ? (
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
                      <span className="text-xs text-muted-foreground">{batch.days}</span>
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
  );
}
