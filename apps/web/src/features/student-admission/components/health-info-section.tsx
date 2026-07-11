"use client";

import { Controller } from "react-hook-form";
import { HeartPulse } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldWrapper } from "@/components/form/field-wrapper";
import { FormSection } from "./form-section";
import { HEALTH_ISSUES } from "../constants";
import type { AdmissionUseFormReturn } from "../client-schema";

export function HealthInfoSection({ form }: { form: AdmissionUseFormReturn }) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;

  const selectedIssues = watch("healthIssues");
  const showDetails = selectedIssues?.includes("OTHER");

  return (
    <FormSection
      icon={HeartPulse}
      title="Health Information"
      description="Select anything relevant to this student's practice"
    >
      <Controller
        name="healthIssues"
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {HEALTH_ISSUES.map((issue) => {
              const checked = field.value?.includes(issue.value) ?? false;
              return (
                <Label
                  key={issue.value}
                  htmlFor={`health-${issue.value}`}
                  className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                >
                  <Checkbox
                    id={`health-${issue.value}`}
                    checked={checked}
                    onCheckedChange={(next) => {
                      const current = field.value ?? [];
                      field.onChange(
                        next ? [...current, issue.value] : current.filter((v) => v !== issue.value),
                      );
                    }}
                  />
                  {issue.label}
                </Label>
              );
            })}
          </div>
        )}
      />

      {showDetails && (
        <FieldWrapper
          htmlFor="healthIssueDetails"
          label="Detailed health information"
          required
          error={errors.healthIssueDetails?.message}
        >
          <Textarea
            id="healthIssueDetails"
            placeholder="Describe the health condition in more detail"
            rows={3}
            {...register("healthIssueDetails")}
          />
        </FieldWrapper>
      )}
    </FormSection>
  );
}
