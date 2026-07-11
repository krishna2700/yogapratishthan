"use client";

import { ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FieldWrapper } from "@/components/form/field-wrapper";
import { FormSection } from "./form-section";
import type { AdmissionUseFormReturn } from "../client-schema";

export function AdmissionDetailsSection({ form }: { form: AdmissionUseFormReturn }) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <FormSection icon={ClipboardList} title="Admission Details">
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldWrapper
          htmlFor="paymentReceived"
          label="Payment received (₹)"
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
      </div>
    </FormSection>
  );
}
